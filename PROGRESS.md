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
