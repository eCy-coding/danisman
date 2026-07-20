/**
 * admin-axe-harness.tsx — shared render + mock setup for the admin-panel
 * axe-core parametrized test factory (see admin-pages-catalog.axe.test.tsx).
 *
 * Before this file, each admin a11y suite (admin-{deals,leads,pages,rbac})
 * hand-rolled its own render wrapper + network mocks, so coverage only grew
 * one bespoke file at a time (4 suites for ~49 pages). This module centralizes
 * that setup so the factory test can iterate a route table instead.
 *
 * Contains:
 *  - generic network mocks for `apiClient` (src/lib/api) and `adminFetch`
 *    (src/lib/admin-fetch) — the two fetch layers every admin page funnels
 *    through — so pages mount without a live backend;
 *  - mocks for the SSE/EventSource-backed hooks that throw
 *    "EventSource is not defined" in jsdom otherwise (useSSE, useAdminEvents);
 *  - the @dnd-kit/core mock every drag-and-drop admin surface needs
 *    (mirrors DealKanban.test.tsx / admin-deals.axe.test.tsx exactly);
 *  - renderAdminPage() — HelmetProvider + QueryClientProvider + MemoryRouter,
 *    wrapped in a <main> landmark to mirror AdminLayout.tsx's real shell
 *    (src/components/admin/layout/AdminLayout.tsx renders <Outlet/> inside
 *    <main>) — pages are normally never mounted outside that landmark, so
 *    reproducing it here avoids an axe `region` false positive rather than
 *    disabling the rule;
 *  - runAxe() — axe-core scan + a readable violation summary (mirrors
 *    admin-rbac.axe.test.tsx test #4).
 *
 * Mock hoisting: Vitest's transform hoists `vi.mock` calls to the top of
 * *this* file (it processes every module reached during a test run, not
 * just `*.test.ts`). The factory file imports this module statically, so
 * these mocks are registered before any test body runs. Page components
 * themselves must be loaded with a *dynamic* `import()` inside each test
 * (the factory does this via `import.meta.glob`) — a static top-level page
 * import would execute during this module's own evaluation and could race
 * mock registration.
 */
import React from 'react';
import { vi } from 'vitest';
import { render, act, type RenderResult } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import axe from 'axe-core';

// ─── Generic "no live backend" network mocks ───────────────────────────────
//
// Default responses are empty-but-shape-tolerant: the returned "list" value
// is simultaneously an empty array (`res.data.data.map(...)` works) and
// carries the common wrapper keys (`items`, `total`, `page`, `limit`,
// `count`, `hasMore`) so `res.data.data.items.map(...)` also works. This
// covers the two dominant response shapes used across admin pages without
// requiring one override per page. Pages with a genuinely different shape
// (nested `summary`/`trend` objects, RBAC matrix, etc.) get a per-page
// `configure()` override in the factory table instead of widening this
// default further.

interface ListEnvelope extends Array<unknown> {
  items: unknown[];
  total: number;
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function emptyListEnvelope(): ListEnvelope {
  const arr: unknown[] = [];
  return Object.assign(arr, {
    items: arr,
    total: 0,
    count: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  }) as ListEnvelope;
}

export function genericOkEnvelope(): { data: { status: string; data: ListEnvelope } } {
  return { data: { status: 'ok', data: emptyListEnvelope() } };
}

export const apiGetMock = vi.fn();
export const apiPostMock = vi.fn();
export const apiPutMock = vi.fn();
export const apiPatchMock = vi.fn();
export const apiDeleteMock = vi.fn();

/** Resets every shared mock to its generic default. Call from `beforeEach`. */
export function resetAdminMocks(): void {
  apiGetMock.mockReset().mockImplementation(() => Promise.resolve(genericOkEnvelope()));
  apiPostMock.mockReset().mockImplementation(() => Promise.resolve(genericOkEnvelope()));
  apiPutMock.mockReset().mockImplementation(() => Promise.resolve(genericOkEnvelope()));
  apiPatchMock.mockReset().mockImplementation(() => Promise.resolve(genericOkEnvelope()));
  apiDeleteMock.mockReset().mockImplementation(() => Promise.resolve(genericOkEnvelope()));
  adminFetchMock.mockReset().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok', data: emptyListEnvelope() }),
      text: () => Promise.resolve(''),
    }),
  );
}

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
    put: (...args: unknown[]) => apiPutMock(...args),
    patch: (...args: unknown[]) => apiPatchMock(...args),
    delete: (...args: unknown[]) => apiDeleteMock(...args),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authApi: {
    getMe: vi.fn().mockResolvedValue({ data: { data: null } }),
    login: vi.fn().mockResolvedValue({ data: { data: null } }),
    register: vi.fn().mockResolvedValue({ data: { data: null } }),
    logout: vi.fn().mockResolvedValue({ data: {} }),
  },
  bookingsApi: {
    getAll: vi.fn().mockResolvedValue({ data: { data: [] } }),
    create: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
  analyticsApi: {
    track: vi.fn().mockResolvedValue({ data: {} }),
  },
  IS_SIMULATION_MODE: true,
  scheduleHealthCheck: vi.fn(),
}));

