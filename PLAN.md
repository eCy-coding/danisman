# PLAN — Perspektifler (Insights) Rebuild

Source spec: `brain/PERSPEKTIFLER_REBUILD_SPEC.md` · Audit: `brain/perspektifler-audit/AUDIT.md`
Machine plan: `brain/PERSPEKTIFLER_PLAN.json` · Scope: `SCOPE.md` Base commit: `8af969d`

## Ordered phases (each ends with its own GATE evidence; commit `feat(perspektifler): gate-N`)

- **GATE-0 (this) — Recon** ✅ stack, real paths (SCOPE.md), bug table + benchmark (AUDIT.md),
  content-inventory.csv, this PLAN. No build work before this gate. → wait for user approval.
- **Phase 1 — Taxonomy** `src/data/perspektifler/taxonomy.json` (10 categories + ≤60 tags),
  `merge-map.json` (108→≤60 + 301s), schema. Gate: `scripts/check-taxonomy.mjs` → 0 dup
  normalized slugs, 100% tag mapped, 301 covers all old URLs.
- **Phase 2 — Menu** fix BUG-01/02/03/04/12 in `Navbar.tsx` + `MegaMenu.tsx` + `common.ts`
  (insights-only panel ≤30 links; close on route/outside/ESC/scroll; remove empty icon box;
  per-menu footer; z-index). Gate: `e2e/menu.spec.ts` green + before/after screenshots.
- **Phase 3 — Hub /perspektifler** 301 `/blog`→`/perspektifler`; hero(1+3) + search box +
  sticky facet bar (Kategori/Format/Konu/Yıl/Sıralama, URL-state) + 12 cards + Load More +
  crawlable ?page=N + topic chips ≤12. Gate: URL round-trip + Lighthouse mobile ≥90.
- **Phase 4 — Category pillar + Article template** `/perspektifler/kategori/<slug>`; breadcrumb,
  TOC, related-by-tag, schema.org Article+BreadcrumbList; interlink quotas ≥3. Gate:
  `scripts/check-links.mjs` quotas met, 0 orphans + rich-results.
- **Phase 5 — Search** static index (Pagefind if static else Fuse/Lunr) diacritic-insensitive;
  facet AND-across / OR-within. Gate: 30 TR queries → zero-result <5%, p95 <300ms.
- **Phase 6 — Quality sweep** CWV budgets, axe 0 critical/serious, float governance (≤2),
  SEO hreflang/canonical/sitemap, BUG-08. Gate: Lighthouse JSON ≥90/≥95 + axe + crawl.
- **Phase 7 (END-TO-END)** one Playwright `e2e/e2e-perspektifler.spec.ts` proving the full
  journey (menu→hub→facets→URL repro→load more→article→breadcrumb→search→301).
- **(opt) Phases 8–9** SEO/i18n hardening + content-ops runbook at 1,000 scale.

## Key architectural decision (evidence-based, default + rationale, proceed)
Three parallel systems exist: `/blog` (MDX, primary, has the 108-tag mess), `/insights/*`
(richer subsystem: category/tag/series/author/archive/search — but orphaned from nav), and
`/case-studies` (separate taxonomy). **Default: make `/perspektifler` the canonical hub,
adopt the `/insights/*` subsystem's richer templates where useful, migrate the 36 MDX
articles onto the unified 10-category taxonomy, and 301 `/blog` + retired tag URLs in.**
Rationale: reuses the most capable existing code, kills the parallel-taxonomy bug at the
data layer, minimal new surface. Revisit if Phase 1 inventory contradicts.

## Acceptance (AC-01..AC-12) — tracked in PROGRESS.md, evidence in PR body.
