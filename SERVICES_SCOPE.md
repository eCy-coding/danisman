# SERVICES_SCOPE — B2 ground truth + edit surface (Services vertical E2E)

Spec authority: `~/Desktop/istemek.md` §3 B2/B3. Verified against this worktree 2026-06-12.
Fence: `.claude/scope-allowlist.txt` (enforced by `.claude/hooks/scope_guard.py`).

## Ground truth (corrected, evidence-verified)

| Surface | Path | Verified fact |
|---|---|---|
| Routes | `src/App.tsx:381,392,444` | `/services`, `/services/:slug`, `/hizmetler/*`→`/services` |
| Resolver | `src/pages/ServiceDetailPage.tsx:27-28` | catalog-only lookup → hard 404 for 17 content slugs (ROOT CAUSE) |
| Menu data | `src/data/copy/common.ts:116+` | `MEGA_MENUS.services`: 3 sections × 3 items, only 4 unique hrefs (dupes) + featured `/maturity-assessment` |
| Menu renderer | `src/components/layout/MegaMenu.tsx` | 302 lines, data-driven ICON_MAP, hover-only, NO aria-expanded/controls/Esc/arrows, NO test |
| Index page | `src/pages/ServicesPage.tsx` | 466 lines; hang-bug note :41; "Glassmorphism Light" comment :254; JSON-LD ItemList :208 |
| Catalog | `src/data/services.ts` | 21 services ma(5)/esg(5)/fintech(5)/aile(6); "DEĞERLEMEokul" typo :36; `ma-valuation` link bug :47-54; URL field = `link` |
| Content registry | `src/data/service-content.ts` | 38 slugs (superset); 14 orphans unreachable |
| Schema | `src/schemas/service.ts` | Service: id/title/category/description/icon/link |
| Sitemap | `scripts/generate-sitemap.ts:132-154` | hardcoded 21-slug list ≠ catalog; 17 of them 404 in prod |
| i18n | `src/i18n/localized-slugs.ts` (20 pairs), `src/i18n/canonical.ts` | services↔hizmetler pair exists; per-service slug coverage audited in P1 |
| CTA | `src/data/cta-variants.ts` | 63 variants (21×3) |
| Tests today | `src/test/pages/services-content.test.ts`, `src/test/cluster-d-service-detail.test.tsx`, `e2e/services-filter.spec.ts` | extend only — deleting tests banned |

## Edit surface (IN) — mirrors `.claude/scope-allowlist.txt`

Pages: ServicesPage, ServiceDetailPage, NotFoundPage ·
Components: `src/components/services/**`, ServicesClusterSection, MegaMenu, Navbar, MobileBottomNav, NotFoundSearch ·
Data: services.ts, service-content.ts, service-taxonomy.ts (new), cta-variants.ts, copy/common.ts (services block), schemas/service.ts ·
i18n/SEO: localized-slugs.ts, canonical.ts, structured-data.ts, analytics.ts (additive), `public/locales/{tr,en}/**` ·
Platform: App.tsx (routes block), vercel.json (redirects block), generate-sitemap.ts, services-taxonomy-audit.mjs (new), services-i18n-parity.mjs (new) ·
Tests: `src/test/**`, `src/**/*.test.*`, `src/**/__tests__/**`, `e2e/**`, `tests/**`, playwright.config.ts ·
Docs: `docs/adr/**`, `docs/reports/**`, ECYPRO_SERVICES_CATEGORIZATION.md (new v2) ·
Contract docs: SCOPE.md, SERVICES_SCOPE.md, OUT_OF_SCOPE.md, PROGRESS.md, `brain/services/**`, brain/SERVICES_TASKS.json

## OUT

Perspektifler/blog/insights · Sektörler · pricing · about/founder · contact logic ·
server/** · prisma/** · admin · CI workflows · new runtime deps (three.js/R3F gated) ·
`.claude/**` guard infra (owner-only). Broken OUT findings → one line in OUT_OF_SCOPE.md, continue.

## Budgets (definition of done = istemek.md §3 B6)

lint 0 err · typecheck 0 err · unit green (new code covered) · e2e:fast + e2e green ·
axe 0 serious/critical on /services + 3 details · build green · sitemap = canonical set ·
motion 150–400ms transform/opacity-only + prefers-reduced-motion · chips ≤8 · ≤3 clicks to any service ·
no backdrop-blur · no magic numbers · PR with 10 gate evidences, no main merge.
