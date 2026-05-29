# Roadmap 10 — PHASE 31: SEO + GSC/GA4 + Indexing Foundation

**Tier:** 1 (KRİTİK) · **Skor:** 12.0 · **Süre:** 1 hafta · **Todo:** T01-T10

**Stratejik Hedef:** 7 gün içinde Google'da `site:ecypro.com` ile ≥1 sonuç. 30 gün içinde 41 sitemap URL'in tamamı indexed.

**İstek3.txt Eşleşmesi:** Arkadaşın #1 önceliği — "GSC ve GA4 kurulumlarını yapıp sitenin google tarafından taranmasını sağlamak lazım". Bu dosya tavsiyenin operasyonel çevirisidir.

---

## ⬜ P31-T01: Google Search Console (GSC) Property Doğrulama

- **NEDEN:** İstek3.txt arkadaş analizinin #1 öncelikli kalemi. GSC olmadan Google'ın site'ı görüp görmediğini öğrenmek imkânsız. Tüm SEO döngüsünün giriş noktası; diğer 99 todo'nun ölçüm altyapısı bu adıma bağlı.
- **ÖNEM:** P0 — Trafik üretiminin önkoşulu. Bu olmadan SEO ROI ölçülemez, crawl hataları görünmez, indexing durumu kör.
- **YÖNTEM:** GSC → "Add Property" → **Domain property** (DNS TXT) tercih et (`ecypro.com` tüm subdomain'leri kapsar, URL prefix'ten üstün). Cloudflare/Hostinger DNS panelinden TXT record ekle (5 dk yayılım). Fallback: HTML file upload (`public/google{hash}.html`).
- **TEST:** GSC dashboard → Property → "Ownership verified" yeşil tik. Sonra: Settings → Ownership verification → "Passed".

## ⬜ P31-T02: GA4 Property + Measurement ID + .env Wire-up

- **NEDEN:** GA4 olmadan kullanıcı davranışı ölçülemez. ROI Calculator'ın kaç kez kullanıldığı, hangi sayfada bounce yüksek, hangi CTA çalışıyor bilinemez. İstek3'te "ROI aracı GA4 ile izlemek büyük avantaj" özellikle vurgulandı.
- **ÖNEM:** P0 — Veri olmadan optimizasyon kör atış. Phase 34 conversion optimization'ın önkoşulu.
- **YÖNTEM:** `analytics.google.com` → "Create Property" → Web stream → Measurement ID (`G-XXXXXXXXXX`) kopyala → `.env` + Vercel production env'e `VITE_GA_TRACKING_ID` ekle. `src/components/providers/AnalyticsProvider.tsx` + `src/lib/ga4-loader.ts` zaten hazır (Phase 20.5'te yapıldı) — sadece ID değerini bekliyor.
- **TEST:** `npm run preview` → Network tab → `gtag/js?id=G-...` 200 OK. GA4 Realtime dashboard → 1 aktif kullanıcı görünmeli (kendi tarayıcın). `src/lib/ga4-loader.ts` unit test (6/6) zaten geçiyor.

## ⬜ P31-T03: GSC Sitemap Submit + İlk URL Indexing Request

- **NEDEN:** GSC sitemap submit etmeden Google crawler 41 URL'i bulmayabilir (özellikle yeni domain için). Sitemap = Google'a "şu URL'lerim var" haritası. `robots.txt`'deki `Sitemap:` satırı yeterli değil yeni site'lar için.
- **ÖNEM:** P0 — Sitemap olmadan deep page indexing 30+ gün gecikir. 5 ana URL için "Request Indexing" ile 24-72 saatte indexlenme hızlanır.
- **YÖNTEM:** GSC → Sitemaps → `https://ecypro.com/sitemap.xml` submit → Success bekle → "URL Inspection" tool ile en önemli 5 URL için manuel "Request Indexing": `/`, `/services`, `/case-studies`, `/about`, `/contact`. GSC günlük 10 URL kotası var, stratejik seç.
- **TEST:** GSC → Sitemaps → "Success" status + "Discovered URLs: 41". 7 gün sonra GSC Coverage → "Indexed: ≥10". 30 gün sonra → 41/41.

