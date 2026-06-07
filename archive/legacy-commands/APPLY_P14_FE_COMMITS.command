#!/bin/bash
# P14 Track 1 — Frontend Surgical Root Hardening
# Atomic commit recipe — run AFTER APPLY_P13_COMMITS.command on the host.
#
# This recipe stages and commits the P14 FE changes as 12 atomic commits.
# Each commit is Conventional Commits + Turkish body.
#
# Pre-flight:
#   - Working tree must be clean of unrelated changes (run `git status` first)
#   - APPLY_P13_COMMITS.command must have been run (DataRightsPage tracked)
#   - Currently on branch main (or feature branch is fine)

set -euo pipefail

cd "$(dirname "$0")"

echo "==> P14 FE commit recipe starting"
echo "    cwd: $(pwd)"
echo "    branch: $(git rev-parse --abbrev-ref HEAD)"
echo

# Sanity: confirm we're inside the ecypro repo
if [ ! -f "package.json" ] || ! grep -q "ecypro" package.json 2>/dev/null; then
  echo "ERROR: package.json does not look like ecypro. Aborting."
  exit 1
fi

# Helper — commit if there is something staged for the listed paths
stage_and_commit() {
  local msg="$1"; shift
  local paths=("$@")
  local any_change=0
  for p in "${paths[@]}"; do
    if [ -e "$p" ]; then
      git add -- "$p" && any_change=1
    fi
  done
  if [ "$any_change" -eq 0 ]; then
    echo "  (no files for: $msg)"
    return 0
  fi
  # If there's nothing actually staged (e.g. file already matches HEAD), skip.
  if git diff --cached --quiet; then
    echo "  (nothing to commit for: $msg — already in tree?)"
    return 0
  fi
  git commit -m "$msg"
}

# ─── C1: memory — useSSE reconnect timer ──────────────────────────────────
stage_and_commit "fix(memory): track sse reconnect timeout in ref + clear on disconnect

P14 — useSSE setTimeout(connect, delay) reconnect was untracked. When the
component unmounted during the exponential backoff delay, the callback still
fired and opened a new EventSource that nothing owned. Now we keep the timer
handle in reconnectTimerRef and clear it on disconnect / unmount; mountedRef
guards state updates after unmount.

Refs: P14_FE_MEMORY_AUDIT row #1" \
  src/hooks/useSSE.ts

# ─── C2: memory — AnalyticsConsumer listener cleanup ──────────────────────
stage_and_commit "fix(memory): remove window/document listeners on AnalyticsConsumer.stop()

P14 — trackScroll / trackIdle / trackContactForm attached 6 listeners
(window scroll, mousemove, keydown, touchstart, document focusin, submit)
but stop() only detached popstate. HMR or repeated start() left duplicates.
Stored each handler on the class so stop() can removeEventListener them.

Refs: P14_FE_MEMORY_AUDIT row #2" \
  src/lib/director/analytics-consumer.ts

# ─── C3: memory — realtimeService wrong cleanup function ──────────────────
stage_and_commit "fix(memory): clearInterval (not clearTimeout) on simulation-mode timer

P14 — startSimulationMode() created a setInterval but disconnect() called
clearTimeout, which is a no-op for interval handles. Renamed the field to
simulationTimer (clearer intent), switched to clearInterval, and guarded
against double-set if simulation mode re-entered.

Refs: P14_FE_MEMORY_AUDIT row #3" \
  src/services/realtimeService.ts

# ─── C4: memory — MatrixObserver dispose ──────────────────────────────────
stage_and_commit "fix(memory): expose dispose() to detach MatrixObserver visibilitychange listener

P14 — singleton MatrixObserver added a document visibilitychange listener
with no detach path; HMR teardown could leave duplicates. Added a stored
visibilityHandler ref + a public dispose() that disconnects PerformanceObserver,
clears the memory interval, and removes the visibility listener.

Refs: P14_FE_MEMORY_AUDIT row #4" \
  src/lib/matrix/observer.ts

# ─── C5: memory — LiveLeadFeed poll guard ─────────────────────────────────
stage_and_commit "fix(memory): guard LiveLeadFeed poll interval against double-set in catch branch

P14 — if EventSource construction threw, the catch branch unconditionally
assigned pollRef.current = setInterval(...), potentially overwriting an
interval the error handler had already started. Added the same
'if (!pollRef.current)' guard the error handler uses.

Refs: P14_FE_MEMORY_AUDIT row #5" \
  src/components/admin/LiveLeadFeed.tsx

# ─── C6: race — ContactForm mountedRef ────────────────────────────────────
stage_and_commit "fix(race): mountedRef guard on ContactForm async state updates

P14 — ContactForm awaits a 1500ms simulated submit; if the user navigates
away mid-submit, the .finally setState produced a React 'state update on
unmounted component' warning. Added mountedRef + guarded every setState
after await. Also a defensive submit-lock for non-RHF re-entry.

Refs: P14_FE_RACE_FIXES section 2" \
  src/components/forms/ContactForm.tsx

# ─── C7: race — DataRightsPage AbortController + mountedRef ───────────────
# Note: if P13 has already committed DataRightsPage, this commits the race
# fixes as an incremental change. If P13 hasn't been applied yet, this commit
# may either include DataRightsPage as a NEW file (P13 content + race fix
# merged) or skip — depending on tree state.
stage_and_commit "fix(race): AbortController + mountedRef on DataRightsPage submit

