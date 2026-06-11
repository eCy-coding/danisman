# SCOPE — Perspektifler (Insights) Rebuild

> Single source of truth for what this initiative may edit. Expanded ONLY with Phase-0
> grep/ls evidence. Anything not listed here is OUT OF SCOPE (log to `OUT_OF_SCOPE.md`).
> Spec: `brain/PERSPEKTIFLER_REBUILD_SPEC.md`. Branch base: `8af969d`.

## IN SCOPE — verified paths (grep/ls evidence in PLAN.md §0.2)

### (a) Header / menu component + styles
- `src/components/layout/Navbar.tsx` — top nav, renders NAV_ITEMS, mounts MegaMenu
- `src/components/layout/MegaMenu.tsx` — desktop dropdown panel (services + insights)
- `src/components/layout/MobileBottomNav.tsx` — mobile nav
- `src/data/copy/common.ts` — NAV_ITEMS + MEGA_MENUS data (insights panel content)

### (b) Blog / insights routes & templates
- `src/App.tsx` — route table (lines ~425–538 blog/insights/perspektifler; 695–727 case)
- `src/pages/BlogPage.tsx`, `src/pages/BlogPostPage.tsx` — current /blog system (MDX)
- `src/pages/InsightsPage.tsx`, `src/pages/InsightArticle.tsx`,
  `src/pages/InsightCategory.tsx`, `src/pages/InsightTag.tsx`,
  `src/pages/InsightSeries.tsx`, `src/pages/InsightAuthor.tsx`,
  `src/pages/InsightArchive.tsx`, `src/pages/InsightSearch.tsx` — /insights subsystem
- `src/content/blog/*.mdx` — 36 article sources (frontmatter)
- `src/data/blog-posts.json` — generated blog index (49 entries)
- `src/data/insights-stub-posts.json` — insights stub data

### (c) Tag / category data source + rendering
- `src/content/blog/*.mdx` frontmatter `category:` + `tags:[]` (108 raw tags, 21 raw cats)
- `src/i18n/keys/insights.ts`, `src/i18n/keys/insights.en.ts` — insights i18n strings
- (NEW) `src/data/perspektifler/taxonomy.json` — to be created (Phase 1)
- (NEW) `src/data/perspektifler/merge-map.json` — to be created (Phase 1)

### (d) Case-studies category source
- `src/data/mockCaseStudies.ts` — case studies data + categories
- `src/pages/CaseStudiesPage.tsx`, `src/pages/CaseStudyDetailPage.tsx`
- `src/content/case-studies/*`

### (e) Floating widgets (BUG-08)
- `src/components/integrations/LiveChat.tsx` (mounted App.tsx:1840)
- `src/components/chat/SimpleChatWidget.tsx` (mounted App.tsx:1845)
- `src/components/common/SocialProofToast.tsx`
- `src/components/ui/LanguageToggle.tsx`, `src/components/ui/Toast.tsx`
- `src/components/CookieBanner.tsx` (mounted App.tsx:1851)
- (Welcome-Back banner / a11y eye / TR globe — exact files to confirm in Phase 2/7)

### (f) Redirects config
- `src/App.tsx` (SPA `<Navigate>` — line 441 `/perspektifler`→`/blog` [REVERSED, fix])
- `vercel.json` (`redirects` array, line 7)

### (g) Sitemap / SEO config
- `scripts/generate-sitemap.ts` (+ `.js`)
- `src/components/seo/SeoManager.tsx`, `src/components/seo/JsonLd.tsx`
- `src/lib/structured-data.ts`

### (h) i18n config
- `src/i18n/canonical.ts`, `src/i18n/localized-slugs.ts`, `src/i18n/helpers.ts`
- `src/i18n/keys/insights*.ts`

### Tests (new, this initiative only)
- `e2e/*perspektifler*.spec.ts`, `e2e/menu*.spec.ts`
- `src/test/perspektifler/**`, `scripts/check-taxonomy.*`, `scripts/check-links.*`

## OUT OF SCOPE (do not edit)
Homepage hero/sections, Hizmetler (services) pages, Sektörler, Fiyatlandırma,
Hakkımızda/İletişim page CONTENT, admin/* CMS pages, server/*, auth, dashboard,
analytics vendor. Global header touched ONLY for BUG-01/02/03/04/12 + insights panel.
`/about` page-local layout (BUG-07) is OUT OF SCOPE unless cause is in a GLOBAL style layer.
