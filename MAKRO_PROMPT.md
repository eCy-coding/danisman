# MAKRO_PROMPT.md — Perspektifler + Site IA Macro Prompt (copy-paste complete)

> **TR kullanım:** Aşağıdaki ```text bloğunun TAMAMINI kopyala → repo kökünde `claude` oturumuna
> yapıştır → ajan kesintisiz yürütür. `istek.md` çerçevedir; bu dosya tam genişletilmiş yürütme
> makrosudur (her ayrıntı hesaplanmış: kategori mimarisi v2, tüm-panel menü sözleşmesi, sayfa
> blueprintleri, URL grameri, float matrisi, fazlar, AC-01..14).
> **Kanıt tabanı:** repo (taxonomy.json 10 kategori + 57 tag · MEGA_MENUS verisi · 9 servis href'i
> · benchmark matrisi AUDIT.md) + canlı ekran görüntüleri 2026-06-12 01:44–01:47 + web research (§SOURCES).

```text
<macro_prompt initiative="perspektifler-insights-rebuild" version="2.0" discipline="eCyPro v3.6">

══════════════════════════ 0 · ROLE & LAWS ══════════════════════════
You are a senior Information Architect + Frontend Engineer (React 19 · Vite 6 · TS strict ·
Tailwind v4) + Content Strategist + Performance/A11y Engineer rebuilding the Perspektifler
(Insights) vertical of ecypro.com in the real repo at ~/Desktop/ecypro, on the owner's MacBook.

LAWS (always binding):
L1 Evidence-or-silence: every path/selector/number quoted from grep/ls/cat/node/curl/test output;
   else label inferred:/unknown:. Zero fabricated identifiers. Zero hallucination = verification.
L2 No simulation; real commands in the real repo. Tool unavailable locally (e.g. Lighthouse
   needs Chrome) → print exact command for owner, mark PENDING-OWNER, continue.
L3 A phase ends ONLY with its gate command output pasted. "Looks done" is not a signal.
L4 No questions. Default + one-line rationale + proceed. Sole exception: irreversible boundary
   (prod deploy/merge, destructive data op, payment, secrets) → 3-line ESCALATION, wait.
L5 Scope fence: SCOPE.md + .claude/scope-allowlist.txt only. Outside-need → OUT_OF_SCOPE.md, move on.
   Services/Sektörler PANEL CONTENT and their pages are untouchable; shared MENU BEHAVIOR is in scope
   (Navbar.tsx + MegaMenu.tsx are allowlisted).
L6 Focus lock: one gate at a time; no side-quests; Phase N+1 forbidden before Gate N evidence.
L7 State: after each gate → PROGRESS.md (done/decisions/next) + commit
   `feat(perspektifler): gate-N — <summary>`. Boot: read PROGRESS.md + git log --oneline -10 →
   resume at first gate lacking evidence. NEVER redo an evidenced gate.
L8 Context budget: just-in-time partial reads; sub-agent research returns ≤2K-token digests;
   compaction note at every gate.
L9 Dual runtime budget — agent: batch independent calls, batch edits per file, cache research;
   page: LCP ≤2.5s (aspire 2.0) · INP ≤200ms · CLS ≤0.1 mobile · hub JS ≤150KB gz · LH perf ≥90 a11y ≥95.
L10 Tests: test-first; never delete tests; gates = no NEW failures vs BASELINE; axe 0 crit/serious;
    TR+EN parity for every new string.
L11 Never: pnpm/yarn, force-push, reset --hard, rm -rf, --no-verify, .env/dist commits, inline
    secrets, glassmorphism/backdrop-blur, magic numbers (Fibonacci/φ scale only).
L12 Honesty gate: superlatives require measurement; "flawless" is banned — only AC-01..14 count.
EXPERT ROLE CARD before every phase (5 lines): ROLE / RESEARCH (≤4 bounded lookups, cached) /
STANDARDS (numbers) / TOOLS (gate cmds) / RISK (+rollback). Research precedes every edit; then act.

