# E2E Flaky Test Analysis Report

Date: 2025-01-07

## Critical Findings

### 1. Architecture Mismatch

- **Issue**: E2E tests expect backend API on localhost:3001 (real server/SSE).
- **Current Setup**: Playwright config only runs `vite preview` on localhost:4173 (frontend only).
- **Impact**: Tests that depend on `/api/health`, SSE, real-time data will fail or timeout.
- **Recommendation**:
  - Add a mock/stub backend API server that listens on localhost:3001 OR
  - Proxy frontend requests to mock API via Vite dev server.

### 2. Slow Test Suite

- **Issue**: Full test suite times out after 5 minutes (likely 30+ tests × 30-60s timeout each).
- **Current**: No test parallelization optimizations; large axe-core a11y scans block execution.
- **Impact**: CI/local runs are unreliable; cannot isolate single failing tests quickly.
- **Recommendation**:
  - Reduce test timeout from 60s to 30-45s (abort slow tests earlier).
  - Run a11y tests separately or with reduced scope.
  - Use `--workers=1` locally for debugging; increase in CI.

### 3. Missing API Mocks

- **Tests affected**: consulting_production.spec.ts, consulting_realtime.spec.ts, dashboard_realtime.spec.ts, etc.
- **Expected endpoints**:
  - `GET /api/health` → { status: 'ok' }
  - `GET /api/services/:slug` → service metadata + SSE endpoint
  - `POST /api/auth/login` → { token, user }
  - `GET /api/content/list` → [ { id, title, body } ]
  - `GET /api/search?q=...` → { results: [...] }
- **Current State**: No mocks; tests will hit real backend or fail with network errors.

### 4. SSE/Real-Time Issues

- **Tests**: consulting_realtime.spec.ts, dashboard_realtime.spec.ts, streaming tests.
- **Issue**: Real SSE connections are slow, timing-dependent, and unreliable in test environments.
- **Mock Strategy**: Return instant, deterministic mock responses instead of streaming.

### 5. Port Conflicts

- **Issue**: Playwright config hardcodes `reuseExistingServer: false`, causing port conflicts if previous run didn't cleanup.
- **Recommendation**: Kill lingering processes before each test run or set `reuseExistingServer: true` for local dev.

## Test Categories

### Low-Risk (Likely Pass)

- sanity_check.spec.ts — Console error capture (passing ✓).
- accessibility.spec.ts — Basic a11y scans (medium risk: requires stable rendering).

### Medium-Risk (Some Failures Expected)

- a11y.spec.ts — Strict WCAG 2.2 AAA (likely violations; consider downgrading to AA).
- content.spec.ts — Content loading; depends on correct Keystatic data path.
- analytics.spec.ts — Analytics event capture (may need mock GA setup).

### High-Risk (Likely Failures)

- consulting_realtime.spec.ts — Requires real SSE backend.
- dashboard_realtime.spec.ts — Real-time data streaming.
- director.spec.ts, expansion_pack.spec.ts — Complex workflows; likely to timeout.
- ai_assessment.spec.ts — Requires OpenAI API or mock; currently uses real API.

## Recommended Priority Actions

1. **Immediate** (Phase 2, Est. 60 min):
   - Update playwright.config.ts: Add webServer that runs mock API on localhost:3001.
   - Create `server/api-mock.ts` with `/api/health`, `/api/services/*`, `/api/search` stubs.
   - Update `e2e:local` script to start mock API before Playwright.

2. **Short-term** (Phase 3, Est. 90 min):
   - Reduce test timeout to 40s; mark slow tests with `@slow` tag.
   - Replace SSE tests with mock responses (deterministic, instant).
   - Update FEATURE_AI=false usage in all test environments.

3. **Medium-term** (Phase 4, Est. 120 min):
   - Fix flaky selectors in all tests (use aria/role/data-testid).
   - Add explicit waits for dynamic content.
   - Create E2E fixture data (seed CMS, mock content).

4. **Long-term** (Phase 5, Est. 150 min):
   - Set up CI e2e workflow with parallelization, caching, artifact upload.
   - Add flakyness detection (auto-retry, pass/fail analysis).
   - Create dashboard of test results + performance trends.

## Files to Update (Next Steps)

- [playwright.config.ts](playwright.config.ts) — Add webServer for mock API.
- Create [server/api-mock.ts](server/api-mock.ts) — Mock endpoints.
- [package.json](package.json) — Update e2e:local to start both mock servers.
- [docs/E2E_LOCAL.md](docs/E2E_LOCAL.md) — Update with backend mock setup.
- Various e2e test files — Replace hardcoded localhost:3001 references with baseURL.

## Severity Summary

- Critical: 2 (Backend mocking, SSE mocking).
- High: 2 (Test timeouts, Port conflicts).
- Medium: 1 (Missing API mocks).

---

End of Report
