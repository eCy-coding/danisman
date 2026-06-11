# SCOPE — Perspektifler Vertical Rebuild (micro-focus contract)

Single source of truth for what may be edited during the Perspektifler rebuild.
Spec: `~/Desktop/istek.md` (v2). Task ledger: `brain/PERSPEKTIFLER_TASKS.json`.
Enforced by `.claude/hooks/scope_guard.py` against `.claude/scope-allowlist.txt`.
Expansions require evidence + a PROGRESS.md entry.

## In scope (why)

| Area | Paths | Reason |
|---|---|---|
| Scope/progress docs | `SCOPE.md`, `OUT_OF_SCOPE.md`, `PROGRESS.md`, `brain/PERSPEKTIFLER_TASKS.json`, `brain/perspektifler/**`, `CLAUDE.md` | contract + evidence pack |
| Hub + article pages | `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx`, `src/pages/PerspektiflerKategoriPage.tsx` (new), `src/pages/PerspektiflerKonularPage.tsx` (new), `src/pages/CaseStudiesPage.tsx`, `src/pages/CaseStudyDetailPage.tsx` | the vertical itself + BUG-11 unification |
| Dead prototype | `src/pages/insights/**`, `src/components/insights/**`, `src/lib/insights-mock.ts`, `src/data/insights-stub-posts.json`, `src/types/insights.ts`, `src/hooks/useInsightsFeed.ts` | harvest then delete (Gate-6) |
| Blog components | `src/components/blog/**` | hub cards/facets/capsule |
| Header/menu | `src/components/layout/Navbar.tsx`, `src/components/layout/MegaMenu.tsx` | BUG-01/02/03/04/12 only — minimal diff |
| Floating widgets | `src/components/common/SocialProofToast.tsx`, `src/components/common/UrgencyBanner.tsx`, a11y/lang widget files (locate, then add here) | BUG-08 governance |
| Data layer | `src/data/taxonomy.ts` (new), `src/data/copy/common.ts` (MEGA_MENUS.insights block only), `src/data/blog-posts.json` (generated), `src/data/search-index.json` (generated), `src/data/mockCaseStudies.ts`, `src/types/blog.ts`, `src/content/blog/*.mdx` (frontmatter only) | taxonomy + panel content |
| Libs | `src/lib/slugify.ts` (new), `src/lib/perspektifler-search.ts` (new), `src/lib/analytics.ts` (additive events only) | search + folding + events |
| Routing/platform | `src/App.tsx` (routes block only), `vercel.json` (redirects block only), `.size-limit.json` | atomic flip |
| Build scripts | `scripts/generate-blog-index.ts`, `scripts/generate-sitemap.ts`, `scripts/generate-rss.ts`, `scripts/generate-og-image*.{ts,mjs}`, `scripts/prerender.mjs`, `scripts/check-taxonomy.ts` (new), `scripts/check-links.ts` (new), `scripts/migrate-blog-frontmatter.ts` (new, one-shot) | index emit + SEO blast radius |
| i18n strings | `public/locales/tr/**`, `public/locales/en/**` | hub/category/menu UI strings |
| Tests | `tests/**`, `playwright.config.ts` (only if a project entry is needed) | gates + migrating /blog specs |
| Docs | `docs/guides/perspektifler-content-ops.md` (new) | content-ops runbook |
| Guard infra | `.claude/scope-allowlist.txt`, `.claude/hooks/**`, `.claude/settings.json` (hooks block only) | the fence itself |

## Explicitly OUT (see OUT_OF_SCOPE.md for the running log)

Homepage, Hizmetler, Sektörler, Fiyatlandırma, Hakkımızda (/about content),
İletişim, server/**, prisma/**, admin pages, CI workflows, package.json deps
(no new runtime dependencies), any other vertical.
