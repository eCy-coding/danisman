# E2E Smoke Test Suite

Production-targeting smoke tests that verify critical visitor flows.

## What it covers

| Spec | Tests | Purpose |
|---|---|---|
| `visitor-journey.spec.ts` | 7 | Core page loads: home, founder, services, pricing, about, contact, discovery |
| `form-submission.spec.ts` | 4 | Form render + validation (no real submit) |
| `seo-meta.spec.ts` | 9 | Title/canonical/og per URL + robots + sitemap |
| `kvkk-consent.spec.ts` | 4 | Banner appear/dismiss/persist/skip |

**Total: 24 smoke tests** across Chromium, Firefox, Safari.

## Run locally

```bash
# Against production
npx playwright test --config=playwright.smoke.config.ts

# Against staging / local preview
E2E_BASE_URL=http://localhost:4173 npx playwright test --config=playwright.smoke.config.ts

# Single browser
npx playwright test --config=playwright.smoke.config.ts --project=chromium

# Single spec file
npx playwright test --config=playwright.smoke.config.ts e2e/smoke/kvkk-consent.spec.ts

# Show report
npx playwright show-report playwright-report-smoke
```

## CI integration

The `e2e-smoke.yml` workflow triggers on:
- Every push to `main`
- Every PR targeting `main`
- Nightly at 05:30 UTC
- Manual `workflow_dispatch` (custom URL via input)

Matrix: Chromium + Firefox + Safari run in parallel (`fail-fast: false`).
`continue-on-error: true` — smoke failures are blocking at review level, not CI red-blocking merge (review required to change this).

## Configuration

`playwright.smoke.config.ts` — separate from the local-preview config (`playwright.config.ts`).

Key differences vs main config:
- `testDir: './e2e/smoke'` (smoke suite only)
- `baseURL: process.env.E2E_BASE_URL ?? 'https://www.ecypro.com'`
- No `webServer` (targets live URL)
- No `storageState` pre-seeding (KVKK tests need clean state)
- Longer timeouts (network latency vs localhost)

## Owner setup (Tier 3)

Add `E2E_BASE_URL` secret in GitHub → Settings → Secrets if you want to override the default production URL (e.g., for staging).

## Resilience contract

- Routes returning 404 are skipped with `test.skip()`, not failed.
- Form tests verify render + validation only — no real submissions to production.
- KVKK tests clear localStorage before each run to ensure clean state.
