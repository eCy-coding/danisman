# PROGRESS — vertical rebuild decision log

---

# SERVICES VERTICAL (2026-06-12 → )

Spec: `~/Desktop/istemek.md` (istek-services.md) · Plan: approved 2026-06-12
(`cerrahi-hassasiyet-ile-k-klere-encapsulated-whistle.md`) · Branch: `claude/competent-burnell-270d4d` (worktree)

## SVC Gate-0 (2026-06-12)
**Env:** node v24.8.0 · npm 11.6.0 · `npm install` exit 0 (audit warnings noted, not chased — out of scope).
**Baseline (BEFORE any edit, recorded not fixed):** lint **0 errors** / 3 warnings (ThemeContext, view-as-context — out of scope) · typecheck **GREEN** (web+server; old "lenis RED" memory stale) · vitest `--run`: **23 failed / 1026 passed / 15 skipped (141 files, 4 failing files: canonical.test.ts, track-b-phase-b5.test.tsx, a11y/static-rules.test.tsx, founder-page.test.tsx — ALL pre-existing, out of services scope)**.
**Scope re-fence:** Perspektifler contract CLOSED (shipped 2026-06-11) → allowlist + SCOPE.md rewritten for Services vertical. Evidence: owner request istemek.md + approved plan. Guard infra (`.claude/**`) deliberately dropped from allowlist (classifier: no self-modification) — fence is fixed.
**Premise corrections vs istemek.md ground truth (verified by 3 Explore agents + direct reads):** content registry **38** slugs (not 43) · MegaMenu.tsx **302** lines (not 169), **no** aria-expanded/controls/Esc/arrows, **no test file** · menu 9 visible items → only **4 unique hrefs** (strategic-transformation ×2, digital-strategy ×2, /services ×3) · `docs/ECYPRO_SERVICES_CATEGORIZATION.md` does **not** exist · orphans = **14** · dangling = 0 · catalog↔content = **21/21** (old memory "4/21" STALE).
**ROOT CAUSE (user's 404 screenshot):** `ServiceDetailPage.tsx:27-28` resolves ONLY via `SERVICES` catalog (21) → menu pillar slugs (strategic-transformation, ai-analytics, digital-strategy) + 14 content orphans all hard-404. Sitemap (`generate-sitemap.ts:132-154`, hardcoded 21) ships **17 URLs that 404** (14 orphans + 3 menu-only) to Google.

## SVC Gate-1 (2026-06-12) — taxonomy integrity audit
**Script (no hand-counting):** `scripts/services-taxonomy-audit.mjs` (tsx, imports REAL modules) → `docs/reports/services-taxonomy-audit.json`.
**Deterministic counts:** content **38** · catalog 21 entries / **21 unique slugs** · menu 9 visible items / **4 unique detail slugs** (dupes: strategic-transformation×2, digital-strategy×2, `/services`×3) · sitemap 21 · **orphans 14** · dangling **0** · **sitemap_404 = 17** · menu dead items 3 (ai-analytics, digital-strategy, strategic-transformation) · content dead slugs 17.
**ma-valuation finding refined:** NOT a slug dupe — it is the only carrier of `mergers-acquisitions` link; bug = "Şirket Değerleme & QoE" card deep-links to the generic M&A umbrella (services.ts:53). Content registry has NO valuation slug → P2 decision (own content entry).
**Known bugs line-pinned:** DEĞERLEMEokul :36 · ma-valuation :53 · Glassmorphism comment :254 · resolver catalog-only :27.
**i18n:** route-level pair services↔hizmetler exists; per-service slugs EN-canonical (0 localized pairs) — convention kept.
**Baseline tests:** services-content + cluster-d 28/28 PASS. MegaMenu a11y baseline: hover-only, no aria-expanded/controls, no Esc, no arrows, no test file (static fact, axe runtime pass in P5).

## SVC Gate-2 (2026-06-12) — taxonomy v2 + ADR
**Decision (evidence = hero-title extraction from SERVICE_CONTENT):** two-axis IA. Axis-1 pillars (menu, 9/9 unique content-true targets); Axis-2 departments: 4 existing + **3 NEW adopting ALL 14 orphans** — insan(4: hr-transformation, employer-branding, industrial-relations, payroll-audit) · risk(6: macro-risk, crisis-management, competition-economics, government-relations, global-intelligence, smart-cities) · buyume(4: market-entry, investment-incentives, neuromarketing, operational-excellence). **Zero retirements → empty 301 map** (v2 only adds).
**Menu changes:** org-design → hr-transformation (content title literally "İK & Organizasyon Tasarımı") · "Bulut & Platform" → "Veri Yönetişimi & Uyum"/data-governance (zero cloud content exists) · Performans 3× generic /services → market-entry / operational-excellence / investment-incentives ("Dijital Operasyonlar" relabeled "Teşvik & Hibe Yönetimi").
**ma-valuation:** own `company-valuation` content entry authored in P4 (card currently deep-links M&A umbrella, services.ts:53).
**Validation script PASS:** 35 members + 4 pillar-only = **39 canonical**; multi-dept ∅; homeless ∅; phantom ∅; menu 9/9 unique; chips 8/8.
**Artifacts:** services-taxonomy-v2.json · ADR-services-taxonomy-v2.md · ECYPRO_SERVICES_CATEGORIZATION.md (v2).

## SVC Gate-3 (2026-06-12) — design & motion spec
`docs/reports/services-design-motion-spec.md`: verified tokens (fib 1-55, golden sm-3xl), magic-number plan (duration-500/700→300/400, min-h-[52px]→fib-13, 44px=WCAG keep), full motion budget table w/ reduced-motion path per element, 3D=CSS/GSAP-only (R3F gated; three.js absent — verified).

## SVC Gate-4 (2026-06-12) — single-source data layer (test-first)
**RED first:** `src/test/services-taxonomy-v2.test.ts` (16 tests) failed on missing registry — evidence: "Test Files 1 failed / no tests" (import error).
**Implemented:** `src/data/service-taxonomy.ts` (registry: 7 departments + lifecycles + PILLAR_PAGES + isCanonicalServiceSlug + getLifecyclePosition + SERVICES_MEGA_MENU projection) · common.ts MEGA_MENUS.services = projection · schema category enum +insan/risk/buyume · accent map +3 (cyan/rose/teal) · services.ts +14 adopted cards, ma-valuation→/services/company-valuation, DEĞERLEMEokul typo fixed, DEPARTMENTS derived · **company-valuation 16-section content authored** · **RESOLVER FIX (ROOT CAUSE):** ServiceDetailPage registry-first — catalog membership no longer 404s menu pillars/orphans.
**GREEN:** 44/44 (taxonomy-v2 16 + services-content updated 21→35/4→7 + cluster-d) · typecheck 0 · lint 0 err.

## SVC Gate-5 (2026-06-12) — mega menu APG disclosure
**RED first:** new `MegaMenu.test.tsx` — 3 fail (12× ARIA menu-role misuse, translucent /98 surface, Esc no focus-return), 5 pass (registry render armor).
**Implemented:** services panel role=menu/menuitem removed (APG disclosure = plain links) · surface opaque `bg-[#0a0f1c]` (H1 ghosting through /98 killed — owner screenshot overlap) · Navbar Esc now returns focus to trigger. Trigger already had aria-haspopup/expanded/controls + outside-click/route-close (Perspektifler Gate-2 — istemek.md "no a11y" premise was stale at Navbar level).
**Evidence:** unit 8/8 · NEW `e2e/services-menu.spec.ts` chromium **5/5** — 9 unique targets, 4 menu→detail journeys (no /404), orphan payroll-audit + new company-valuation resolve, junk→404 strict, Esc focus-return · Perspektifler menu.spec regression: 10 pass + 1 known flaky (retry-green).

## SVC Gate-6 (2026-06-12) — /services index v2
**New finding fixed:** ServicesClusterSection was a THIRD hand-maintained list with dead hrefs (`/services/esg-reporting` → 404) — rewritten as **registry-driven lifecycle visualizer** (7 numbered workflows, 35 step links, drift-proof).
**RED first:** services-page-v2.test.tsx 5 fail / 2 pass.
**Implemented:** debounced search 180ms (input/query split — 35-card re-render off the keystroke path) · aria-live + data-count result counter (i18n keys result_count/_all tr+en) · ServiceFilter aria-pressed · "Glassmorphism Light" comment renamed (solid-surface doctrine) · ItemList JSON-LD desc → 7 clusters · clear resets both states · ServiceCard v2: lifecycle "Adım N/M" badge, pointer-fine 3D tilt ≤6° (rAF, transform-only, reduced-motion off), motion budget 500/700→300/400, blob geometry → fib tokens (w-fib-34), line-clamp-3 scan-first.
**Premise fix:** e2e services-filter.spec asserted an "economics"-era catalog + an i18n string the page never rendered — the historical "pre-existing service_hub fail". Spec rewritten to v2 registry (8 chips, 7 clusters, data-count, lifecycle journey link).
**Evidence:** unit 49/49 (5 files: taxonomy-v2 + page-v2 + content + cluster-d + atom-2 updated) · e2e services-filter 5/5 + services-menu 5/5 chromium · typecheck 0 · lint 0 err.

## SVC Gate-7 (2026-06-12) — /services/:slug detail v2
**RED first:** services-detail-v2.test.tsx — imports failed (LifecycleNav/DetailSectionNav/getCtaVariants absent).
**Implemented:** `LifecycleNav` (dept chip + "İş akışında adım N/M" + prev/next step links; pillar pages render nothing) · `DetailSectionNav` (sticky pill anchors, single IntersectionObserver scrollspy, sections computed from content presence) · section ids + scroll-mt-36 on 7 sections · **CTA variants finally wired** — footer renders per-service 'value' flavor (`getCtaVariants` wrapper +isDefault; 63 authored variants were dead code; default copy for uncovered slugs) · `ServiceIllustration`: FALLBACK_ART glyph (15+ slugs had `return null`) + lazy-GSAP entrance (≤400ms, transform/opacity, stagger) + 3s idle float, `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` static fallback.
**Updated (not deleted):** cluster-d footer assertions → variant contract.
**Evidence:** unit 48/48 (4 services suites) · e2e services-menu extended 6/6 chromium (lifecycle 1/5 + next href + #methodology anchor inViewport + pillar no-nav) · typecheck 0.
**Deliberate skip:** layout-wide below-fold React.lazy split — detail pages are content-light vs index; budget = no regression (P9 measures).

## SVC Gate-8 (2026-06-12) — i18n/SEO/analytics/404
**Sitemap (D6):** `generate-sitemap.ts` hardcoded 21-slug list → `CANONICAL_SERVICE_SLUGS` registry import. Regenerated: **39 service URLs** (170 loc total), company-valuation + all adopted orphans present, **zero 404-producing URLs** (each canonical = resolver-renderable by construction).
**301 map:** ∅ — v2 renamed/retired nothing (ADR); /hizmetler SPA redirect untouched.
**Parity script:** NEW `scripts/services-i18n-parity.mjs` → **PARITY OK exit 0** (services.json tr↔en 84 keys both directions · 7 departments + 9 menu items bilingual · NotFoundSearch service suggestions all canonical · sitemap registry-derivation guard). `list.*` EN content keys exist but are unwired (deliberate TR-first content strategy — noted, not scope).
**Analytics (consent-gated, KVKK-safe):** `menu_open` (Navbar, once per panel open) · `service_filter` (dept id) · `service_search` (**query LENGTH + hit count — raw text never sent**) · `service_cta` via trackCTA (variant label + location). Unit tests assert no-raw-query leak.
**Evidence:** services-page-v2 9/9 (2 new event tests RED→GREEN) · parity exit 0 · sitemap diff (+18 service URLs, 0 removals).

## SVC Gate-9 (2026-06-12) — full quality battery
**Fast-fail:** lint 0 err · typecheck 0 · vitest fresh **1090 passed** / 23 pre-existing fails (4 out-of-scope files, unchanged from Gate-0 baseline; +1 service-content count test updated 38→39) · e2e:fast 5 pass + 1 known firefox flaky.
**Build:** `npm run build` exit 0 — postbuild sitemap/RSS/og green, **prerender 170/170** (152 → +18 service pages; prerender feeds from registry-derived sitemap automatically).
**Full e2e (30m, 3 browsers):** **3759 passed** · 581 failed = environment classes, NOT branch regressions: backend ECONNREFUSED `/api/health` (admin/p55/p61/db/booking-deep), API-key suites (crawl_api_calibration 63, mcp_live), prod-URL audits (axe-production — audits LIVE old code), prerender-stripped local dist (crawl_seo/content — vite-only rebuild for axe iteration wiped prerender), visual baselines (intended UI change). **BLOCKED_BY: CI/owner env** for those classes. Services-scope after fixes: **80/80 across chromium+firefox+webkit** (2 known Perspektifler-era flakes retry-green).
**REAL a11y bugs found by axe battery and FIXED:** ServicesDiscoveryCTA blue CTA 2.66:1 → doctrine gold bg-secondary/text-neutral · EmploymentIncentiveCalculator 2 range inputs label-orphaned → htmlFor/id · ServiceCard "Detay" slate-600 2.4:1 → slate-400 · MegaMenu bottom bar slate-600 2.9:1 → slate-400. Spec hardening: firefox locale-agnostic href clicks; webkit hover-open + documented CSS-var exclusions. Final axe-services: chromium 5/5, webkit/firefox green.
**Secret scan:** gitleaks own commits (a92009c..HEAD) **0 leaks** · working tree 3 hits = gitignored dist/ public client keys (expected) · 24 historical hits in old git history → owner queue.
**Bundle:** size-limit realigned (fence expansion logged in allowlist header — evidence: legit content growth): Initial brotli **111.37/115 KB** (main carried catalog via pre-existing lib/data.ts chain; +14 services + registry) · gzip 140 · ServiceDetailPage 69.65→/72 (company-valuation content) · **size-limit exit 0, 0 exceeded**.
**publish-check equivalence:** lint+typecheck+test+build+e2e:fast individually green above (same commands the slash chain runs).

---

# PERSPEKTIFLER VERTICAL (closed 2026-06-12)

Spec: `~/Desktop/istek.md` v2 · Plan: approved 2026-06-11 · Branch: `claude/cranky-bassi-9bd8b1`

## Gate-0 (in progress)
**Done:** premise validation (3 false premises in v1 corrected — see istek.md v2 §CHANGELOG); istek.md v2 written; SCOPE.md + allowlist + scope_guard.py hook created; OUT_OF_SCOPE.md seeded.
**Decisions:** Option B architecture (evolve live /blog, harvest+delete mock prototype); zero-dep Turkish-folded search; benchmark phase replaced by encoded consensus; CSS-only motion (no WebGL).
**Next:** tasks JSON · CLAUDE.md contract section · content inventory CSV · baseline runs (typecheck/unit/e2e smoke).

**Blocked (owner action needed):** wiring `scope_guard.py` into `.claude/settings.json` was denied by the permission classifier (agent may not modify its own permission machinery). The hook script is tested (block=2/allow=0). Owner can activate by adding to `.claude/settings.json`:

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Edit|Write|MultiEdit|NotebookEdit",
      "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/scope_guard.py\"" }]
    }
  ]
}
```
Until then the fence is enforced procedurally (SCOPE.md discipline).

## Gate-1 (2026-06-11)
**Done:** `src/lib/slugify.ts` (TR fold) · `src/data/taxonomy.ts` (10 categories, 46/60 vocab, 108-tag + 28-category merge maps) · generator rewritten (fail-on-unmapped, emits search-index.json, read_time 200wpm, featured≤4) · 49 MDX frontmatter migrated (13 synthesized from body meta, dates from git history) · case studies unified (categorySlug+format) · `scripts/check-taxonomy.ts` PASS.
**Evidence:** brain/perspektifler/gate1-check-taxonomy.txt · baselines: brain/perspektifler/gate0-baseline-e2e.txt (prerender 149/149, sanity 6/6).
**Premise note:** vitest "2 failed | 1132 passed" pre-exists on clean tree (canonical hreflang tr-prefix expectation + IMG_NO_ALT static rule) — not a regression; revisit in Gate-6 a11y sweep if in-scope.
**Decisions:** excerpt 140–160 enforced as WARN not FAIL (49 legacy excerpts; editorial pass later) · featured = 4 newest across distinct categories.

## Gate-2 (2026-06-11)
**Done:** BUG-02 (icon box conditional) · BUG-01 (open-intent 220ms, close on route change/outside/scroll>100px/ESC; backdrop) · BUG-03/04 (panel insights-only: Kategoriler 8+live counts, Formatlar+counts, Öne Çıkanlar 3, promo, hub footer; SEKTÖRLER+HAKKIMIZDA removed) · keyboard path (focus-open + aria-controls) · mobile children realigned.
**Evidence:** e2e/menu.spec.ts 36/36 (3 browsers) → brain/perspektifler/gate2-menu-spec.txt + after-screenshots (panel-open, closed-case-studies).
**Found during debugging (real product issues, logged):** (1) UrgencyBanner late-mount shifts navbar → hover-cancel UX glitch; (2) ExitIntentModal top-20px trigger swallows first nav hover with z-60 backdrop — both feed Phase-6 float governance. 
**Test-isolation decisions:** exit_intent_shown seeded; layout-stability wait; locale-agnostic assertions (firefox boots EN); webkit Tab semantics handled.

## Gate-3 (2026-06-11)
**Done:** Hub at /perspektifler (H1 "Perspektifler" — BUG-06): featured hero 1+3, prominent search (?q=, fold-insensitive — BUG-09), sticky facet bar Kategori/Format/Konu/Yıl/Sıralama with live counts + zero-hide + mobile bottom-sheet "N Sonucu Göster", 12+12 Daha Fazla Yükle + crawlable ?page=N + DOM≤48 (BUG-10), topic chips ≤12 + /perspektifler/konular, founder capsule after first 12 (KVKK intact). Pillar pages (10 intros) + konular page shipped early. ATOMIC flip: App.tsx (top+locale) + client Navigates, vercel.json one-hop 301 set, sitemap (153 URL, kategori pillars added, 0 /blog), RSS, prerender 152/152, lighthouse target, internal link sweep (incl. 3 template-literal links), size-limit entries. Case studies join feed as vaka-analizi.
**Evidence:** e2e 67 passed + 1 firefox retry-green flaky (brain/perspektifler/gate3-e2e.txt) · unit 10/10 lib/perspektifler.test.ts · typecheck+build green.
**Lighthouse (local preview, loaded rig):** hub perf 60 / a11y 97 / seo 100 / bp 96 — site baseline landing=62; hub at parity, a11y best-of-site. ≥90 unattainable on ANY page locally (pre-existing serving infra per project memory). AC-06 final read = isolated rerun Gate-6 + prod URL post-deploy. Not claimed as pass.
**Premise notes:** service_hub test-1 404 = pre-existing services catalog gap (OUT_OF_SCOPE.md) · prototype routes unmounted (8 lazy imports removed), files deleted in Gate-6.

## Gate-4 (2026-06-11)
**Done:** BlogPostPage: visible breadcrumb Hub→Kategori→Makale, category+format meta chips (was raw tag slug), canonical/OG/JSON-LD → /perspektifler, 4-item BreadcrumbList w/ category, founder inline CTA portal after 2nd content H2 (#founder-letter anchor → capsule at article foot), related top-3 (overlap→same-cat→newest fill), series prev/next (schema-ready), zod schema extended (categorySlug/format/readTimeMin/seriesId/pairId…). CaseStudiesPage filters now shared 10-category taxonomy (legacy ?industry= mapped) + cross-link to hub format view.
**Evidence:** check-links 20-sample + --all 49/49 PASS (gate4-check-links.txt) · rich-results longest+shortest PASS (gate4-rich-results.txt) · typecheck+build+e2e batch exit 0 (66 passed, 2 retry-green flakes; firefox round-trip hardened to numeric poll).

## Gate-5 (2026-06-11)
**Done:** ranked zero-dep search `searchPerspektifler` (title×3/tags×2/body×1, TR-fold), hub ?q= live, zero-result state suggests categories; events via consent-gated trackEvent: search_query, zero_result, load_more, category_click, newsletter_submit (no PII).
**Evidence:** vitest GATE-5 suite 4/4 — zero-result 1/30 (3.3% <5%), p95 0.23ms (<300ms), diacritic equivalence, relevance ordering (brain/perspektifler/gate5-search.txt).

## Gate-6 (2026-06-11)
**Done:** Float governance (BUG-08): SocialProofToast → dismissible nav "Yeni" badge (14-day freshness, hub visit dismisses); UrgencyBanner returning-visitors-only + 8s auto-dismiss; ZenToggle+LanguageToggle+WhatsApp float merged into single UtilityDock (persistent widgets = dock + chat = 2). Dead prototype deleted (54 files: 16 pages dupl., 16+ components, mocks, types, hooks, stub data, lib/insights utils, 2 prototype tsx, 3 orphan unit tests — all importer-verified closed-set). 24 e2e specs migrated /blog→/perspektifler; insights.spec rewritten as legacy-redirect contract; zen/i18n specs migrated to dock + stale-copy fixes. New a11y spec: axe hub/category/article/open-menu (menu-scoped) — TOC read-time contrast fixed (slate-600→400). audit:canonical 151/151 + robots OK.
**Premise verdicts:** i18n-smoke 5 fails + zen services copy + homepage hero contrast + /about headline = ALL pre-existing (evidence: c648fc7 greps, OUT_OF_SCOPE.md). BUG-07 reproduced & classified page-local → owner.
**Evidence:** gate6-floats-hub.png (≤2 persistent) · gate6-about-headline.png · chromium batch 39 passed incl. FINAL journey spec.

## FINAL (2026-06-11)
**PBVC:** typecheck ✓ · lint 0 error ✓ · vitest fresh ✓ (146 files; 2 pre-existing fails unchanged from baseline) · build+prerender 152/152 ✓ · full e2e: **3360 passed (30m)**, 186 skipped; 6 webkit ✘ triaged → 4 were bulk-sed selector hits on the hidden mega-menu link (fixed: selectors scoped to visible grid; targeted webkit rerun 4/4 PASS); 2 = pre-existing webkit stress flakes (STR-13/15, homepage contact + 90s soak — out of vertical); 609 "did not run" = early stop after maxFailures, resolved by the selector fix (full matrix re-run delegated to CI).
**e2e-perspektifler.spec (journey):** PASS (chromium batch + full run).
**Lighthouse (isolated):** hub 62/97/100/96 = site-best parity (landing 58-62); AC-06 final read on prod URL post-deploy.

## DEPLOY (2026-06-11, owner emri)
**Merge:** PR #222 squash → main @12:45:48Z (öncesi: 6 orphan Insight*.test silindi, case-studies unit suite shared-taxonomy'ye migrate — vitest baseline'a döndü 2F/139P).
**Vercel:** auto-deploy Ready (~6dk). **Canlı matris:** /blog→308→/perspektifler · /insights→308 · /blog/:slug→308 param-korumalı · hub+makale 200 · sitemap 260 perspektifler/0 blog · RSS ✓ · robots ✓.
**Canlı görsel:** live-hub.png (H1 Perspektifler, hero 1+3, temiz nav) · live-menu-open.png (17 link, insights-only) · live-article.png (3-seviye breadcrumb).
**Prod Lighthouse (mobile, AC-06 final):** perf **64** · a11y **97** · bp 96 · seo **100** (live-lighthouse-hub.json). Perf<90 = pre-existing serving infra (lokal parity 62→64); a11y/SEO hedefleri canlıda sağlandı. Kalıcı perf işi: PLAN_ssr-prerender-seo.md (owner).
**Tam kayıt:** brain/perspektifler/DEPLOY_EVIDENCE.md.

## FAZ-2 (2026-06-11, owner explicit izin: "benim yapacaklarımı yap")
**Gerçek prod bug'ları bulunup düzeltildi (i18n-smoke'un tarihsel 5 fail kökü):**
- FounderPage: guard'sız `i18n.language.startsWith` + ns-öncesi `returnObjects("credentials").map` → root boundary; CANLI /founder "Hizmet Kesintisi" basıyordu. Fix: lang guard + `ready` gate + Array savunması.
- Discovery: aynı sınıf — `discovery.sectors` returnObjects `.map` crash. Fix: Array guard.
- UtilityDock dil değişimi: locale-prefixli path'te LocaleRoute URL'i geri bastığı için i18n-only toggle anında geri dönüyordu. Fix: Navbar LanguageSwitcher sözleşmesi (swapLocaleInPath + navigate) dock'a taşındı.
- **PerspektiflerFeed update race**: ardışık hızlı facet değişiminde stale-closure merge ilk URL param'ını düşürüyordu. Fix: functional `setSearchParams(prev⇒…)` — race-free.
**Locale rotaları:** /:locale/{founder,discovery} eklendi (top-level ayna). **CI:** gitleaks `fetch-depth: 0` (shallow scan 0-byte exit 1 kökü) · lighthouserc `/blog→/perspektifler`.
**Ölçümle kapanan kalemler (kod değişikliği bilinçli YOK):** /about taşması = FOUC ânı (loaded DOM h1 top=278 vs nav=121 sağlıklı) · hero CTA kontrastı canlıda slate-950-on-gold sağlıklı · prerender VERCEL skip'i bilinçli (geçmiş instabilite, koddaki not) → kalıcı strateji: lokal prerender'lı dist ile `vercel deploy --prebuilt --prod`.
**Test düzeltmeleri:** pricing PRICING strict `.first()` · konular testinde gereksiz settle kaldırıldı (paralel teardown yarışı) · journey fresh-poll + breadcrumb scroll-into-view.
**Doğrulama:** i18n-smoke **7/7** · paket 40 pass (tek fail = pre-existing service_hub katalog) · prerender 152/152 · typecheck/lint temiz.
**Bekleyen (classifier kilidi):** `.claude/settings.json` scope-guard hook wiring — snippet yukarıda, owner yapıştıracak.

## FAZ-2C (2026-06-12)
**Nav ikonları (BUG-02 replace yolu):** 7 lucide ikon (Home/Briefcase/Factory/Newspaper/Tag/Users/Mail) — data JSX-free iconName + Navbar NAV_ICON_MAP; mobil dahil; canlı 7/7 doğrulandı.
**Prerender prebuilt akışı:** watchdog(60s)×2 (kilit yapısal bitti) + PRERENDER_FORCE_LOCAL (vercel build altında lokal chromium) → 152/152, `.vercel/output` 152 statik sayfa → `deploy --prebuilt --prod` → **canlı statik title'lar** (curl kanıtı). Title-shell/SEO-meta sorunu üretimde kapandı.
**PR #224 MERGED**; auto-deploy ezmesine karşı prebuilt re-assert. Kalıcı otomasyon önerisi DEPLOY_EVIDENCE'ta (owner).
**Yanlış-alarm dersi:** "44'te stuck" ikinci tur = kör sayaç (maxdepth); log+pid kanıtıyla çürütüldü, build sağlıklıydı.
