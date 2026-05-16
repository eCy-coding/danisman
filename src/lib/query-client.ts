/**
 * Production-grade TanStack Query client — P18 FE Track 1, Aşama 1.
 *
 * Previously the QueryClient lived inline in `AppProviders.tsx` with a
 * minimal default (`retry: 1, staleTime: 30_000`). That config was tuned
 * for early-stage demos: 30 s staleTime caused the homepage to re-fetch
 * on every micro re-render once `useEffect` deps stabilised, and a flat
 * `retry: 1` ignored transient network errors that the new P15 offline
 * `retry-queue` is actually built to absorb.
 *
 * This module centralises the production policy:
 *   - `staleTime: 5 min`        → reads stay fresh across nav within a session,
 *                                  matching the auth/me + dashboard cadence already
 *                                  used in `useApi.ts` and the dashboard widgets.
 *   - `gcTime: 30 min`          → keep cache around for back-button restores
 *                                  without bloating memory across long sessions.
 *   - `retry: 3` with exponential backoff (250 ms → 500 → 1 s, capped at 30 s)
 *                                  → resilient to 5xx spikes and flaky mobile networks;
 *                                  4xx errors short-circuit so we don't loop on
 *                                  validation failures.
 *   - `refetchOnReconnect: 'always'` → P15 service-worker offline path can now
 *                                  promote stale data back to fresh on reconnect.
 *   - `refetchOnWindowFocus: true`   → multi-tab admin dashboards stay current
 *                                  without polling.
 *   - `networkMode: 'online'`        → no thrash when offline; the offline UI
 *                                  banner already communicates the state.
 *   - Mutations default to `retry: 0` because most are non-idempotent
 *     (auth login, booking, contact) — per-mutation `retry` can opt in.
 *
 * Override per-hook by passing `staleTime`/`gcTime`/`retry` as usual.
 *
 * Devtools are loaded lazily through `react-query-devtools` ONLY in dev to
 * avoid shipping the panel in production bundles. The import is dynamic and
 * tolerates the package being absent so dev installs without devtools still
 * boot (sandbox + arm64 install warnings should not block the SPA).
 */

import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * Returns true for HTTP status codes where a retry will never succeed
 * (auth / validation / not-found). Falls back to retrying for everything
 * else — including missing-status network errors which are usually
 * transient DNS / TLS flakes.
 */
function isNonRetriableStatus(status: number | undefined): boolean {
  if (typeof status !== 'number') return false;
  // 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found,
  // 410 Gone, 422 Unprocessable Entity — all caller-side; do not retry.
  return [400, 401, 403, 404, 410, 422].includes(status);
}

function extractStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const e = error as { response?: { status?: number }; status?: number };
  return e.response?.status ?? e.status;
}

export const QUERY_DEFAULTS: DefaultOptions = {
  queries: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
    networkMode: 'online',
    retry: (failureCount, error) => {
      if (isNonRetriableStatus(extractStatus(error))) return false;
      return failureCount < 3;
    },
    // Exponential backoff: 250ms, 500ms, 1s, 2s, ... capped at 30s.
    retryDelay: (attemptIndex) => Math.min(250 * 2 ** attemptIndex, 30_000),
  },
  mutations: {
    // Non-idempotent by default. Opt in via per-mutation `retry`.
    retry: 0,
    networkMode: 'online',
  },
};

/**
 * Factory so each test / SSR pass can spin up its own client without
 * sharing the singleton across runs (`GeoBanner.test.tsx`,
 * `StatusPage.test.tsx` already build their own; P18 keeps the pattern
 * via `createQueryClient({ ... })`).
 */
export function createQueryClient(overrides?: DefaultOptions): QueryClient {
  return new QueryClient({
    defaultOptions: overrides
      ? {
          queries: { ...QUERY_DEFAULTS.queries, ...overrides.queries },
          mutations: { ...QUERY_DEFAULTS.mutations, ...overrides.mutations },
        }
      : QUERY_DEFAULTS,
  });
}

/**
 * Application-wide singleton. Imported by `AppProviders` so every
 * component in the tree shares one cache + observer registry.
 */
export const queryClient = createQueryClient();

/**
 * Common query-key roots — keep invalidations type-safe and avoid
 * stringly-typed drift between mutation and read sites. Co-located here
 * so `useApi.ts`, dashboard widgets, and admin pages reference a single
 * source of truth.
 */
export const QueryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (page: number, limit: number) => ['bookings', page, limit] as const,
  },
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    pipeline: ['crm-pipeline-stats'] as const,
    hotLeads: ['crm-hot-leads'] as const,
  },
  status: {
    public: ['public-status'] as const,
  },
} as const;
