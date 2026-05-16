# ADR-002: Client state management — Zustand over Redux

- Status: accepted
- Date: 2026-05-15
- Decider(s): @emre

## Context

The dashboard SPA needs to share state across routes for:

- Auth state (`useAppStore`) — current user, role, tokens (in-memory),
  persistent UI preferences (theme, locale).
- Dashboard UI prefs (`useDashboardStore`) — sidebar collapsed, default
  date range, last-visited tab.
- Anonymous currency selector (`useCurrencyStore`) — pricing page.

Server state (queries, mutations) is already covered by TanStack Query
and is **not** in scope for this ADR.

Forces:

- Most state slices are small and independent; we do not need a
  unified action/reducer hierarchy.
- We want a 4-line store, not a 40-line slice + reducer + action types
  + selectors + middleware boilerplate.
- Persistence is required for some slices (theme, locale) but must NOT
  touch the auth tokens (those are in-memory only — see ADR-002 +
  Aşama 4 of P14 FE).
- Tree-shaking matters for the marketing pages, which load no auth code.

## Decision

Use **Zustand** for all client-only UI state with the following rules:

1. One store per logical concern (auth, dashboard prefs, currency).
2. `persist` middleware applied per-store, with a `partialize` allowlist
   that EXCLUDES sensitive fields (`token`, `refreshToken`, `user.email`).
3. All mutations go through `set()` and remain immutable.
4. Cross-store coordination happens via a `useStoreReset` hook (added
   in P14 FE) — never through cross-imports.

Server state stays in TanStack Query. Form state stays in React Hook
Form. We do not introduce Redux, Recoil, Jotai, MobX, or Effector.

## Consequences

**Easier:**

- New slices ship as a 10-line file + tests; no boilerplate tax.
- Marketing pages don't pay for dashboard auth state — Zustand's
  per-store bundling means each route imports only what it needs.
- Devtools panel via `zustand/middleware/devtools` for ad-hoc debugging.

**Harder:**

- No built-in action log → must rely on Sentry breadcrumbs or manual
  log lines for traceability of significant state changes.
- Time-travel debugging is not as polished as Redux DevTools.
- Cross-slice transactions require explicit composition (the
  `useStoreReset` pattern); no built-in equivalent of `combineReducers`.

**Risks accepted:**

- A junior engineer might be tempted to `import` one store into another
  and create circular dependencies. Code review catches this; ESLint
  rule `import/no-cycle` enforces it.

## Alternatives considered

- **Redux Toolkit** — rejected as overkill for our slice count and the
  boilerplate it imposes on marketing-page contributors.
- **Jotai** — rejected because atom-per-key granularity is harder to
  reason about for our handful of medium-sized stores.
- **React Context only** — rejected because re-render granularity is
  poor for the dashboard (every consumer re-renders on any change).
- **MobX** — rejected because the team has no MobX experience and the
  observable model is harder to mental-model than Zustand's plain set/get.