══════════════════ 1 · VERIFIED STATE + NEW OBSERVATIONS ══════════════════
Branch state (PROGRESS.md): GATE-0 Recon DONE · GATE-1 Taxonomy DONE (check-taxonomy 13/13 PASS:
10 categories, 57 tags, 0 dup slugs, 146 redirects) · GATE-2 Menu DONE (vitest 27/27; Playwright
menu.spec written, run pending on owner machine). RESUME AT PHASE 3.
Production observations (screenshots 2026-06-12 01:44–01:47, ecypro.com — production lags branch;
merge is owner-gated, so these confirm the problem class, not branch regressions):
OBS-01 Hizmetler mega-menu rendered OPEN over /services content → stuck-open class (BUG-01) is
       PANEL-AGNOSTIC; the behavior contract + tests must cover EVERY nav panel, not just insights.
OBS-02 Hero H1 "Stratejik Danışmanlık Hizmetleri" renders BENEATH the open panel → z-index/backdrop
       contract (BUG-12 class) applies on /services route too.
OBS-03 ≥5 simultaneous floats on /services: content toast + ANALYTICS pill + settings float
       (bottom-left), Welcome-Back+Book-Now banner + chat bubble (bottom-right) → BUG-08 confirmed
       site-wide; float governance is global (App.tsx mounts — in scope).
OBS-04 /404 page works (search + Perspektifler/Vaka/Fiyatlandırma cards) → retired URLs must 301,
       never fall to 404; 404 itself stays as safety net.
OBS-05 /services already ships search + chip filters (HEPSİ/M&A/ESG/FINTECH/AİLE ŞİRKETİ) → the hub
       facet bar MUST reuse this interaction pattern (one consistent filter language site-wide).
Premise rule: re-verify each OBS against the branch before acting; branch reality wins.

══════════════════ 2 · INFORMATION ARCHITECTURE v2 (calculated) ══════════════════

2.1 PRIMARY CATEGORIES — closed set of 10 (verified src/data/perspektifler/taxonomy.json):
| slug                 | label_tr                      | label_en            |
|----------------------|-------------------------------|---------------------|
| strateji             | Strateji                      | Strategy            |
| yapay-zeka-teknoloji | Yapay Zeka & Teknoloji        | AI & Technology     |
| finans-ekonomi       | Finans & Ekonomi              | Finance & Economy   |
| insan-organizasyon   | İnsan & Organizasyon          | People & Organization|
| operasyon            | Operasyon                     | Operations          |
| pazarlama-cx         | Pazarlama & Müşteri Deneyimi  | Marketing & CX      |
| global-vizyon        | Global Vizyon                 | Global Vision       |
| kamu-esg             | Kamu & ESG                    | Public & ESG        |
| liderlik             | Liderlik                      | Leadership          |
| ma-degerleme         | M&A & Değerleme               | M&A & Valuation     |
Benchmark rationale: Intercom ~6, Stripe ~9 groups, MBB dual topic×industry (AUDIT.md matrix);
10 sits in the proven band and under the ≤12-choices North-Star cap.
GOVERNANCE (the "new categories" rule — do NOT add ad hoc): hard cap 12; a new category may be
created ONLY when ≥8 published articles would map to it AND no existing category absorbs them;
review quarterly; every change re-runs `node scripts/check-taxonomy.mjs` (must stay green) and
extends merge-map + 301s. One pre-approved candidate if threshold met later: `dijital-donusum`
(currently a tag); split it out of yapay-zeka-teknoloji only at ≥8 articles.

2.2 SECONDARY DIMENSION — Sektör facet (MBB dual-taxonomy pattern, AUDIT.md):
Add "Sektör" as a FACET on the hub (not a category system, no new indexable URLs; filter state in
URL params only, noindex via canonicalization). Facet values = existing sectors from
src/data/copy/common.ts sektorler menu (verified examples: /sektorler/imalat-sanayi,
/sektorler/finansal-hizmetler; enumerate all at runtime:
`grep -n "href: '/sektorler/" src/data/copy/common.ts`). Articles get optional frontmatter
`sectors[]` (≤2, from this list). Facet hidden while <2 results per value (North Star).

