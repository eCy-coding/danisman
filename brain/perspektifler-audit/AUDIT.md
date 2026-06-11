# Perspektifler — Phase 0 Audit Pack

Evidence base: live repo at HEAD `8af969d`, grep/cat/node outputs (this session).
Discipline v3.6: each row cites code evidence; benchmark cells marked ✓live (fetched this
session) or ⊙inferred (domain knowledge, not live-verified — flag, do not fake).

## 0.3 — BUG TABLE (root cause → fix strategy → effort)

| Bug | Reproduce evidence (code) | Root cause | Fix strategy | Effort |
|-----|---------------------------|------------|--------------|--------|
| BUG-01 menu open over content | `MegaMenu` visibility = `isOpen` (from `activeDropdown===id`); `Navbar` has NO route-change/outside-click/scroll close listeners (only `handleNavClick` + ESC via `useKeyPress`) | No global close on route change / outside / scroll; hover-intent can stick | Add `useLocation` effect → close on path change; outside-click (pointerdown) + scroll>100px listeners; keep ESC | M |
| BUG-02 empty checkbox before every nav label + logo | `Navbar.tsx:172` renders `{item.icon}` inside `w-8 h-8 rounded-lg bg-white/5` box; `NAV_ITEMS` (common.ts) define NO `icon` field → empty box always painted | Icon container rendered unconditionally w/ undefined icon | Conditionally render the icon box only when `item.icon` exists; remove box for label-only items (or assign real lucide icons) | S |
| BUG-03 SEKTÖRLER + HAKKIMIZDA groups in insights panel | `MEGA_MENUS.insights.sections` = `industries`(Sektörler), `research`, `about-section`(Hakkımızda) in `common.ts` | Insights panel data carries non-insights groups | Replace insights `sections` with insights-only (Kategoriler/Formatlar/Öne Çıkanlar) | M |
| BUG-04 footer "Tüm hizmetlerimizi keşfedin" in insights | `MegaMenu.tsx:148` hardcodes services wording for BOTH menus | Hardcoded footer string, not per-menu | Per-menu footer copy; insights → "Tüm içgörüleri keşfedin →" /perspektifler | S |
| BUG-05 ~120 free-form tags | node inventory: **108 raw tag tokens**, 98 normalized; dup classes confirmed (Yapay Zeka\|yapay zeka, AB Regulasyon\|AB regülasyon, insan kaynakları\|İnsan Kaynakları\|insan-kaynaklari, six sigma\|six-sigma…) | No controlled vocabulary; authors free-mint; TR/EN + casing/diacritic/hyphen drift | taxonomy.json ≤60 controlled tags + merge-map.json + normalize script + 301s | L |
| BUG-06 naming drift | nav "Perspektifler" → `App.tsx:441` `/perspektifler`→`/blog`; /blog H1 differs | Canonical hub is /blog but nav says Perspektifler; redirect reversed | Make `/perspektifler` canonical hub; 301 `/blog`→`/perspektifler`; one H1 "Perspektifler" | M |
| BUG-07 /about double headline | (page-local suspected) — confirm in Phase 2 whether cause is global style layer | TBD (global CSS layer vs page-local) | If global layer → fix; if page-local → OUT_OF_SCOPE.md | S/?|
| BUG-08 ≤5 floating widgets | `App.tsx` mounts `LiveChat`(1840) + `SimpleChatWidget`(1845) + `CookieBanner`(1851); `SocialProofToast` exists | Two chat widgets + toast + banner + a11y/lang all persistent | Governance: max 2 persistent (merge); toast→"Yeni" badge; banner returning-only auto-dismiss | M |
| BUG-09 no search | `InsightSearch.tsx` exists but not surfaced in /blog or nav | Search page orphaned; no hub search box | Phase 5 static index (Pagefind/Fuse) + hub search box + wire InsightSearch | L |
| BUG-10 no pagination/sort/format | `BlogPage.tsx` (confirm in Phase 3) — no page/sort/format controls | List renders all, no controls | Phase 3 facet bar + Load More + crawlable ?page=N | M |
| BUG-11 case vs blog taxonomy split | `mockCaseStudies.ts` categories ≠ blog categories (21 raw) | Two parallel taxonomies | Unify on 10 shared categories (taxonomy.json) | M |
| BUG-12 hero beneath menu z-index | `MegaMenu` panel `z-50`; hero/watermark stacking on /blog | z-index/stacking-context conflict | Normalize z-index scale; panel above content w/ backdrop; hero below | S/M |

