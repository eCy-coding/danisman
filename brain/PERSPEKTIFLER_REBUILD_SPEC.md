Bu isteğimi eksiksiz anla. TAm karşılığı gelen ingilizceye çevir! ingilizceye çevrilen bölümde istenilen isteğin tüm eksikliklerini search ederek araştır hesapla ve en çok verim alacak kritik önceliği olan önerilerin ile isteğin eksikliklerini geliştir! böyle bir web sayfası var! web sayfasının perspektifler bölümünde bir çok hata var. perspektifler' bölümü olan 15-25 veya yeteri kadar web sayfasını inceleyip, perspektifler bölümünü kusursuz hirerşik içerisindeki yol haritası, 1.000'tane makeleyi insanların yorulmayacağı şekilde dizayn edilmiş bir mimar ile inşa edilmesini önce diğer web sayfalarını araştırıp, hesaplayıp öğrenip, Perspektif bölümünü düzelteceğin prompt'u yaz.
MISSION (micro-focus contract)
Rebuild and fix ONE vertical of this codebase: the "Perspektifler" (Insights) section of
ecypro.com. Nothing else. The scope-guard hook is already active; SCOPE.md and
.claude/scope-allowlist.txt are the single source of truth for what you may edit, and YOU
expand them only with evidence in Phase 0. This spec is self-contained: it names the bugs,
the data model, the page specs, what is out of scope, and ends with an end-to-end
verification that proves the section works.

NON-GOALS (explicit, per scope fence)
No redesign of homepage, Hizmetler, Sektörler, Fiyatlandırma, Hakkımızda, İletişim pages.
No CMS/platform migration. No new analytics vendor. No content writing beyond pillar intros
and metadata. The global header is touched ONLY to fix BUG-01/02/12 and replace the
Perspektifler panel content — minimal diff, no visual redesign of other nav items.

NORTH STAR (the fatigue budget for a 1,000-article future)
Any article reachable in ≤3 clicks or ≤2 facet picks from the hub · never >12 simultaneous
choices on screen · scan-first cards (users read ~20–28% of words; the card carries the
decision) · search is first-class · architecture works today at ~30 items (hide facets with
<2 results) and scales linearly to 1,000.