2.3 TAG LAYER (unchanged contract): 57 controlled terms (≤60), {slug,label_tr,label_en}, lowercase
ASCII slugs (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u), max 5/article, authors cannot mint tags, quarterly merge
review. Tag pages noindex,follow.

2.4 CATEGORY ↔ SERVICE CROSS-LINK MATRIX (consulting funnel; all 9 service hrefs verified from
src/data/copy/common.ts). Every category pillar shows ONE "İlgili Hizmet" CTA card (TR label +
verified href); articles inherit their category's CTA in the inline Founder-Letter slot when no
service-specific CTA is set:
| category             | service CTA (verified href)                      |
|----------------------|--------------------------------------------------|
| strateji             | /services/strategic-transformation               |
| ma-degerleme         | /services/mergers-acquisitions                   |
| insan-organizasyon   | /services/organizational-design                  |
| yapay-zeka-teknoloji | /services/ai-analytics                           |
| operasyon            | /services/digital-operations                     |
| finans-ekonomi       | /services/cost-optimization                      |
| pazarlama-cx         | /services/revenue-growth-strategy                |
| global-vizyon        | /services/digital-strategy                       |
| liderlik             | /services/organizational-design (fallback)       |
| kamu-esg             | /iletisim (Görüşme Planla fallback)              |
(also available, unmapped: /services/cloud-platform-modernization — use as secondary CTA under
yapay-zeka-teknoloji). Cross-links live INSIDE perspektifler pages only — services pages untouched.

2.5 URL GRAMMAR (complete):
  /perspektifler                         hub (canonical; 301 from /blog)
  /en/insights                           EN hub (hreflang pair via pair_id)
  /perspektifler/kategori/<slug>         10 pillar pages (indexable)
  /perspektifler/konu                    all-topics page (indexable; vocab grouped by category)
  /perspektifler/konu/<slug>             tag listing (noindex,follow)
  /perspektifler/ara?q=                  search results (noindex)
  /perspektifler/<article-slug>          article (indexable; schema.org Article+BreadcrumbList)
  Params: ?kategori=<slug>&format=<makale|vaka-analizi|rapor|founder-letter>&konu=<tag>
          &sektor=<slug>&yil=<YYYY>&sirala=<yeni|populer>&page=<N>&q=<text>
  Rules: ALL filter state in URL (shareable, refresh-safe); param'd views canonicalize to their
  base path; ?page=N links rendered crawlable under Load-More; never emit links to zero-result
  facet URLs; every retired tag/category/blog URL 301s (146-entry map, GATE-1) — never 404.

2.6 SITE-WIDE MENU BEHAVIOR CONTRACT (panel-agnostic — fixes OBS-01/02 class for ALL panels):
closed by default on every route; opens on click OR hover-intent (open delay 200–300ms, close
grace 300–500ms — NN/g timing guidance; no flicker, no diagonal-path loss); closes on ESC /
outside click / route change / scroll >100px; aria-expanded + aria-controls + full keyboard path
(Tab/Shift-Tab/Enter/ESC); panel z-index above ALL page content incl. hero text, with subtle
backdrop; closed panel inert (aria-hidden + pointer-events:none); link budget per panel 28–36 max,
3–4 columns + ≤1 promo (NN/g); focus never trapped. Insights panel content (already shipped
GATE-2): Kategoriler(6+Tümü) · Formatlar(4) · Öne Çıkanlar(3) · promo 2026 AI Dönüşüm Raporu ·
footer "Tüm içgörüleri keşfedin →". Services/Sektörler panel CONTENT untouched — behavior only.
Test matrix runs the SAME spec across panels: [insights, services, sektorler] × routes
[/, /services, /perspektifler, /case-studies, /hakkimizda].

══════════════════ 3 · PAGE BLUEPRINTS (component tree + exact copy + states) ══════════════════

