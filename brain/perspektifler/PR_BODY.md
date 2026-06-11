# feat(perspektifler): rebuild insights vertical

Rebuilds the **Perspektifler** vertical end-to-end per the micro-focus contract
`~/Desktop/istek.md` v2 (premise-corrected canonical spec; copy committed at
gate-0). Six evidence-gated phases + a final scripted journey. **Do not merge
without owner review** (contract §FINISH).

## Premise corrections that shaped the build
- v1 claimed an active scope-guard — none existed → bootstrapped (SCOPE.md,
  allowlist, hook; settings.json wiring needs owner — PROGRESS.md snippet).
- A dead 8-route mock `/insights` prototype existed (5 stub posts, broken TR
  slugify) → **Option B**: evolved the live `/blog` vertical, harvested the
  URL-state pattern, deleted the prototype (54 files).
- 28 raw categories in data vs 10 official; 108 free tags → controlled set.

## Acceptance criteria — evidence

| AC | Claim | Evidence |
|---|---|---|
| AC-01 | Menu closed by default; closes on ESC/outside/route/scroll | `e2e/menu.spec.ts` 36/36 ×3 browsers → `brain/perspektifler/gate2-menu-spec.txt` |
| AC-02 | Nav checkbox artifacts gone | `menu.spec` BUG-02 test + `gate2-after-*.png` |
| AC-03 | Panel ≤30 insights-only links | `menu.spec` scope test (counts links, rejects SEKTÖRLER/HAKKIMIZDA/services wording) |
| AC-04 | Any article ≤3 clicks from hub | hub→(kategori∥format∥chip)→card = 2; journey spec step 7; check-links 0 orphans |
| AC-05 | Vocab ≤60, 0 dup slugs, 100% retired-URL 301 | `gate1-check-taxonomy.txt` (46/60, dup=0); vercel.json one-hop set + `insights.spec` redirect contract |
| AC-06 | CWV budgets | Local preview: hub perf 62/a11y 97/seo 100 — equal to site-best (landing 62); ≥90 unattainable locally on ANY page (serving infra, see PROGRESS). **Needs prod-URL measurement post-deploy.** Not claimed as pass. |
| AC-07 | axe 0 critical/serious (hub/category/article/open-menu) | `e2e/a11y-perspektifler.spec.ts` green (TOC contrast fixed; open-menu scoped to nav — homepage hero debt logged) |
| AC-08 | Search zero-result <5%, p95 <300ms | `gate5-search.txt`: 1/30 = 3.3%, p95 0.23ms |
| AC-09 | URL round-trip reproduces filtered view | `hub.spec` round-trip + journey step 5 + 10 lib unit tests |
| AC-10 | ≤2 persistent floats | UtilityDock (zen+lang+WhatsApp merged) + chat → `gate6-floats-hub.png` |
| AC-11 | hreflang+schema valid, crawl clean | sitemap alternates (153 URLs, 0 /blog); `audit:canonical` 151/151 + robots OK; rich-results longest+shortest PASS (`gate4-rich-results.txt`) |
| AC-12 | Events firing via consent gate | search_query/zero_result/load_more/category_click/newsletter_submit through `src/lib/analytics.ts` (KVKK: no PII) |

## Out of scope / pre-existing (full log: `OUT_OF_SCOPE.md`)
services.ts catalog gap (`/services/crisis-management` 404) · `/:locale/{founder,pricing,discovery}` never mounted (i18n-smoke) · homepage hero CTA contrast · BUG-07 /about headline (reproduced, page-local — `gate6-about-headline.png`) · CommentsSection backend · EN article corpus.

## Decision log
`PROGRESS.md` gate-by-gate · task ledger `brain/PERSPEKTIFLER_TASKS.json` · content-ops runbook `docs/guides/perspektifler-content-ops.md`.
