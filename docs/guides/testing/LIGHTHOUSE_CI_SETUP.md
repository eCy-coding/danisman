# Lighthouse CI Setup (Tier 3 — Owner)

Lighthouse CI runs automatically on every PR, every push to main, and daily at 05:00 UTC. No token needed for the workflow to run — the token only adds PR comment decoration.

## 5-Step Setup

**1. Install the Lighthouse CI GitHub App (optional — PR comments)**
Go to: https://github.com/apps/lighthouse-ci
Click "Configure" → select the `ecypro` repository.

**2. Add the token to GitHub Secrets (after step 1)**
Copy the token the app shows after installation.
GitHub → Repository Settings → Secrets and Variables → Actions → New secret:
- Name: `LHCI_GITHUB_APP_TOKEN`
- Value: (paste token)

**3. Verify workflow runs without the token**
The workflow uses `temporary-public-storage` for report upload.
PR checks and nightly cron work without `LHCI_GITHUB_APP_TOKEN`.
The token adds inline PR score comments only.

**4. First production run produces the baseline**
After the first successful run, LHCI sets a baseline per URL.
Subsequent runs diff against this baseline and fail the gate on regression.

**5. Post-SSR-deploy: adjust budgets if needed**
When `@sparticuz/chromium` prerender lands (PLAN_ssr-prerender-seo.md):
- First run after SSR deploy resets scores.
- Tune `lighthouserc.json` thresholds if Lighthouse scores improve significantly.
- Coordinate with Better Stack uptime monitors for unified observability.

## Config Files

| File | Purpose |
|------|---------|
| `lighthouserc.json` | 6 conversion-critical URLs, score gates, Core Web Vitals assertions |
| `scripts/lhci-budget.json` | Resource size + timing budgets (used with `lhci budget.check`) |
| `.lighthouserc.cjs` | Legacy 10-URL config retained for reference (not used by CI) |

## Audited URLs

- `/` — homepage
- `/founder` — founder bio (trust signal)
- `/pricing` — pricing page (conversion)
- `/discovery` — discovery call form (conversion)
- `/services` — services catalog
- `/perspektifler` — insights hub

## Thresholds

| Metric | Gate | Level |
|--------|------|-------|
| Performance score | ≥85 | error |
| Accessibility score | ≥95 | error |
| Best Practices score | ≥90 | error |
| SEO score | ≥95 | error |
| LCP | ≤2500ms | error |
| CLS | ≤0.1 | error |
| INP | ≤200ms | warn |
| Total bytes | ≤500KB | warn |

## Local Manual Run

```bash
npm install -g @lhci/cli@0.13.x
lhci autorun --config lighthouserc.json
```

## Observability Stack Context

This CI gate is part of the unified observability cluster:

| Layer | Tool | Status |
|-------|------|--------|
| Error tracking | Sentry (PR #120) | ✅ merged |
| Analytics + consent | PostHog (ca424a97) | ✅ merged |
| HSTS / security headers | Cloudflare (6f12ac04 B4) | ✅ merged |
| Uptime monitors | Better Stack (a27a69e5) | ✅ merged |
| Core Web Vitals CI | **Lighthouse CI (this PR)** | ✅ complete |