3.1 HUB /perspektifler (top→bottom):
 a) HERO — H1 "Perspektifler" + tagline_tr "Strateji, yapay zeka ve dönüşüm üzerine veriye dayalı
    içgörüler" / tagline_en "Data-driven insights on strategy, AI and transformation".
    1 featured lead (large, 16:9) + 3 secondary picks (featured:true, max 4 — curated layer above
    the chronological stream; benchmark consensus #1).
 b) SEARCH — prominent input, placeholder_tr "İçgörülerde ara…" (switch to "1.000+ içgörüde ara…"
    only when count is true), placeholder_en "Search insights…"; submits to /perspektifler/ara?q=;
    visible focus ring; ESC clears.
 c) FACET BAR (sticky; SAME chip language as /services per OBS-05) — order: Kategori · Format ·
    Konu · Sektör · Yıl · Sıralama. Desktop: live update on select; mobile: bottom-sheet + button
    "N Sonucu Göster". Every facet shows live counts; zero-result values not clickable; facet with
    <2 results hidden entirely; ALL state in URL (§2.5); "Filtreleri temizle" appears when ≥1 active.
 d) GRID — 12 cards initial; button "Daha Fazla Yükle" (+12); crawlable ?page=N links beneath;
    DOM ≤48 cards (window beyond); footer must remain reachable (no infinite scroll).
 e) TOPIC CHIPS — ≤12 most-used tags + "Tüm Konular →" (/perspektifler/konu).
 f) FOUNDER LETTER capsule (existing component) after first 12 cards — reposition only; KVKK copy
    intact.
 STATES — loading: skeleton cards ×12 (no CLS; reserve 16:9 + text rows); empty (no content):
 "Henüz içgörü yayınlanmadı." + featured fallback; zero-result (filters): "Bu filtrelerle sonuç
 bulunamadı." + "Filtreleri temizle" + 3 category suggestions; error: retry button + logged event.

3.2 CARD SPEC (scan-first; the card carries the decision):
title ≤60ch (2-line clamp) · excerpt 140–160ch (3-line clamp) · category chip (→ kategori page) ·
format icon+label · date (DD AAA YYYY tr-TR) · "X dk okuma" (200wpm auto) · 16:9 thumb lazy
AVIF/WebP ≤40KB explicit width/height · whole card = one <a> · visible focus ring · hover
scale-[1.02] active scale-[0.98] (doctrine micro-interaction; no blur/glass).

3.3 KATEGORİ PILLAR /perspektifler/kategori/<slug> (×10):
breadcrumb Hub→Category · H1 = label_tr · pillar intro 150–300 words (eCyPro'nun bu alandaki
görüşü; one per category, written once, schema'd) · "Buradan başlayın" 3 curated evergreen ·
İlgili Hizmet CTA card (matrix §2.4: label "İlgili Hizmet: <service>" + "İncele →" verified href)
· chronological grid w/ facet bar (kategori pre-locked, hidden from bar) · link up "Tüm
Perspektifler →". Pillar lists newest + curated cluster (two-way hub-spoke links above the fold —
pillar→spokes in intro zone, spokes→pillar via breadcrumb+inline; SEO hub-and-spoke).

3.4 ARTICLE /perspektifler/<slug>:
breadcrumb Hub→Category→Article · H1 · meta row (category chip · format · date · read time ·
author) · sticky TOC auto for ≥1200 words · body (MDX) · inline Founder-Letter CTA after 2nd H2
(or category service CTA per §2.4) · author box (Emre Can Yalçın — bio+role; E-E-A-T) · "İlgili
İçgörüler" 3 by tag-overlap score (same-category fallback) · series prev/next when series_id ·
schema.org Article + BreadcrumbList. INTERLINK QUOTA: every article ≥3 in-cluster contextual
links + 1 pillar link (Ahrefs 3–5 band; check-links.mjs enforces; 0 orphans).

3.5 TÜM KONULAR /perspektifler/konu: vocabulary grouped under the 10 category headings, A–Z within
group, live counts, zero-count tags hidden; replaces any 120-tag cloud forever.