KNOWN BUGS (verified from 2026-06-11 screenshots; reproduce each before fixing)
BUG-01 Perspektifler mega-menu renders OPEN over content on /case-studies /blog /methodology
/about (default-open or stuck hover; z-index overlay). Must close on route change,
outside click, ESC, scroll.
BUG-02 Empty checkbox-like artifact before every top-nav label and the logo's "Ana Sayfa".
BUG-03 Menu scope wrong: contains SEKTÖRLER and HAKKIMIZDA groups duplicating sibling nav.
BUG-04 Menu footer says "Tüm hizmetlerimizi keşfedin" inside the insights panel.
BUG-05 ~120 free-form tags with duplicates: (#AI|#ai|#Artificial Intelligence|#yapay zeka|
#Yapay Zeka), (#AB Regulasyon|#AB regülasyon), (#Aile Şirketi|#aile-sirketi),
(#insan kaynakları|#İnsan Kaynakları|#insan-kaynaklari), (#six sigma|#six-sigma),
(#strateji|#Strateji), (#danismanlik|#danışmanlık hizmetleri), TR/EN mixing, tags
duplicating categories (#Liderlik, #m-and-a).
BUG-06 Naming drift: nav "Perspektifler" / URL /blog / H1 "Strateji & AI Danışmanlığı
İçgörüleri" / eyebrow "PERSPEKTİFLER & ANALİZ".
BUG-07 /about duplicated overlapping headline layer (fix only the shared CSS layer cause if
it lives in global styles; the /about page content itself is out of scope —
if page-local, log to OUT_OF_SCOPE.md).
BUG-08 Up to 5 floating elements in one viewport (toast, a11y eye, TR globe, chat bubble,
Welcome Back banner).
BUG-09 No search anywhere in insights.
BUG-10 Blog list: no pagination/sort/format filter.
BUG-11 Case-studies categories and blog categories are two parallel systems — unify.
BUG-12 /blog hero text sits beneath the menu layer; watermark text collides at some widths.

OPERATING RULES
R1 Evidence or silence: every path/route/selector you cite comes from grep/ls/cat output.
R2 Every gate ends with a check YOU run (build exit code, test run, JSON report,
screenshot) and you paste the evidence. "Looks done" is not a signal.
R3 No questions to the user. Default + one-line rationale + proceed.
R4 After each gate: update PROGRESS.md (done/decisions/next) and commit
`feat(perspektifler): gate-N — <summary>`.
R5 If blocked by an out-of-scope dependency: OUT_OF_SCOPE.md entry, continue elsewhere.

════ PHASE 0 — RECON (plan mode, read-only) ════
0.1 Detect stack: read package.json / framework configs / CMS markers; state stack +
build/test/dev commands; append the verified commands to CLAUDE.md if missing.
0.2 Locate by grep, record exact paths into SCOPE.md and expand
.claude/scope-allowlist.txt accordingly:
(a) header/menu component + its styles, (b) blog/insights routes & templates,
(c) tag/category data source + rendering, (d) case-studies category source,
(e) floating widgets (toast, banner, a11y, chat), (f) redirects config,
(g) sitemap/SEO config, (h) i18n config.
0.3 Reproduce BUG-01..12: for each, root cause (selector/computed z-index/listener or data
source), fix strategy, effort S/M/L — as a table.
0.4 Content inventory script → content-inventory.csv:
url, lang, title, category, tags[], word_count, date, format.
0.5 Output PLAN.md: ordered fix/build plan per the phases below, mapped to real paths.
GATE-0 evidence: SCOPE.md + allowlist expanded, bug table, CSV, PLAN.md. Then exit plan
mode and wait for one user approval to start Phase 1.

════ PHASE 1 — TAXONOMY (data layer only) ════
1.1 taxonomy.json — categories (closed, exactly 10, shared by blog AND case studies;
fixes BUG-11): strateji · yapay-zeka-teknoloji · finans-ekonomi · insan-organizasyon ·
operasyon · pazarlama-cx · global-vizyon · kamu-esg · liderlik · ma-degerleme.
1.2 Tag vocabulary ≤60 terms, fields {slug, label_tr, label_en}. Slug rule: lowercase
ASCII (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u), hyphen separator. Authors cannot mint tags
(controlled vocabulary). Max 5 tags/article.
1.3 merge-map.json from the 0.4 inventory; seed rows (extend to cover 100%):
ai|AI|Artificial Intelligence|yapay zeka|Yapay Zeka → yapay-zeka
AB Regulasyon|AB regülasyon → ab-regulasyonu
Aile Şirketi|aile-sirketi → aile-sirketleri
insan kaynakları|İnsan Kaynakları|insan-kaynaklari → insan-kaynaklari
six sigma|six-sigma → alti-sigma
strateji|Strateji → (category; drop as tag)
danismanlik|danışmanlık hizmetleri → danismanlik
dijital dönüşüm|Dijital Dönüşüm|Dönüşüm → dijital-donusum
Liderlik(tag) → (category; drop) · m-and-a(tag) → (category ma-degerleme; drop)
1.4 redirects: /blog→/perspektifler (+EN pair /en/insights) and EVERY retired tag/category
URL → survivor or category page.
1.5 Frontmatter/schema per article: { slug, lang, pair_id, title≤60ch, excerpt 140–160ch,
category(1/10), tags≤5, format(makale|vaka-analizi|rapor|founder-letter), date, updated,
author, read_time(auto, 200wpm), featured(bool, max 4 true), series_id?,
hero_image(AVIF/WebP ≤40KB) }.
GATE-1: write scripts/check-taxonomy.\* → asserts 0 duplicate normalized slugs, every
inventory tag mapped, redirect map covers 100% of old URLs. Run it; paste output.

════ PHASE 2 — MENU (fix BUG-01..04, BUG-12 z-index) ════
Behavior: closed by default on every route; opens on click OR hover-intent 200–300ms;
closes on ESC / outside click / route change / scroll >100px; aria-expanded+aria-controls;
full keyboard path; panel above content with subtle backdrop.
Panel (insights-only, ≤30 links, 3 columns + promo): Col1 Kategoriler = top 8 with live
counts + "Tüm kategoriler →" · Col2 Formatlar = Makaleler/Vaka Analizleri/Raporlar/Founder
Letter · Col3 Öne Çıkanlar = 3 editor picks (thumb+title) · Promo = 2026 AI Dönüşüm Raporu
(existing card) · Footer = "Tüm içgörüleri keşfedin →" (hub). REMOVE SEKTÖRLER + HAKKIMIZDA
groups. Remove BUG-02 artifacts.
GATE-2: Playwright spec tests/menu.spec — closed-on-load across 5 routes, ESC/outside/route
close, keyboard path, link count ≤30. Green run + before/after screenshots.

════ PHASE 3 — HUB /perspektifler ════
301 live from /blog. One H1 system: "Perspektifler". Layout: (a) hero 1 featured lead + 3
secondary picks (curated layer above the chronological stream); (b) prominent search box;
(c) sticky facet bar Kategori·Format·Konu·Yıl·Sıralama — desktop updates results live,
mobile bottom-sheet with "N Sonucu Göster"; counts on every facet; zero-result facets not
clickable; ALL state in URL; (d) 12 cards initial + "Daha Fazla Yükle" +12 with crawlable
?page=N links underneath; DOM ≤48 cards; footer stays reachable; (e) topic chips max 12 +
"Tüm Konular" page (full vocabulary grouped under category headings); (f) existing Founder
Letter capsule after first 12 cards (reposition, don't rebuild; keep KVKK copy).
Card: title≤60ch · excerpt 140–160ch · category chip · format icon · date · "X dk okuma" ·
16:9 lazy AVIF/WebP ≤40KB · whole card is link · visible focus ring.
GATE-3: URL-state round-trip test (apply filters → copy URL → fresh context reproduces
view) + Lighthouse mobile on hub ≥90 perf (JSON attached) + empty-facet hiding verified at
current content volume.

════ PHASE 4 — CATEGORY (pillar) + ARTICLE templates ════
Category /perspektifler/kategori/<slug>: 150–300-word pillar intro + "Buradan başlayın" 3
curated evergreen + chronological grid (category pre-locked facet bar) + link up to hub.
Article: breadcrumb Hub→Category→Article · meta row (chip, format, date, read time, author)
· sticky TOC when ≥1200 words · author box (Emre Can Yalçın) · inline Founder Letter CTA
after 2nd H2 · "İlgili İçgörüler" 3 by tag-overlap (same-category fallback) · series
prev/next · schema.org Article+BreadcrumbList. Interlink quotas: article→pillar always;
≥3 internal links per article; pillar lists newest+curated.
GATE-4: scripts/check-links.\* on a 20-article sample → quotas met, 0 orphans; rich-results
validation on longest+shortest article.

════ PHASE 5 — SEARCH ════
Static index at build (Pagefind if static stack; else Fuse/Lunr) over title+excerpt+tags+
category+format+lang; diacritic-insensitive ("donusum" finds "dönüşüm"); facet logic AND
across types / OR within; events: search_query + zero_result flag.
GATE-5: 30-query Turkish test set committed → zero-result <5%, p95 <300ms; paste run.

════ PHASE 6 — QUALITY SWEEP ════
Budgets: LCP≤2.5s INP≤200ms CLS≤0.1 (mobile, throttled); hub JS ≤150KB gz; menu assets
non-blocking. axe-core: 0 critical/serious on hub/category/article/open-menu; contrast
≥4.5:1 on dark+gold; prefers-reduced-motion; skip-link. Floats: max 2 persistent (chat +
merged a11y/lang); toasts → one dismissible "Yeni" badge on the Perspektifler nav item;
Welcome-Back banner returning-visitors only, auto-dismiss 8s, never overlapping chat
(fixes BUG-08). SEO: hreflang tr↔en via pair_id; category pages indexable; tag pages
noindex,follow; page/sort params canonicalized; sitemap updated; no links to zero-result
facet URLs.
GATE-6: Lighthouse JSONs (hub+article) ≥90 perf / ≥95 a11y · axe reports · crawl run
(0 broken internal links, 0 redirect chains >1 hop) · viewport screenshot showing ≤2 floats.

════ END-TO-END FINAL CHECK (the proof the section works) ════
One scripted run: clean build → open / (menu closed, no artifacts) → open Perspektifler
panel (≤30 links, insights-only) → go hub → apply Kategori=yapay-zeka-teknoloji +
Format=rapor → copy URL → fresh context reproduces it → Load More once (footer reachable)
→ open an article → breadcrumb back to category pillar → search "dönüşüm" (results <300ms)
→ visit one retired tag URL (301 lands correctly). All assertions in one Playwright file:
tests/e2e-perspektifler.spec. Paste the green run.

ACCEPTANCE (all must show evidence in the PR body)
AC-01 menu closed-by-default + close behaviors (GATE-2 run) · AC-02 nav artifacts gone
(screenshot diff) · AC-03 panel ≤30 insights-only links · AC-04 20 random slugs ≤3 clicks
(script) · AC-05 vocab ≤60, 0 duplicate slugs, 100% 301 coverage (GATE-1 run) · AC-06 CWV
budgets met (JSONs) · AC-07 axe 0 critical/serious · AC-08 zero-result <5%, p95 <300ms ·
AC-09 URL round-trip · AC-10 ≤2 floats · AC-11 hreflang+schema valid, crawl clean ·
AC-12 events firing (debug screenshot) with pre-launch baseline noted.

FINISH
Open PR "feat(perspektifler): rebuild insights vertical" — body = AC table with evidence
links, OUT_OF_SCOPE.md contents, and the PROGRESS.md decision log. Do not merge.

ROLE
You are a senior Information Architect + Frontend Engineer + Content Strategist rebuilding the
"Perspektifler" (Insights) section of ecypro.com — a Türkiye-based strategy & AI consultancy
(TR primary, EN secondary). You work under eCyPro discipline v3.6: every factual claim is
verified by a deterministic tool (DOM inspection, curl, Lighthouse JSON, axe, link-checker,
screenshot) or explicitly labeled inferred/unknown. You never claim "done" without the verify
gate output. You do not ask the user questions; you choose sensible defaults, state them in
one line, and proceed. "Flawless" is banned vocabulary — only the Acceptance Criteria in §10
count.

NORTH STAR
A reader must be able to move through a library that will grow to 1,000 articles without
fatigue: any article reachable in ≤3 clicks or ≤2 facet selections from the hub; never more
than ~12 simultaneous choices on screen; scan-first cards carrying the full decision payload;
search as a first-class control. The architecture must already work gracefully today at ~30
items (hide any facet with <2 results) and scale linearly to 1,000.

CONTEXT — CURRENT STATE (verified from screenshots dated 2026-06-11; reproduce each in Phase 0)
BUG-01 Perspektifler mega-menu renders OPEN over page content on at least /case-studies,
/blog, /methodology, /about — covering the "Başarı Hikayeleri" hero and the KATEGORİ
row. Suspect: default-open state, hover handler without close, or z-index/overlay
misuse. Must close on route change, outside click, ESC, and scroll.
BUG-02 Every top-nav item (Hizmetler, Sektörler, Perspektifler, Fiyatlandırma, Hakkımızda,
İletişim) and the logo's "Ana Sayfa" label is preceded by an empty checkbox-like
square — broken icon/input rendering artifact. Remove or replace with real icons.
BUG-03 Mega-menu scope is wrong: it contains a SEKTÖRLER group (duplicates the "Sektörler"
nav item) and a HAKKIMIZDA group (Metodolojimiz, Firmamız — duplicates "Hakkımızda").
Only insights content belongs in this panel.
BUG-04 Menu footer reads "Tüm hizmetlerimizi keşfedin" (services wording) inside the
insights panel — scope mismatch.
BUG-05 /blog exposes ~120 free-form tags with duplicates and casing/diacritic/hyphen chaos,
e.g. (#AI | #ai | #Artificial Intelligence | #yapay zeka | #Yapay Zeka),
(#AB Regulasyon | #AB regülasyon), (#Aile Şirketi | #aile-sirketi),
(#insan kaynakları | #İnsan Kaynakları | #insan-kaynaklari),
(#six sigma | #six-sigma), (#strateji | #Strateji),
(#danismanlik | #danışmanlık hizmetleri), TR/EN mixing (#Investment, #Forecasting,
#Production among Turkish tags), and tags duplicating categories (#Liderlik, #m-and-a).
BUG-06 Naming drift: nav "Perspektifler" / URL /blog / H1 "Strateji & AI Danışmanlığı
İçgörüleri" / eyebrow "PERSPEKTİFLER & ANALİZ".
BUG-07 /about renders a duplicated overlapping headline layer ("Stratejik Danışmanlık" ghost
text behind "eCyverse Ekosistemi") — typography layering bug.
BUG-08 Up to 5 floating UI elements compete in one viewport: toast (bottom-left), a11y eye
button, TR globe button, chat bubble (bottom-right), "Welcome Back / Book Now" banner.
BUG-09 No search control anywhere in the insights area.
BUG-10 Blog list has no visible pagination, sort, or format filter.
BUG-11 Case-studies filter bar exists (Tümü 6 / Culture 1 / Family Business 1 / M&A 1 /
Manufacturing 1 / Organizational 1 / Technology 1) but is not unified with blog
taxonomy — two parallel category systems.
BUG-12 Hero/HTML text on /blog sits beneath the menu layer (z-index), and decorative
watermark text collides with content at some widths.

═══════════════ PHASE 0 — AUDIT & BENCHMARK (read-only; no writes) ═══════════════
0.1 Reproduce BUG-01…BUG-12 with DOM evidence (selector, computed z-index, event listeners)
and a screenshot each. Output a table: bug → root cause → fix strategy → effort (S/M/L).
0.2 Visit ≥15 of: McKinsey Featured Insights; BCG Publications; Bain Insights; Deloitte
Insights; PwC strategy+business; EY Insights; Accenture Foresight; KPMG Insights; HBR;
MIT SMR; NN/g Articles; Gartner Insights; Forrester Blog; Sequoia Perspectives; a16z;
First Round Review; Bessemer Atlas; Stripe Guides; Intercom Blog; HubSpot Blog; Ahrefs
Blog; Smashing Magazine; CB Insights Research; Kearney Insights; Oliver Wyman Insights.
Fill a matrix: {primary nav model, category count, tag exposure, search placement, list
loading pattern, card metadata, article template features, newsletter capture, flagship
report treatment}. Mark each cell verified (you saw it) — no guessing.
0.3 Inventory existing eCyPro content: every article/case URL, current category, current
tags, word count, language. Output CSV. This feeds the migration map.
GATE 0: bug table + benchmark matrix + content CSV exist. No build work before this gate.

═══════════════ PHASE 1 — TAXONOMY & CONTENT MODEL ═══════════════
1.1 Categories (closed, exactly these 10, one per article, unify blog + case studies):
strateji · yapay-zeka-teknoloji · finans-ekonomi · insan-organizasyon · operasyon ·
pazarlama-cx · global-vizyon · kamu-esg · liderlik · ma-degerleme
1.2 Controlled tag vocabulary: ≤60 terms, bilingual label pairs (label_tr, label_en), one
canonical slug each. Slug rules: lowercase ASCII (ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u),
hyphen separator, no duplicates after normalization (enforce with a script).
Authors CANNOT create tags (NN/g controlled-vocabulary rule); new terms enter only via
quarterly review. Max 5 tags/article; merge any tag projected <10 uses at scale.
1.3 Migration merge map (extend from Phase 0.3 inventory; seed rows):
ai, AI, Artificial Intelligence, yapay zeka, Yapay Zeka → yapay-zeka
AB Regulasyon, AB regülasyon → ab-regulasyonu
Aile Şirketi, aile-sirketi → aile-sirketleri
insan kaynakları, İnsan Kaynakları, insan-kaynaklari → insan-kaynaklari
six sigma, six-sigma → alti-sigma
strateji, Strateji → (category, drop as tag)
danismanlik, danışmanlık hizmetleri → danismanlik
dijital dönüşüm, Dijital Dönüşüm, Dönüşüm → dijital-donusum
Liderlik (tag) → (category, drop as tag)
m-and-a (tag) → (category ma-degerleme, drop)
kurumsal, kurumsal ai, kurumsal-strateji, kurumsallasma → review: ≤2 survivors
Every retired tag URL gets a 301 to its survivor or its category page. Zero 404s.
1.4 Content schema (CMS/frontmatter):
{ slug, lang(tr|en), pair_id, title(≤60 chars), excerpt(140–160 chars), category(1/10),
tags[≤5 from vocab], format(makale|vaka-analizi|rapor|founder-letter),
date, updated, author, read_time(auto wpm 200), featured(bool, max 4 true),
series_id?, hero_image(AVIF/WebP ≤40KB) }
GATE 1: vocabulary file + merge map + schema committed; normalization script returns 0
duplicate slugs; 301 map covers 100% of inventoried old URLs.

═══════════════ PHASE 2 — NAVIGATION (fix BUG-01..04, then redesign) ═══════════════
2.1 Behavior: closed by default everywhere; opens on click OR hover-intent (200–300 ms
delay); closes on ESC, outside click, route change, scroll >100 px; aria-expanded +
aria-controls; full keyboard operability (Tab/Shift-Tab/Enter/ESC, arrow keys optional);
panel z-index above page content with a subtle backdrop; never traps focus.
2.2 Panel content (insights-only, ≤30 links total, 3 columns + 1 promo card —
within the 28–36 link / 3–4 column research budget):
Col 1 "Kategoriler": top 8 categories with live counts + "Tüm kategoriler →"
Col 2 "Formatlar": Makaleler · Vaka Analizleri · Raporlar · Founder Letter
Col 3 "Öne Çıkanlar": 3 editor-picked items (thumbnail + title)
Promo card: 2026 AI Dönüşüm Raporu (existing asset, keep "Raporu İncele →")
Footer: "Tüm içgörüleri keşfedin →" linking to the hub (fixes BUG-04).
SEKTÖRLER and HAKKIMIZDA groups are REMOVED from this panel (they live under their own
nav items).
GATE 2: Playwright script proves: closed on load for 5 routes; opens/closes per spec;
keyboard path passes; link count ≤30; screenshots attached.

═══════════════ PHASE 3 — HUB PAGE (/perspektifler · /en/insights) ═══════════════
3.1 301: /blog → /perspektifler (and EN pair). One H1 system: "Perspektifler" + tagline.
3.2 Layout top→bottom:
a) Hero: 1 featured lead (large) + 3 secondary editorial picks — curated layer above
the chronological firehose (benchmark consensus #1).
b) Search bar, prominent, with placeholder "1.000+ içgörüde ara…" once true (until
then: "İçgörülerde ara…"). Client-side index (Fuse/Lunr/Pagefind) over title +
excerpt + tags; results <300 ms; zero-result state suggests categories.
c) Sticky filter bar: Kategori · Format · Konu(tag) · Yıl · Sıralama(yeni/popüler).
Desktop: results update live on selection; Mobile: bottom-sheet with "N Sonucu
Göster" apply button (Baymard pattern). Every facet shows item counts; facets with
zero results are not clickable; ALL state lives in the URL (shareable, refresh-safe).
d) Card grid: 12 cards initial, "Daha Fazla Yükle" +12 (Load More beats pagination and
infinite scroll in usability testing), with crawlable ?page=N links rendered
underneath for SEO; DOM never exceeds 48 cards (windowing beyond that); footer must
stay reachable.
e) Topic chips: max 12 most-used tags + "Tüm Konular →" page (full vocabulary, grouped
A–Z under category headings) — Hick's-law cap, never the 120-tag cloud again.
f) Founder Letter capsule (existing component) after the first 12 cards — keep KVKK
copy; this is benchmark consensus #8, reposition not rebuild.
3.3 Card spec (scan-first; users read ~20–28% of words — the card carries the decision):
title ≤60 chars · excerpt 140–160 chars · category chip · format icon · date ·
"X dk okuma" · 16:9 thumbnail lazy AVIF/WebP ≤40KB · whole card is the link target ·
visible focus ring.
GATE 3: hub renders at current content volume with empty-facets hidden; URL-state round-trip
test passes (apply filters → copy URL → fresh session reproduces view); Lighthouse mobile
perf ≥90 on the hub.

═══════════════ PHASE 4 — CATEGORY (PILLAR) PAGES ═══════════════
4.1 /perspektifler/kategori/<slug> : 150–300-word pillar intro (what eCyPro believes about
this domain) + "Buradan başlayın" 3 curated evergreen picks + chronological grid with
the same facet bar (category pre-locked) + link up to hub.
4.2 Pillar–cluster interlinking quotas: every article links to its category pillar
(breadcrumb + inline); every pillar lists its newest + curated cluster items; each
article carries ≥3 internal links to same-cluster pieces. This is the hub-and-spoke
model that builds topical authority for readers and search engines alike.
GATE 4: link-graph script confirms quotas on a 20-article sample; no orphan articles.

═══════════════ PHASE 5 — ARTICLE TEMPLATE ═══════════════
Breadcrumb (Hub → Category → Article) · H1 · meta row (category chip, format, date, read
time, author) · sticky TOC auto-generated for ≥1,200-word pieces (Stripe-guide pattern) ·
author box (Emre Can Yalçın — bio + role; E-E-A-T) · inline Founder Letter CTA after the
second H2 · "İlgili İçgörüler": 3 items by tag-overlap score, same-category fallback ·
series prev/next when series_id set · schema.org Article + BreadcrumbList.
GATE 5: template validated on longest + shortest existing article; rich-results test passes.

═══════════════ PHASE 6 — SEARCH & FILTER ENGINE ═══════════════
Index build at deploy (title, excerpt, tags, category, format, lang); diacritic-insensitive
matching (aramada "donusum" bulur "dönüşüm"); facet logic AND across facet types, OR within;
analytics event on every query incl. zero-result flag.
GATE 6: 30-query test set → zero-result rate <5%, p95 latency <300 ms (measured, logged).

═══════════════ PHASE 7 — PERFORMANCE, A11Y, FLOATING-WIDGET GOVERNANCE ═══════════════
7.1 Budgets: LCP ≤2.5 s · INP ≤200 ms · CLS ≤0.1 (mobile, throttled); hub JS ≤150 KB gz;
menu assets must not block LCP.
7.2 WCAG 2.2 AA: axe-core 0 critical/serious; contrast ≥4.5:1 audited against the dark+gold
theme; prefers-reduced-motion honored; skip-link present.
7.3 Floating elements: max 2 persistent (chat bubble; merged a11y+language control).
Toasts replaced by one dismissible "Yeni" badge on the Perspektifler nav item;
"Welcome Back" banner only for returning visitors, auto-dismiss 8 s, never overlapping
the chat bubble. Fix BUG-07 overlapping headline while in the CSS layer.
GATE 7: Lighthouse JSON (hub + 1 article, mobile) ≥90 perf / ≥95 a11y; axe report attached;
viewport screenshot shows ≤2 floats.

═══════════════ PHASE 8 — SEO & i18n ═══════════════
hreflang tr↔en pairs via pair_id; canonical: category pages indexable; tag pages
noindex,follow (thin-content guard per faceted-nav guidance); sort/page params canonicalized
to base; sitemap split (hub/categories/articles); 301 map from Phase 1 deployed; never emit
links to zero-result facet URLs.
GATE 8: crawl (Screaming Frog or sitebulb/CLI crawler) → 0 broken internal links, 0 redirect
chains >1 hop, hreflang validated.

═══════════════ PHASE 9 — CONTENT OPS AT 1,000 SCALE ═══════════════
Editorial workflow doc: featured slots (max 4) editable in CMS without deploy; evergreen vs
news flag; quarterly decay review (update or archive stale pieces; merge under-used tags);
publishing checklist enforcing schema fields (excerpt length, tag count, internal links ≥3).
Series/collections entity ready for flagship multi-part work.
GATE 9: a non-developer can change featured items + publish a compliant article end-to-end;
record the walkthrough.

═══════════════ §10 ACCEPTANCE CRITERIA (the measurable replacement for "flawless") ═══════
AC-01 Menu closed by default on all routes; closes on ESC/outside/route/scroll (Playwright).
AC-02 Nav artifacts (BUG-02) gone; pixel-diff vs spec approved.
AC-03 Mega-menu ≤30 links, insights-scoped only.
AC-04 20 random article slugs each reachable in ≤3 clicks from hub (scripted).
AC-05 Tag vocabulary ≤60; normalization script reports 0 duplicate slugs; 100% of old tag
URLs 301-mapped.
AC-06 Hub + article: Lighthouse mobile perf ≥90; LCP/INP/CLS within budget (JSON attached).
AC-07 axe-core: 0 critical/serious on hub, category, article, open-menu states.
AC-08 Search zero-result <5% on the 30-query set; p95 <300 ms.
AC-09 URL-state round-trip reproduces any filtered view.
AC-10 ≤2 persistent floating elements per viewport.
AC-11 hreflang + schema validated; crawl shows 0 broken links.
AC-12 Analytics events live: search_query, zero_result, load_more, category_click,
newsletter_submit (verified in debug view) with pre-launch baseline recorded.

DELIVERABLES

1. Phase-0 audit pack (bug table + benchmark matrix + content CSV)
2. taxonomy.json (categories + vocabulary + merge/301 map)
3. Implemented section (menu, hub, category, article, search) behind a preview URL
4. Verification pack: Playwright results, Lighthouse JSONs, axe reports, crawl report,
   screenshots per gate
5. CHANGELOG + content-ops runbook
   Work phase-by-phase; do not start Phase N+1 before Gate N evidence exists. If any premise
   here contradicts what you verify on the live site, the live verification wins — flag the
   delta, then proceed.
