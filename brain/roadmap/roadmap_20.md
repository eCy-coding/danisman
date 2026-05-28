# Roadmap 20 — PHASE 32: Keyword Strategy + Content Optimization

**Tier:** 1 (KRİTİK) · **Skor:** 9.0 · **Süre:** 1-2 hafta · **Todo:** T11-T20

**Stratejik Hedef:** 10 ana anahtar kelime için Google top-50 sıralama, 5 long-tail için top-20. Her landing page'in bir target keyword'ü olmalı.

**İstek3.txt Eşleşmesi:** "Ana sloganların yanına 'stratejik danışmanlık', 'operasyonel verimlilik' gibi trafik potansiyeli olan anahtar kelimeleri meta tag'lere dahil etmek" + "blog içerikleri üretmek hedeflediğin keywordler doğrultusunda google'da sıralanmana katkı sağlar".

---

## ✅ P32-T01 (T11): Anahtar Kelime Araştırma Matrisi (10 Ana + 10 Long-tail)

- **NEDEN:** İstek3'te keyword örnekleri verildi ama stratejik araştırma yok. Site keyword stratejisi olmadan içerik yazmak karanlıkta ok atmak. Her içerik kararının temel altyapısı.
- **ÖNEM:** P0 — Tüm content + meta tag + H1 stratejisi keyword listesinden türer. Phase 32'nin 9 diğer todo'sunun girdisi.
- **YÖNTEM:** **Ücretsiz kaynaklar** (sıralı): (1) Google Keyword Planner — AdWords hesabı gerektirir ama ücretsiz, volume range verir. (2) Ahrefs Free Trial 7-gün (en zengin data). (3) SEMrush Free 10 sorgu/gün (alternatif). (4) AnswerThePublic (question-based keyword). (5) Google Trends (trend doğrulama). Kriter: TR volume ≥100/ay, EN volume ≥500/ay, KD ≤40 (mid-tier domain için).
- **TEST:** `brain/seo/keywords-2026-05.md` — 20 satır × 6 sütun tablo: `keyword | volume | KD | intent (info/nav/trans) | target_page | priority`. Her satır doldurulmuş.

## ✅ P32-T02 (T12): Meta Title/Description Keyword Optimize (Her Sayfa)

- **NEDEN:** Şu an meta tags genel ("EcyPro Premium Consulting"). Title tag Google'ın #1 on-page SEO faktörü. Her sayfa hem target keyword hem brand içermeli. Description SERP'deki CTR belirleyicisi.
- **ÖNEM:** P0 — Tek başına impression +20% + CTR +15% potansiyeli. En düşük çaba / en yüksek etki oranı.
- **YÖNTEM:** Format: `{Primary Keyword} | EcyPro Premium Consulting`. Title 50-60 karakter (mobil SERP limit). Description 150-160 karakter, CTA + keyword + value prop (`{Keyword}: {Benefit}. {CTA Fiil}.`). `src/pages/*Page.tsx` → `<Helmet>` title/meta bloklarını T01 matrisine göre güncelle. Örn: `"Stratejik Danışmanlık Hizmetleri | EcyPro"` + `"C-suite için stratejik danışmanlık: operasyonel verimlilik, dijital dönüşüm. 30 dk ücretsiz görüşme. →"`.
- **TEST:** `npm run build && grep -rP 'name="(title\|description)"' dist/**/*.html | wc -l` → 41 × 2 = 82 satır. Her title ≤60, description ≤160 char. Lighthouse SEO 100 koru.

## ✅ P32-T03 (T13): H1 Keyword Optimization (Her Landing Page)

- **NEDEN:** Title tag ve H1 alignment Google için "page is about X" en güçlü sinyal. Şu an birçok H1 brand-centric ("Welcome to EcyPro"). Her sayfada target keyword H1'de görünmeli.
- **ÖNEM:** P0 — On-page SEO temel taşı, title tag ile birlikte #1-2 ranking faktörü.
- **YÖNTEM:** Her sayfa 1 tane H1 içermeli (a11y + SEO). H1 target primary keyword + value prop format: `{Keyword}: {Value}`. Örn: `Stratejik Danışmanlık ile %40 Verimlilik` yerine generic `Our Services`. `src/pages/` ve `src/components/sections/` audit → T01 matrisi ile eşleştir → düzenle.
- **TEST:** `scripts/audit-h1-keywords.ts` — `dist/` HTML parse → her sayfa H1 sayısı + içeriği + T01 matrisinden target keyword yardımıyla `✅/❌` raporu. 41/41 sayfa 1 H1 + target keyword.