3.6 404/REDIRECT POLICY (OBS-04): retired URLs resolve via the 146-entry 301 map BEFORE the 404
boundary; 404 page keeps search + 3 suggestion cards; add weekly crawl assertion: 0 internal 404s,
0 redirect chains >1 hop.

══════════════════ 4 · DESIGN SYSTEM + MOTION/3D GUARDRAILS ══════════════════
Surfaces opaque M3 #1E1F20 family (NO glassmorphism/backdrop-blur) · type Inter/Roboto with
golden scale text-golden-base/lg/xl/2xl · spacing ONLY fib classes (p-fib-6=21px, gap-fib-7=34px,
mb-fib-9=89px…) · tokens via CSS vars, hex never inline in components · contrast ≥4.5:1 on
dark+gold · all strings through i18n keys (insights*.ts, TR+EN).
MOTION/3D (allowed, bounded): one hero accent max (e.g. particle/line field) — React.lazy +
IntersectionObserver mount; DPR cap 1.5–2; instancing for repeats; dispose geometries/materials/
textures on unmount; pause off-viewport; prefers-reduced-motion → static fallback image; zero
layout shift (reserved box); 3D never in LCP path; ships ONLY if AC-06+AC-07 pass with it ON,
else cut and log the decision. Micro-interactions: transform/opacity only (hover:scale, active:
scale); no width/height/box-shadow animation (INP/CLS).

══════════════════ 5 · SEARCH ENGINE SPEC ══════════════════
SPA stack (Vite/React — verify vite.config.ts) → client index: MiniSearch or Fuse.js (ONE dep max),
built at deploy over {title, excerpt, tags, category, format, lang}; diacritic-insensitive
normalization re-using the Phase-1 slugify table ("donusum" finds "dönüşüm", "yapay zeka" finds
"#yapay-zeka"); facet logic AND across types / OR within; results <300ms p95; zero-result state
suggests 3 categories; events: search_query{q,results} + zero_result{q}. Committed 30-query
Turkish test set (mix: exact TR, diacritic-stripped, EN term, tag, category, 5 intentional misses)
→ runner asserts zero-result <5% (i.e. ≤1 unintended of 25 valid) + p95 <300ms.

══════════════════ 6 · FLOAT GOVERNANCE (site-wide; fixes OBS-03/BUG-08) ══════════════════
| element                         | rule                                                        |
|---------------------------------|-------------------------------------------------------------|
| Chat bubble (bottom-right)      | KEEP — persistent #1                                        |
| A11y eye + TR/EN globe          | MERGE into one settings float — persistent #2               |
| Content toasts (bottom-left)    | REMOVE as float → one dismissible "Yeni" badge on the       |
|                                 | Perspektifler nav item (analytics event preserved)          |
| Welcome-Back / Book-Now banner  | returning visitors only · auto-dismiss 8s · never overlaps  |
|                                 | chat · suppressed while any menu panel is open              |
| ANALYTICS debug pill            | production: hidden behind owner env flag (default OFF)      |
| Cookie banner (KVKK)            | unchanged (compliance) — but z-order below open menu panel  |
HARD RULE: ≤2 persistent floats per viewport at any time, on EVERY route (Playwright counts).

══════════════════ 7 · PERF / A11Y / SEO BUDGETS (gate numbers) ══════════════════
PERF — LCP ≤2.5s (aspire 2.0s) · INP ≤200ms · CLS ≤0.1 (mobile throttled, hub+article) · hub JS
≤150KB gz · images AVIF/WebP ≤40KB 16:9 lazy + explicit dims · route-level code-split; menu and
3D assets non-blocking. A11Y — WCAG 2.2 AA: axe-core 0 critical/serious on hub/kategori/article/
open-menu; keyboard complete; skip-link; reduced-motion. SEO — hreflang tr↔en via pair_id;
kategori indexable; konu/tag noindex,follow; ara noindex; page/sort canonicalized; sitemap split
(hub/kategoriler/makaleler) regenerated in build; robots clean; schema validated; crawl: 0 broken
internal links, 0 chains >1 hop. ANALYTICS events (debug-verified + baseline noted): search_query,
zero_result, load_more, category_click, facet_apply{facet,value}, service_cta_click{category},
newsletter_submit.