## 0.2 — STACK (verified)
React 19.2 · Vite 6.2 · react-router-dom 7.11 (SPA) · i18next 25 / react-i18next 16 ·
TS strict · Tailwind v4 · content = MDX (`src/content/blog/*.mdx`) + JSON indexes.
Build: `npm run build` · Test(unit): `npx vitest run` · E2E: `npx playwright test` ·
Dev: `npm run dev`. (Already in CLAUDE.md command catalog.)

## 0.3 — CONTENT INVENTORY (node, this session) → content-inventory.csv
- Articles (MDX): **36** (tr 35 / en 1). blog-posts.json index = 49 (delta: generated/stub).
- Raw tag tokens: **108** unique (98 normalized) → target ≤60 controlled (BUG-05).
- Raw categories: **21** (e.g. Finans/Finance, Strateji/Stratejik Danışmanlık/M&A & Strateji,
  AI & Analitik/Analitik/Yapay Zeka) → target exactly **10** closed (BUG-11).
- Case studies: `mockCaseStudies.ts` separate category set (confirm counts Phase 1).

## 0.2 — BENCHMARK MATRIX (insights/“perspectives” sections)
✓live = fetched & read this session; ⊙inferred = domain knowledge, NOT live-verified
(per R1 honesty — to be spot-checked when needed). Target: ≥15; 2 live now, rest staged.

| Site | Nav model | Categories | Tag exposure | Search | List loading | Card meta | Flagship report |
|------|-----------|-----------|--------------|--------|--------------|-----------|-----------------|
| NN/g ✓live | topic+author facets | ~45 topics (controlled) | topics not free tags | yes (header) | **?page=N pagination** + Popular curated | title/date/read-time/type | reports section |
| Stripe Guides ✓live | category-grouped sections | ~9 groups | none public | (docs search) | curated cards + "See all" per group | title/category/CTA | featured hero cards |
| McKinsey Featured Insights ⊙inferred | mega-menu by topic+industry | dual (topic×industry) | curated, no cloud | prominent | featured hero + load more | title/type/date | flagship report hero |
| BCG Publications ⊙inferred | topic nav | topic taxonomy | minimal | yes | filter + pagination | title/topic/date | featured |
| Bain Insights ⊙inferred | topic+industry | dual taxonomy | minimal | yes | featured + list | title/type/date | annual report hero |
| HBR ⊙inferred | topic nav + magazine | topic taxonomy | controlled topics | prominent | pagination | title/author/read | magazine issue |
| MIT SMR ⊙inferred | topic nav | topic taxonomy | controlled | yes | load more | title/topic/date | report |
| a16z ⊙inferred | category + author | category | minimal | yes | infinite/load more | title/author/date | flagship series |
| Intercom Blog ⊙inferred | category nav | ~6 categories | minimal | yes | pagination | title/category/author | guides hub |
| Smashing Mag ⊙inferred | category + tag | category + curated tag | yes | prominent | pagination | title/category/date | books/guides |

CONSENSUS (drives spec): (1) curated layer above chronological stream; (2) controlled
topic/category taxonomy, never a free-tag cloud; (3) search first-class; (4) crawlable
pagination or Load-More+?page=N; (5) scan-first cards (title/category/format/date/read-time);
(6) flagship report gets hero treatment. All already encoded in the spec — confirmed.