P14 — POST /api/gdpr/* submission set component state without cancellation;
fast unmount or double-click could trigger stale-state writes. Each submit
now creates a fresh AbortController (aborting any earlier in-flight one),
checks ac.signal.aborted + mountedRef before setState, and swallows
intentional AbortError on unmount.

Refs: P14_FE_RACE_FIXES section 2" \
  src/pages/DataRightsPage.tsx

# ─── C8: race — regression test suite ─────────────────────────────────────
stage_and_commit "test(race): regression suite for unmount / abort guards

P14 — vitest + RTL coverage:
  - ContactForm: no 'state update on unmounted' after mid-submit unmount
  - DataRightsPage: in-flight fetch signal.aborted === true on unmount

Refs: P14_FE_RACE_FIXES section 4" \
  src/test/race-conditions.test.tsx

# ─── C9: types — strict flags + override modifier ─────────────────────────
stage_and_commit "feat(types): enable noImplicitOverride + useUnknownInCatchVariables + add override modifiers

P14 — opt into two additional strict TS flags. noImplicitOverride surfaces
9 lifecycle methods on three React error boundary classes; added 'override'
keyword to satisfy. useUnknownInCatchVariables compiles clean (codebase
already uses 'catch (err)' + '(err as Error)' pattern).

tsc --noEmit -p tsconfig.json → 0 errors.

Refs: P14_FE_TYPE_COVERAGE" \
  tsconfig.json \
  src/components/common/ErrorBoundary.tsx \
  src/components/common/GlobalErrorBoundary.tsx \
  src/components/ui/SovereignBoundary.tsx

# ─── C10: types — drop as any[] in AdminBlogPage ──────────────────────────
stage_and_commit "refactor(types): structural typing for blog-posts.json import (drop any[])

P14 — AdminBlogPage cast raw JSON to any[]; replaced with a structural
RawPost record type and removed the eslint-disable. Hand-written 'any'
count now bounded to 3 (Microsoft Clarity 3rd-party stub).

Refs: P14_FE_TYPE_COVERAGE section 3" \
  src/pages/admin/AdminBlogPage.tsx

# ─── C11: state — useStoreReset hook ──────────────────────────────────────
stage_and_commit "feat(state): add useStoreReset hook for logout defense-in-depth

P14 — central reset helper that calls useAppStore.logout() and additionally
wipes 'ecypro_admin_token' / 'ecypro_admin_refresh' localStorage keys that
bypassed Zustand. keepUiPrefs (default true) preserves dashboard widget
prefs. Both function (resetAllStores) and hook (useStoreReset) variants
exported. Call-site wiring is P15 scope.

Refs: P14_FE_STATE_AUDIT section 3" \
  src/store/useStoreReset.ts

# ─── C12: error — per-route boundary + RouteContainer + wiring ────────────
stage_and_commit "feat(error): per-route RouteErrorBoundary with Sentry + a11y recovery UX

P14 — new src/components/error/RouteErrorBoundary.tsx (class boundary with
retry / home buttons, focus-on-mount heading, role=alert, Sentry capture).
RouteContainer composes Suspense + boundary as a single import. Wired the
three high-risk routes — /pricing, /contact, /privacy/data-rights — to
RouteContainer; remaining routes migrate in P15.

Refs: P14_FE_ERROR_BOUNDARIES" \
  src/components/error/RouteErrorBoundary.tsx \
  src/components/error/RouteContainer.tsx \
  src/App.tsx

# ─── C13: perf — per-route bundle budget + sitemap drift ──────────────────
stage_and_commit "feat(perf): per-route bundle budget gates + sync sitemap with route map

P14 — added 14 per-route size-limit entries (PricingPage / ServicesPage /
AboutPage / ContactPage / Blog / CaseStudies / DataRightsPage / privacy
pages / DashboardPage) so a single route blow-out fails CI in isolation
instead of hiding inside the 'initial JS' aggregate. Sitemap drift fixed —
/privacy/data-rights (P13) now listed with monthly changefreq, priority 0.5.

Refs: P14_FE_PERF_BUDGET" \
  .size-limit.json \
  public/sitemap.xml

# ─── C14: docs — P14 FE sprint closure ────────────────────────────────────
stage_and_commit "docs(p14-fe): sprint closure reports + APPLY_P14_FE recipe

P14 Track 1 — Frontend Surgical Root Hardening. 6 audit + fix areas:
memory leaks, race conditions, type coverage, state management, per-route
perf budget, error boundary depth. 14 atomic commits. FE+BE typecheck 0 hata.

Reports:
  - outputs/P14_FE_MEMORY_AUDIT.md
  - outputs/P14_FE_RACE_FIXES.md
  - outputs/P14_FE_TYPE_COVERAGE.md
  - outputs/P14_FE_STATE_AUDIT.md
  - outputs/P14_FE_PERF_BUDGET.md
  - outputs/P14_FE_ERROR_BOUNDARIES.md
  - outputs/P14_FE_FINAL.md

Refs: P14_FE_FINAL" \
  outputs/P14_FE_MEMORY_AUDIT.md \
  outputs/P14_FE_RACE_FIXES.md \
  outputs/P14_FE_TYPE_COVERAGE.md \
  outputs/P14_FE_STATE_AUDIT.md \
  outputs/P14_FE_PERF_BUDGET.md \
  outputs/P14_FE_ERROR_BOUNDARIES.md \
  outputs/P14_FE_FINAL.md \
  APPLY_P14_FE_COMMITS.command

echo
echo "==> P14 FE commit recipe complete."
echo "    Verify: git log --oneline -n 16"
echo "    Next: APPLY_P14_BE_COMMITS.command (if backend track produced one)"
echo "    Then: READY_TO_PUSH.command before git push origin main"
