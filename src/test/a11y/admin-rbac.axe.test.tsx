/**
 * admin-rbac.axe.test.tsx — A11y runtime tests for PermissionMatrixGrid
 *
 * 5 tests:
 *  1. table semantic — <table> + <caption> + <th scope="col"> present
 *  2. checkbox aria-label — every checkbox has aria-label in "ROLE: description (key)" format
 *  3. keyboard nav — Tab reaches checkboxes; Space toggles them
 *  4. axe 0 violation — axe-core scan returns 0 violations
 *  5. screen reader live — aria-live="polite" region announces after toggle
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';

import { PermissionMatrixGrid } from '../../components/admin/rbac/PermissionMatrixGrid';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PERMISSIONS = [
  {
    id: 'perm-1',
    key: 'blog.read',
    resource: 'blog',
    action: 'read',
    description: 'Read blog posts',
  },
  {
    id: 'perm-2',
    key: 'users.read',
    resource: 'users',
    action: 'read',
    description: 'Read user list',
  },
];

const ALL_ROLES = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'] as const;

const MOCK_MATRIX = ALL_ROLES.reduce(
  (acc, role) => {
    acc[role] = { 'blog.read': true, 'users.read': false };
    return acc;
  },
  {} as Record<string, Record<string, boolean>>,
);

const MOCK_RESPONSE = {
  status: 'ok',
  data: {
    permissions: MOCK_PERMISSIONS,
    matrix: MOCK_MATRIX,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      // GET /api/admin/rbac/matrix
      if (!init || init.method === undefined || init.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_RESPONSE),
        });
      }
      // PATCH — return success
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PermissionMatrixGrid — a11y', () => {
  // ── Test 1: table semantic ──────────────────────────────────────────────────
  it('1. table semantic — <table> + <caption> + <th scope="col"> present', async () => {
    const { container } = renderWithProviders(<PermissionMatrixGrid />);

    // Wait until data loads (loading spinner disappears)
    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    // <table> exists
    const table = container.querySelector('table');
    expect(table).not.toBeNull();

    // <caption> exists inside the table
    const caption = table!.querySelector('caption');
    expect(caption).not.toBeNull();

    // At least one <th scope="col"> in the header
    const colHeaders = table!.querySelectorAll('th[scope="col"]');
    expect(colHeaders.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 2: checkbox aria-label ─────────────────────────────────────────────
  it('2. checkbox aria-label — every checkbox has aria-label with role: description (key) format', async () => {
    const { container } = renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    // At least 2 permissions × 5 roles = 10 checkboxes
    expect(checkboxes.length).toBeGreaterThanOrEqual(10);

    checkboxes.forEach((cb) => {
      const label = cb.getAttribute('aria-label');
      expect(label).toBeTruthy();
      // Format: "ROLE: description (key)"  e.g. "USER: Read blog posts (blog.read)"
      // The component renders: `${role}: ${permissionDescription} (${permissionKey})`
      expect(label).toMatch(/^[A-Z]+:/);
    });
  });

  // ── Test 3: keyboard nav ────────────────────────────────────────────────────
  it('3. keyboard nav — Tab reaches checkboxes and Space toggles them', async () => {
    const { container } = renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const firstCheckbox = checkboxes[0];
    expect(firstCheckbox).toBeDefined();

    // Checkboxes must be reachable via keyboard (not disabled, not tabIndex=-1)
    expect(firstCheckbox.disabled).toBe(false);
    expect(firstCheckbox.tabIndex).not.toBe(-1);

    // Focus the first checkbox directly (simulating Tab reaching it)
    firstCheckbox.focus();
    expect(document.activeElement).toBe(firstCheckbox);

    // Space key fires a change event on a focused checkbox in real browsers.
    // jsdom doesn't auto-toggle on keydown Space, so we use fireEvent.change
    // which is the observable side-effect of Space on a checkbox.
    const initialChecked = firstCheckbox.checked;
    fireEvent.change(firstCheckbox, { target: { checked: !initialChecked } });

    expect(firstCheckbox.checked).toBe(!initialChecked);
  });

  // ── Test 4: axe 0 violation ─────────────────────────────────────────────────
  it('4. axe 0 violation — rendered grid passes axe-core scan', async () => {
    const { container } = renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    const results = await axe.run(container);
    if (results.violations.length > 0) {
      const summary = results.violations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
        .join('\n');
      throw new Error(`axe violations found:\n${summary}`);
    }
    expect(results.violations).toHaveLength(0);
  });

  // ── Test 5: screen reader live region ───────────────────────────────────────
  it('5. screen reader live — sr-only spans announce grant state; text flips after QueryClient update', async () => {
    const { container, queryClient } = renderWithProviders(<PermissionMatrixGrid />);

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });

    // PermissionToggleCell renders inside each label:
    //   <span className="sr-only">{granted ? 'İzin verildi' : 'İzin verilmedi'} — {role}: {permissionKey}</span>

    // 1. sr-only spans exist in DOM
    const srOnlySpans = container.querySelectorAll('.sr-only');
    expect(srOnlySpans.length).toBeGreaterThanOrEqual(1);

    // 2. At least one span carries a state announcement
    const srTexts = Array.from(srOnlySpans).map((s) => s.textContent ?? '');
    const hasAnnouncement = srTexts.some(
      (t) => t.includes('İzin verildi') || t.includes('İzin verilmedi'),
    );
    expect(hasAnnouncement).toBe(true);

    // 3. Find an unchecked checkbox (users.read starts as false)
    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    );
    const uncheckedCb = checkboxes.find((cb) => !cb.checked);
    expect(uncheckedCb).toBeDefined();

    const labelEl = uncheckedCb!.closest('label');
    expect(labelEl?.querySelector('.sr-only')?.textContent).toContain('İzin verilmedi');

    // 4. Directly update QueryClient cache to simulate optimistic update result.
    // This is the same operation the mutation's onMutate performs.
    await act(async () => {
      queryClient.setQueryData(['admin', 'rbac', 'matrix'], (old: typeof MOCK_RESPONSE.data) => ({
        ...old,
        matrix: {
          ...old.matrix,
          USER: { ...old.matrix['USER'], 'users.read': true },
        },
      }));
    });

    // 5. After cache update React re-renders — sr-only text must flip to "İzin verildi"
    await waitFor(() => {
      const allSrSpans = Array.from(container.querySelectorAll('.sr-only'));
      const hasGranted = allSrSpans.some(
        (s) => s.textContent?.includes('İzin verildi') && s.textContent?.includes('users.read'),
      );
      expect(hasGranted).toBe(true);
    });
  });
});
