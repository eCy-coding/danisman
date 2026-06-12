# SCOPE — Services Vertical E2E Rebuild (micro-focus contract)

Single source of truth for what may be edited during the Services rebuild.
Spec: `~/Desktop/istemek.md` (istek-services.md). Detail: `SERVICES_SCOPE.md`.
Enforced by `.claude/hooks/scope_guard.py` against `.claude/scope-allowlist.txt`.
Expansions require evidence + a PROGRESS.md entry.

> Previous contract (Perspektifler, spec `~/Desktop/istek.md`) CLOSED — shipped,
> merged and deployed 2026-06-11 (PROGRESS.md FAZ-2C, prod LH 64/97/96/100).
> Re-fence evidence: owner request 2026-06-12 (istemek.md, approved plan
> `cerrahi-hassasiyet-ile-k-klere-encapsulated-whistle.md`).

## In scope (why)

| Area | Paths | Reason |
|---|---|---|
| Scope/progress docs | `SCOPE.md`, `SERVICES_SCOPE.md`, `OUT_OF_SCOPE.md`, `PROGRESS.md`, `brain/SERVICES_TASKS.json`, `brain/services/**` | contract + evidence pack |
| Vertical pages | `src/pages/ServicesPage.tsx`, `src/pages/ServiceDetailPage.tsx` (resolver root-cause), `src/pages/NotFoundPage.tsx` | the vertical itself |
| Services components | `src/components/services/**`, `src/components/sections/ServicesClusterSection.tsx`, `src/components/common/NotFoundSearch.tsx` | cards/filters/detail layout/illustrations/404 suggestions |
| Header/menu | `src/components/layout/MegaMenu.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/MobileBottomNav.tsx` | APG disclosure rebuild + dedupe; same-data mobile parity |
| Data layer | `src/data/services.ts`, `src/data/service-content.ts`, `src/data/service-taxonomy.ts` (new), `src/data/cta-variants.ts`, `src/data/copy/common.ts` (MEGA_MENUS.services block only), `src/schemas/service.ts` | taxonomy v2 single source |
| i18n/SEO | `src/i18n/localized-slugs.ts`, `src/i18n/canonical.ts`, `src/lib/structured-data.ts`, `src/lib/analytics.ts` (additive events only), `public/locales/{tr,en}/**` | parity + JSON-LD + consent-gated events |
| Routing/platform | `src/App.tsx` (routes block only), `vercel.json` (redirects block only) | resolver routes + 301 map |
| Build scripts | `scripts/generate-sitemap.ts` (hardcoded list → registry-derived), `scripts/services-taxonomy-audit.mjs` (new), `scripts/services-i18n-parity.mjs` (new) | SEO blast radius + audit gates |
| Tests | `src/test/**`, `src/**/*.test.{ts,tsx}`, `src/**/__tests__/**`, `e2e/**`, `tests/**`, `playwright.config.ts` (only if a project entry is needed) | test-first gates; deleting tests banned |
| Docs | `docs/adr/**`, `docs/reports/**`, `docs/ECYPRO_SERVICES_CATEGORIZATION.md` (new v2) | ADR + audit evidence |

## Explicitly OUT (see OUT_OF_SCOPE.md for the running log)

Perspektifler/blog/insights, Sektörler, Fiyatlandırma, Hakkımızda, Founder,
İletişim form logic, server/**, prisma/**, admin pages, CI workflows,
package.json deps (no new runtime dependencies — three.js/R3F banned without
written justification), guard infra (`.claude/**` — fence fixed, owner-only).