## ✅ P31-T04: robots.txt + Canonical URL Production Audit

- **NEDEN:** robots.txt'deki tek yanlış satır (`Disallow: /`) Google'ın site'ı taramasını tamamen engelleyebilir. Canonical URL eksikse duplicate content cezası (TR/EN veya trailing slash varyantları). Phase 20.5 H2/H3'te eklendi ama production doğrulaması yapılmadı.
- **ÖNEM:** P0 — Tek bir hata SEO'yu sıfırlar. En düşük çaba / en yüksek koruma oranı.
- **YÖNTEM:** `public/robots.txt` review → `Allow: /` + `Sitemap: https://ecypro.com/sitemap.xml` satırları doğrula. Production deploy sonrası `curl https://ecypro.com/robots.txt`. Her sayfa `<link rel="canonical" href="https://ecypro.com/...">` içermeli — `scripts/audit-canonical.ts` yaz: `dist/` içindeki her HTML'i parse et, canonical tag eksik olanları listele.
- **TEST:** `curl -s https://ecypro.com/robots.txt | grep -E "^Allow|^Sitemap"` → 2 satır döner. `npm run build && npx tsx scripts/audit-canonical.ts` → "All 41 pages have canonical: ✅".

## ✅ P31-T05: GA4 Custom Event Tracking (CTA, Form, Scroll, ROI Tool)

- **NEDEN:** Default page_view yetersiz. Hangi CTA tıklandığı, ROI Calculator'da hangi alan dolduruldu, contact form abandon oranı bilinmeden conversion optimization yapılamaz. İstek3'te "ROI aracı GA4 ile izlemek organik ziyaretçinin davranışını anlamak için" özellikle vurgulandı.
- **ÖNEM:** P1 — Conversion funnel measurement temel taşı. Phase 34 A/B testing'in önkoşulu.
- **YÖNTEM:** `src/lib/analytics.ts`'ye helper fonksiyonlar ekle: `trackCTA(label, location)`, `trackFormSubmit(formId, success)`, `trackScrollDepth(percentage)`, `trackROICalc(values)`. Tetikleme noktaları: `Hero.tsx` CTA click, `ContactForm.tsx` onSubmit, `ROICalculator.tsx` onChange (debounced 500ms), `useScrollDepth` hook (25/50/75/100%).
- **TEST:** GA4 DebugView (real-time event inspector) → 5 dakika manuel browse → 10+ event görünmeli: `cta_click` (hero-primary), `scroll_depth_75`, `roi_calc_interaction`, `form_submit` (newsletter).

## ⬜ P31-T06: GSC Search Performance Baseline + Hafta-1 Raporu

- **NEDEN:** Baseline ölçüm olmadan iyileşme/gerileme tespit edilemez. Yeni site için başlangıç değerleri genellikle 0'a yakın — ama trend izlemek için bile snapshot şart. 1 hafta sonra karşılaştırma noktası olacak.
- **ÖNEM:** P1 — Karar destek için veri matrisi. Hangi keyword'lerin impression almaya başladığını göster.
- **YÖNTEM:** GSC → Performance → 7 gün filter → "Export" → CSV indir → `brain/seo/baseline_2026-05-05.csv` olarak kaydet. Metrikler: Total clicks, impressions, CTR, average position, top queries (1-10), top pages (1-10), top countries. Haftalık delta için script: `scripts/seo-weekly-diff.ts`.
- **TEST:** `brain/seo/baseline_2026-05-05.csv` mevcut + 6 sütun × ≥5 satır (yeni site için sıfıra yakın olsa bile satır yapısı doğru olmalı). `npx tsx scripts/seo-weekly-diff.ts` → "Compared to last week: +X% impressions".

## ✅ P31-T07: Google Indexing API Entegrasyonu (Dynamic Page Push)

