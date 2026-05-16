---
description: "Crawl every public route + validate SEO/a11y/console (preview server required)"
allowed-tools:
  - Bash(npm run preview:*)
  - Bash(npx playwright test:*)
  - Bash(curl:*)
---

# /url-audit — Full URL Audit

Runs against `http://localhost:4173` (preview server).

1. `npm run build && npm run preview &`
2. `npx playwright test e2e/crawl_authority_seo.spec.ts` — SEO per-route
3. `npx playwright test e2e/crawl_ux4_critical.spec.ts` — interaction smoke
4. Read `outputs/P10_URL_AUDIT.md` for the live findings template.

Output: PASS/FAIL per URL with the audit categories from `outputs/P10_URL_AUDIT.md`.