## ✅ P32-T04 (T14): Internal Linking Strategy (Topic Silos)

- **NEDEN:** Internal links Google'a sayfa hiyerarşisini gösterir + PageRank dağıtır. Şu an organik internal linking az → "orphan page" riski (hiçbir yerden link almayan sayfa = düşük otorite).
- **ÖNEM:** P1 — Page authority dağıtımı + crawl efficiency. Crawl budget optimizasyonu.
- **YÖNTEM:** Silo yapısı: `/services` (pillar) → `/services/{slug}` (cluster) → `/case-studies?service={slug}` + `/blog?category={service}`. Her hizmet sayfasında "İlgili Vaka Çalışmaları" (3) + "İlgili Blog" (3) component'leri (var, ama URL parameter integration eksik). Navbar'da breadcrumb aktif.
- **TEST:** `scripts/audit-internal-links.ts` — her sayfa min 3 internal link + sayfa başına backlink sayısı raporu. Screaming Frog Free (500 URL limit) ile crawl → "Orphan Pages" 0.

## ⬜ P32-T05 (T15): Long-Tail Keyword Blog İçerikleri (5 Yeni Post)

- **NEDEN:** Long-tail (4+ kelime) keyword'ler düşük rekabet + yüksek intent. İstek3'te "organik trafik için dijital dönüşüm", "operasyonel verimlilik nasıl artırılır" örneklendi. Bunlar long-tail örnekleri.
- **ÖNEM:** P1 — Hızlı sıralama kazancı (30-60 gün). Yeni domain için en gerçekçi trafik kaynağı.
- **YÖNTEM:** AnswerThePublic + `People Also Ask` ile 5 soru-bazlı topic seç: örn: (1) "operasyonel verimlilik nasıl artırılır", (2) "dijital dönüşüm KPI örnekleri", (3) "AI yatırım ROI nasıl hesaplanır", (4) "değişim yönetimi aşamaları", (5) "danışmanlık ücretleri nasıl belirlenir". Her biri 1500-2500 kelime MDX → `src/content/blog/`. Her post: H2 sub-headings (keyword varyasyonları), FAQ section, 3+ internal link, 1 infographic veya tablo.
- **TEST:** `npm run gen:blog && npm run build` sonrası sitemap'te 5 yeni URL + RSS'te 5 yeni item. GSC URL Inspection → "Page indexed" 14 gün içinde.

## ✅ P32-T06 (T16): TR/EN Keyword Mapping Tablosu

- **NEDEN:** Direct translation keyword stratejisi yanlış — search intent dillere göre farklı olabilir. TR "danışmanlık hizmetleri" volume 2400/ay ≠ EN "consulting services" volume 40500/ay. Aynı anahtar kelimeyi iki dile kopyalamak yanlış prioritization'a yol açar.
- **ÖNEM:** P1 — Bilingual SEO başarısının önkoşulu. Her dilin kendi rekabet dinamikleri var.
- **YÖNTEM:** Her TR keyword için EN equivalent (literal çeviri değil, **search intent eşleşmesi**). Örn: TR "stratejik danışmanlık" → EN "management consulting" (literal "strategic consulting" daha dar). Tablo: `brain/seo/keyword-tr-en-map.md` — her satır: TR keyword, TR volume, EN equivalent, EN volume, target page (TR), target page (EN), notes.
- **TEST:** Her bilingual sayfada TR ve EN versiyonu farklı (ama eşit kalitede) keyword optimize. GSC Performance → country filter TR vs EN → her iki dilde impression artışı.

## ✅ P32-T07 (T17): FAQ Section Keyword-Rich (Her Hizmet Sayfası)

- **NEDEN:** Google "People Also Ask" featured snippet için FAQ schema kritik. Mevcut FAQPage schema var (PricingPage) ama içerik az + diğer sayfalarda yok. FAQ position 0 (featured snippet) fırsatı.
- **ÖNEM:** P1 — Featured snippet = SERP #1'in üstü = +10× CTR. Voice search optimizasyonu.
- **YÖNTEM:** Her hizmet sayfasına 5-7 question FAQ section (accordion) + FAQPage JSON-LD. Sorular: (a) AnswerThePublic question export, (b) GSC "Top queries" report (gerçek kullanıcı soruları), (c) Reddit/Quora sektörel aramalar. Cevaplar 40-300 kelime (featured snippet ideal).
- **TEST:** `https://search.google.com/test/rich-results` her hizmet sayfası FAQPage valid. GSC → Enhancements → FAQ → "Valid: ≥5 pages". `src/components/ui/Accordion.tsx` kullan (a11y-compliant).