export const adminFetchMock = vi.fn();

vi.mock('../../lib/admin-fetch', () => ({
  adminFetch: (...args: unknown[]) => adminFetchMock(...args),
  adminFetchJson: async (...args: unknown[]) => {
    const res = (await adminFetchMock(...args)) as { json: () => unknown };
    return res.json();
  },
}));

// ─── SSE / EventSource hooks — jsdom has no `EventSource` global ───────────

vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(() => ({ isConnected: false, lastEvent: null, reconnect: vi.fn() })),
}));

vi.mock('../../hooks/useAdminEvents', () => ({
  useAdminEvents: vi.fn(),
}));

// ─── Toasts — sonner renders a portal; keep it a no-op in tests ───────────

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

// ─── @dnd-kit/core — mirrors DealKanban.test.tsx / admin-deals.axe.test.tsx ─

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'dnd-context' }, children),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  };
});

// ─── Render helper ──────────────────────────────────────────────────────────

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export interface RenderAdminPageOptions {
  /** Route pattern the page is registered under, e.g. '/leads/:id'. */
  route?: string;
  /** MemoryRouter initial history, e.g. ['/leads/lead-1']. */
  initialEntries?: string[];
}

export interface RenderedAdminPage extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Renders an admin page with the same provider stack the real app shell
 * gives it (query client, router, Helmet) plus the <main> landmark
 * AdminLayout normally supplies — see the module doc for why.
 */
export function renderAdminPage(
  ui: React.ReactElement,
  opts: RenderAdminPageOptions = {},
): RenderedAdminPage {
  const queryClient = makeQueryClient();
  const { route, initialEntries = ['/admin'] } = opts;
  const body = route
    ? React.createElement(Routes, null, React.createElement(Route, { path: route, element: ui }))
    : ui;

  const utils = render(
    React.createElement(
      HelmetProvider,
      null,
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries },
          React.createElement('main', null, body),
        ),
      ),
    ),
  );
  return { ...utils, queryClient };
}

/**
 * Flushes the microtask/macrotask queue inside `act()` so mocked
 * `useQuery`/`adminFetch` promises (which resolve on the next tick) have
 * settled and their resulting re-render has committed before axe scans the
 * DOM. Without this, effects that throw after data resolves (a real bug, or
 * a shape mismatch in a mock) surface as an "Uncaught Exception" *outside*
 * any test's boundary instead of failing the specific test — this makes the
 * failure attributable and catchable.
 *
 * Runs a few rounds, not one: AdminBlogPage loads its post list via a
 * dynamic `import('../../data/blog-posts.json')` inside a `useEffect`,
 * which resolves one extra microtask hop later than a mocked
 * `Promise.resolve(...)` — one round was enough on an idle machine but
 * raced (empty list, `settle()` returning before the real posts committed)
 * once the full suite's load made the extra hop miss the single tick.
 */
export async function settle(rounds = 3): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

// ─── axe helper ─────────────────────────────────────────────────────────────

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container);
  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes
            .map((n) => n.target.join(' '))
            .join('\n  ')}`,
      )
      .join('\n\n');
    throw new Error(`axe violations found:\n${summary}`);
  }
}