- **NEDEN:** Manuel "Request Indexing" günlük 10 URL kotalı. Indexing API (resmi JobPosting/BroadcastEvent için ama diğer URL'ler için de çalışıyor) bulk push imkânı verir. Yeni blog post/case study eklendiğinde otomatik Google bildirimi.
- **ÖNEM:** P1 — İndekslenme hızını 3-5× artırır. CI/CD pipeline'a entegre edilince sıfır manuel adım.
- **YÖNTEM:** Google Cloud Console → yeni project → "Indexing API" enable → Service Account oluştur → JSON key indir → `.env` `GOOGLE_INDEXING_KEY_PATH=./secrets/indexing-key.json` (gitignore). `scripts/indexing-api-push.ts` yaz: `googleapis` npm package + `indexing.urlNotifications.publish({url, type:'URL_UPDATED'})`. `postbuild` step'e ekle veya ayrı `npm run indexing:push`.
- **TEST:** `npm run build && npm run indexing:push` → console "Pushed 41 URLs, 41 successful, 0 failed". GSC Crawl Stats 24h sonra → "Discovered" pik noktası.

## ⬜ P31-T08: Bing Webmaster + Yandex Webmaster Property

- **NEDEN:** Türkiye trafiğinde Bing %5-8, Yandex %1-2 ama Microsoft Edge default Bing → ChatGPT, Copilot ana arama Bing. AI search engine ekosisteminde Bing kritik. SEO sadece Google değil.
- **ÖNEM:** P2 — Marjinal ama artan payda. Özellikle AI search (GPT, Gemini, Perplexity) içerik kaynağı olarak Bing'i kullanıyor.
- **YÖNTEM:** `bing.com/webmasters` → "Add Site" → GSC'den import seçeneği (auto-verify). `webmaster.yandex.com` → property add → DNS TXT (aynı domain TXT'i reuse). Her iki dashboard'da sitemap submit.
- **TEST:** Bing Webmaster → Configure → "Verified ✓" + sitemap "Success (41)". Yandex aynı.

## ✅ P31-T09: IndexNow Protokolü (Bing/Yandex Bulk Push)

- **NEDEN:** IndexNow = Microsoft + Yandex + Seznam ortak protokolü. Tek API çağrısıyla 3+ arama motoruna URL bildirimi. Kurulumu 5 dakika, kotası yok.
- **ÖNEM:** P2 — Düşük çaba, orta etki. Özellikle blog post otomasyonu için ideal.
- **YÖNTEM:** Random 32-char key üret → `public/{key}.txt` içeriği = key'in kendisi → `scripts/indexnow-push.ts`: POST `https://api.indexnow.org/indexnow` `{host, key, keyLocation, urlList}`. `postbuild` step + `gen:blog` sonrası tetikle.
- **TEST:** `curl -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json' -d '{"host":"ecypro.com","key":"...","urlList":["https://ecypro.com/"]}'` → 200 OK. Bing Webmaster → IndexNow → "Submitted URLs: 41".

## ✅ P31-T10: Schema.org Rich Results Test (Her Önemli Sayfa)

- **NEDEN:** JSON-LD eklenmiş (Phase 20.5+24α, 12 sayfa × çoklu schema) ama Google Rich Results Test'te valid mi doğrulanmadı. Geçersiz schema = rich snippet yok = SERP'de %30 daha az CTR.
- **ÖNEM:** P1 — SERP CTR'a direkt etki (rich snippet ile +30%). Ayrıca GSC Enhancements'ta hata ortaya çıkarabilir.
- **YÖNTEM:** `scripts/audit-jsonld.ts` yaz: production URL listesi → Puppeteer/Playwright headless → `https://search.google.com/test/rich-results?url=...` → screenshot + "Items detected" + "Errors" sayısını topla → `audits/rich-results-2026-05.json`. Manuel alternatif: 12 URL için tek tek test, 5-10 dk.
- **TEST:** 12/12 sayfa "Items detected" + "0 errors". GSC → Enhancements → her schema türü ("Breadcrumb", "Article", "FAQPage", "Service") "Valid" + 0 error.

---

## Phase 31 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] GSC property verified + sitemap submitted + 41 URL discovered
- [ ] GA4 property canlı + realtime events görünüyor
- [ ] Bing + Yandex verified
- [ ] Rich Results test 12/12 valid
- [ ] `brain/seo/baseline_2026-05-05.csv` kaydedildi
- [ ] `brain/memory.md` → Phase 31 closure bloğu
- [ ] Tag: `git tag phase-31-closed`

**Bir Sonraki:** `roadmap_20.md` — Phase 32 Keyword Strategy.