## ✅ P32-T08 (T18): Image Alt Text Keyword Optimize

- **NEDEN:** Image alt text Google Image Search + a11y için. Şu an alt text generic veya eksik. Decorative images `alt=""` olmalı (a11y + SEO).
- **ÖNEM:** P2 — Image SEO niche ama birikimli trafik kaynağı. A11y Lighthouse koruma (zaten 100).
- **YÖNTEM:** Tüm `<img>` + Hero + Services + Case Studies + Blog images alt prop audit. Formül: `{description} — {keyword if relevant}`. Max 125 char. Decorative/background images `alt=""` + `aria-hidden="true"`. `scripts/audit-img-alt.ts` — `dist/` HTML parse, img alt eksik olanları listele.
- **TEST:** `npx tsx scripts/audit-img-alt.ts` → 0 missing alt + 0 over-125-char. Lighthouse Image SEO + A11y 100 koru.

## ✅ P32-T09 (T19): URL Structure SEO-Friendly Audit

- **NEDEN:** URL yapısı keyword içermeli (`/services/strategic-consulting` ✅ vs `/p/123` ❌). Trailing slash konsistans (Google `/services` ve `/services/`'i farklı sayfalar sayar → duplicate content).
- **ÖNEM:** P2 — URL keyword minor ranking signal ama konsistans duplicate content önler.
- **YÖNTEM:** `src/App.tsx` route audit: tüm route'lar slug-based olmalı (zaten öyle). `vercel.json` veya `netlify.toml` redirect: tüm trailing-slash URL'leri non-slash'e 301 redirect (Google best practice: ikisinden birini seç + tutarlı ol). Canonical URL her sayfada zorunlu (P31-T04 ile sync).
- **TEST:** `curl -I https://ecypro.com/services/` → `HTTP/1.1 301` → `Location: /services`. 41 URL audit script: `scripts/audit-url-canonicalization.ts`.

## ⬜ P32-T10 (T20): Topic Clusters / Pillar Content Yapısı

- **NEDEN:** HubSpot pillar-cluster modeli: 1 pillar page (genel konu, 3000+ kelime) + N cluster posts (alt konular, 1000-2000 kelime) + reciprocal linking. Authority concentration + topical relevance score.
- **ÖNEM:** P2 — Uzun vadeli SEO authority strategy. 3-6 ay sonra meyvelerini verir.
- **YÖNTEM:** 3 pillar belirle (T01 matrisinden en yüksek volume 3): (1) Stratejik Danışmanlık, (2) Operasyonel Verimlilik, (3) Dijital Dönüşüm. Her pillar için 5 cluster blog post plan → toplam 15 post (T15'te 5 zaten başlandı, 10 daha). Pillar sayfalar: `/pillar/stratejik-danismanlik` gibi yeni route + `src/content/pillar/*.mdx`. Her cluster → pillar link + pillar her cluster'a link.
- **TEST:** Topic graph: 3 pillar × 5 cluster = 15 post. Her cluster pillar'a 1+ link, pillar her cluster'a 1+ link (bidirectional). Ahrefs Site Explorer "internal pages" topic relevance score başlangıç ölçüm + 3 ay sonra delta.

---

## Phase 32 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] `brain/seo/keywords-2026-05.md` 20 satır keyword matrisi
- [ ] Her sayfa meta title/description keyword-optimize
- [ ] Her landing page 1 H1 + target keyword
- [ ] 5 yeni long-tail blog post yayında
- [ ] TR/EN keyword mapping tablosu
- [ ] Her hizmet sayfasında FAQ section + FAQPage schema
- [ ] Tüm img alt text audit geçti
- [ ] URL trailing slash konsistans + 301 redirect
- [ ] 3 pillar + ≥15 cluster post yapısı (en az iskeleti)
- [ ] Tag: `git tag phase-32-closed`

**Bir Sonraki:** `roadmap_30.md` — Phase 33 LCP + Performance ≥90.