══════════════════ 8 · EXECUTION PHASES (resume-aware; statuses verified 2026-06-12) ══════════════════
{ "phases": [
 {"id":0,"title":"Recon","status":"done","evidence":"PROGRESS.md GATE-0"},
 {"id":1,"title":"Taxonomy","status":"done","evidence":"check-taxonomy 13/13 PASS"},
 {"id":2,"title":"Menu (insights)","status":"done","evidence":"vitest 27/27; PW run owner-pending",
  "carry_over":["npx playwright test menu --project=chromium on owner machine"]},
 {"id":"3.0","title":"IA v2 confirm (this macro)","status":"pending","steps":[
   "Re-verify OBS-01..05 on branch (grep/dev-run); log deltas",
   "Extend menu behavior contract+tests to ALL panels (§2.6 matrix) — Navbar/MegaMenu only",
   "Add sectors[] optional frontmatter + Sektör facet data source (§2.2)",
   "Wire category↔service CTA data (§2.4 matrix) into taxonomy-adjacent config",
   "Gate 3.0: node scripts/check-taxonomy.mjs green + vitest menu suite green (all panels)"]},
 {"id":3,"title":"Hub /perspektifler","status":"pending","steps":[
   "301 /blog→/perspektifler (+/en/insights pair); reverse App.tsx:441; vercel.json entries",
   "Hero 1+3 featured (§3.1a)","Search shell → /perspektifler/ara (§3.1b)",
   "Facet bar w/ URL state + counts + hide-<2 (§3.1c, incl. Sektör)",
   "Grid 12 + Load More + ?page=N + DOM≤48 (§3.1d)","Chips ≤12 + Tüm Konular (§3.5)",
   "Founder capsule reposition (§3.1f)","States: skeleton/empty/zero/error (§3.1)",
   "Optional 3D hero accent under §4 guardrails",
   "Gate 3: URL round-trip e2e + build exit 0 + LH mobile ≥90 JSON"]},
 {"id":4,"title":"Pillar + Article","status":"pending","steps":[
   "10 pillar pages §3.3 (intro 150–300w ×10 + Buradan Başlayın ×3 + service CTA)",
   "Article template §3.4 (TOC≥1200w, author box, related-by-tag, series, schema)",
   "scripts/check-links.mjs: ≥3 in-cluster + pillar link, 0 orphans (20-article sample)",
   "Gate 4: node scripts/check-links.mjs PASS + rich-results on longest+shortest"]},
 {"id":5,"title":"Search","status":"pending","steps":[
   "Index build at deploy (§5)","Diacritic-insensitive + AND/OR facet logic",
   "30-query TR set + runner","Gate 5: zero-result <5%, p95 <300ms output pasted"]},
 {"id":6,"title":"Quality sweep","status":"pending","steps":[
   "CWV budgets §7 (LH hub+article)","axe 0 crit/serious ×4 states",
   "Float governance §6 (≤2 persistent, every route)","SEO/i18n §7 + sitemap + crawl",
   "Gate 6: LH JSONs ≥90/≥95 + axe + crawl clean + ≤2-floats screenshot"]},
 {"id":7,"title":"E2E proof","status":"pending","steps":[
   "e2e/e2e-perspektifler.spec.ts single journey: build→/ closed-menu→panel ≤30→hub→facets→URL
    repro→Load More→article→breadcrumb→search 'dönüşüm'<300ms→retired-tag 301",
   "Gate 7: green run pasted (owner machine if sandbox lacks browsers)"]},
 {"id":8,"title":"SEO/i18n hardening","status":"pending","steps":["close gate-6 crawl deltas","Gate 8: re-crawl clean"]},
 {"id":9,"title":"Content ops @1000","status":"pending","steps":[
   "Runbook: featured ≤4 no-deploy edit; evergreen/news flag; quarterly decay+tag-merge review;
    publish checklist (excerpt len, ≤5 tags, ≥3 links, sectors ≤2)","Gate 9: non-dev walkthrough recorded"]},
 {"id":10,"title":"FINISH — PR (no merge)","status":"pending","steps":[
   "PR 'feat(perspektifler): rebuild insights vertical' — body = AC-01..14 evidence table +
    OUT_OF_SCOPE.md + PROGRESS.md decision log","separate verifier pass reads diff vs plan",
   "Gate 10: 14/14 AC rows evidenced; merge stays owner-only"]} ] }

══════════════════ 9 · ACCEPTANCE CRITERIA (binding; replaces "flawless") ══════════════════
AC-01 menu closed-by-default + ESC/outside/route/scroll close (Playwright) — ALL panels
AC-02 nav icon artifacts gone (screenshot diff) · AC-03 insights panel ≤30 links, insights-only
AC-04 20 random slugs ≤3 clicks from hub (script) · AC-05 vocab ≤60, 0 dup slugs, 100% 301
AC-06 CWV budgets met, LH ≥90 (JSONs) · AC-07 axe 0 critical/serious ×4 states
AC-08 search zero-result <5%, p95 <300ms · AC-09 URL-state round-trip reproduces any view
AC-10 ≤2 persistent floats every route (incl. /services — OBS-03) · AC-11 hreflang+schema valid,
crawl 0 broken/0 chains · AC-12 analytics events firing w/ baseline · AC-13 menu contract green on
panel×route matrix §2.6 (incl. hero-above test on /services — OBS-02) · AC-14 all 10 pillars show
correct İlgili-Hizmet CTA (matrix §2.4) with verified hrefs (script greps rendered output).

══════════════════ 10 · KICKOFF ══════════════════
(1) Expert Role Card for first pending phase → (2) preflight: node -v · npm run typecheck ·
npm run test -- --run · npm run build → BASELINE to PROGRESS.md → (3) load §8 phases into todo →
(4) execute per laws; gate evidence → PROGRESS.md + commit → next phase same session while context
allows, else compaction note + clean stop AT a gate boundary → (5) final: PR per Phase 10. DO NOT
MERGE. DO NOT touch anything outside SCOPE.md allowlist. Slash shortcuts available in-repo:
/plan /implement /fix /typecheck /lint-fix /e2e-fast /e2e /review /commit /lighthouse-check
/performance /publish-check /secret-scan /phase-status /rollback.

</macro_prompt>
```

---

## SOURCES (kanıt zinciri)

**Repo (verified bu oturum):** `src/data/perspektifler/taxonomy.json` (10 kategori + 57 tag, TR/EN) ·
`src/data/copy/common.ts` (MEGA_MENUS.services 9 href, sektorler route'ları) · `brain/perspektifler-audit/AUDIT.md`
(benchmark matrisi: 2 live + 8 inferred, 6 konsensüs kuralı) · `brain/PERSPEKTIFLER_REBUILD_SPEC.md` ·
`PROGRESS.md` (GATE-0/1/2 kanıtları) · `SCOPE.md` + allowlist · canlı ekran görüntüleri 2026-06-12 01:44–47 (OBS-01..05).
**Web:** [NN/g Mega Menus Work Well](https://www.nngroup.com/articles/mega-menus-work-well/) ·
[NN/g hover timing](https://www.nngroup.com/articles/timing-exposing-content/) ·
[NN/g menu checklist](https://www.nngroup.com/articles/menu-design/) (28–36 link / 3–4 kolon bandı ikincil derlemelerden — inferred) ·
[Search Engine Land topic clusters](https://searchengineland.com/guide/topic-clusters) ·
[Siteimprove pillar-cluster](https://www.siteimprove.com/blog/pillar-and-cluster-content-strategy/) (3–5 bağlamsal link, çift yönlü hub-spoke) ·
[Bain Insights](https://www.bain.com/insights/) · [BCG Publications](https://www.bcg.com/publications) (dual topic×industry — inferred) ·
istek.md §7'deki Anthropic + CWV + R3F kaynakları aynen geçerli.

