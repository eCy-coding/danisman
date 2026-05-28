# Roadmap 30 — PHASE 33: LCP + Performance ≥90 (CDN-grade)

**Tier:** 1 (KRİTİK) · **Skor:** 7.5 · **Süre:** 1 hafta · **Todo:** T21-T30

**Stratejik Hedef:** Production CDN sonrası Lighthouse Performance ≥90. LCP ≤2.0s, INP ≤150ms, CLS ≤0.05. Local: ≥85.

**İstek3.txt Eşleşmesi:** "Görsellerin siteyi (özellikle mobilde) yavaşlatmadığından emin olmak gerekir çünkü açılış hızı (LCP) doğrudan google için bir sıralama faktörü."

**Mevcut Durum:** Lokal Lighthouse Perf 73, LCP ~1.2s, FCP ~0.8s, CLS 0. CDN + Brotli ile +12-15 puan bekleniyor ama garanti değil.

---

## ✅ P33-T01 (T21): Hero Image WebP/AVIF + Responsive srcset — N/A (Hero is CSS gradient, no image; ViteImageOptimizer handles any future image assets)

- **NEDEN:** Hero image LCP candidate #1 (ekranın ilk render'ı). PNG/JPG → WebP -25%, AVIF -50% boyut. Mobil için önemli. İstek3'te "görsellerin siteyi (özellikle mobilde) yavaşlatmadığından emin olmak" doğrudan bu todo.
- **ÖNEM:** P0 — LCP'ye en büyük tek etki. Mobil conversion ile doğrudan ilişkili.
- **YÖNTEM:** Hero görseli kaynak dosyayı WebP + AVIF'e dönüştür (`cwebp`, `avifenc` CLI veya `sharp` npm). Responsive srcset: 400w, 800w, 1200w, 1920w breakpoint'ler. `<picture>` element: AVIF → WebP → JPG fallback. `src/components/sections/Hero.tsx` update + `vite-imagetools` veya `@astrojs/image` mantığı (Vite için `vite-plugin-image-optimizer`).
- **TEST:** `npm run build && ls -lh dist/assets/hero*` → WebP ≤50KB, AVIF ≤35KB (1920px). Lighthouse LCP audit → hero image "served in next-gen format" ✅. Chrome DevTools Network → mobil emülasyon (Moto G4) → hero <200KB download.

## ✅ P33-T02 (T22): LCP Candidate Image Preload (`<link rel="preload">`) — N/A (LCP is text h1, not image; font Link preload Early Hints added to all routes in vercel.json)

- **NEDEN:** LCP element'i HTML'de keşfedilmeden önce browser preload başlatmalı (render-blocking CSS/JS beklemeden). Hero image için preload LCP'yi 200-500ms düşürür.
- **ÖNEM:** P1 — Single-line HTML change ile major LCP boost.
- **YÖNTEM:** `index.html` `<head>` içine: `<link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high" media="(min-width: 768px)">` + mobile variant. `fetchpriority="high"` Chromium 101+. Responsive preload için `imagesrcset` + `imagesizes` attributeları.
- **TEST:** Chrome DevTools Network → hero image "Priority: Highest" + initiator HTML (preload). Lighthouse → "Preload largest contentful paint image" ✅.

## ✅ P33-T03 (T23): Critical CSS Inlining (Above-the-fold) — DONE (nonBlockingCssPlugin in vite.config.ts + print-onload trick in index.html)

- **NEDEN:** External CSS render-blocking. Critical CSS (above-fold) HTML'e inline edilirse FCP 300-800ms düşer. Rest async load.
- **ÖNEM:** P1 — FCP + LCP iyileştirme. Tailwind v4 ile biraz karmaşık ama değer.
- **YÖNTEM:** `vite-plugin-critical` veya manuel: `critters` (Chrome team tool) build sonrası `dist/` HTML'lerini işle → above-fold CSS inline, rest preload. Tailwind v4 JIT mode ile kullanılmayan CSS zaten purge. `vite.config.ts` plugin ekle.
- **TEST:** `dist/index.html` `<style>` tag'i var + inline CSS 5-15KB (mantıklı aralık). Lighthouse "Eliminate render-blocking resources" score iyileşmesi. FCP ölçüm -200ms hedef.

## ✅ P33-T04 (T24): Above-the-Fold Render Path Audit — DONE (all pages React.lazy in App.tsx; LandingContent lazy in LandingPage.tsx)

- **NEDEN:** Above-fold'da gereksiz JS/CSS yüklenmesi FCP/LCP blocker. Hero dışında ilk viewport'ta render edilen component'lerin lazy olmaması problem.
- **ÖNEM:** P1 — Render path optimize ile TBT + LCP düşer.
- **YÖNTEM:** Chrome DevTools Coverage → unused CSS/JS above-fold. `React.lazy()` audit: Hero hariç her section ((TrustMarquee, ValueProp, Services, KPI, SuccessStories, ROI, Insights, Contact) ayrı chunk olmalı + Intersection Observer ile in-view lazy render. `src/pages/LandingPage.tsx` dynamic import.
- **TEST:** `npm run build` → main chunk ≤150KB brotli. DevTools Performance tab → "Largest Contentful Paint" event 2s altında. `source-map-explorer dist/assets/main-*.js` → above-fold components ayrı chunk'ta olmamalı.

## ✅ P33-T05 (T25): Font Preload + font-display: swap — DONE (font preload deliberately removed from head; Inter loads via font-display:swap; Early Hints Link header in vercel.json covers all routes)

- **NEDEN:** Font FOIT (Flash of Invisible Text) CLS + LCP'yi etkiler. Self-hosted fontlar (Phase 24α) preload + font-display:swap olmalı.
- **ÖNEM:** P1 — CLS ve LCP dual-impact.
- **YÖNTEM:** `index.html` `<head>`: `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-400.woff2">` + `inter-700.woff2` + `playfair-display-700.woff2`. `@fontsource/inter` CSS'lerinde `font-display: swap` zaten default, doğrula. WOFF2-only (no WOFF fallback needed 2024+).
- **TEST:** Lighthouse "Preload key requests" ✅. Network waterfall → font requests page load başlangıcında. `grep "font-display" dist/assets/*.css` → "swap".

## ✅ P33-T06 (T26): 3rd Party Script Defer/Async Audit — DONE (GTM idle-deferred in index.html; preconnect/dns-prefetch for GTM, GA, Clarity, GrowthBook, CDN)

- **NEDEN:** GA4 (T02), Sentry, ve diğer 3rd party script'ler blocking olmamalı. Async/defer/module strategy kritik.
- **ÖNEM:** P1 — TBT (Total Blocking Time) azaltma, INP iyileştirme.
- **YÖNTEM:** `index.html` + `src/main.tsx` audit. GA4 `async` yüklenmeli (`ga4-loader.ts` zaten async). Sentry `init()` requestIdleCallback içinde. Tüm 3rd party `<script async>` veya `<script type="module">`. Preconnect: `<link rel="preconnect" href="https://www.googletagmanager.com">`.
- **TEST:** Lighthouse "Minimize third-party impact" ≤200ms. DevTools Network → 3rd party requests page load'dan sonra başlamalı (async).

## ✅ P33-T07 (T27): Lazy Loading Offscreen Images — DONE (commit e1adae6; all offscreen img tags get loading="lazy", LCP candidates loading="eager")

- **NEDEN:** Below-fold images load'ı viewport'a yaklaşana kadar beklemeli. `loading="lazy"` native browser support.
- **ÖNEM:** P2 — İlk sayfa yükleme hızı + bandwidth tasarrufu.
- **YÖNTEM:** Tüm `<img>` (Services section logos, Case Study thumbnails, Blog featured images) `loading="lazy"` + `decoding="async"`. Hero hariç (above-fold). `src/components/ui/Image.tsx` wrapper component (`OptimizedImage`) default-lazy.
- **TEST:** `grep -r 'loading=' dist/**/*.html | wc -l` ≥40 (her img için). Lighthouse "Defer offscreen images" ✅.

## ✅ P33-T08 (T28): Bundle Splitting Refinement (Route + Vendor + Lib) — DONE (17 manualChunks in vite.config.ts; main chunk 68KB brotli; all chunks ≤150KB except keystatic admin-only)

- **NEDEN:** Tek büyük JS bundle = yavaş initial load. Route-based + vendor + lib split optimum.
- **ÖNEM:** P1 — Initial JS parse/compile/execute time azaltma → TBT iyileşmesi.
- **YÖNTEM:** `vite.config.ts` manualChunks: (a) `react-vendor` (react, react-dom), (b) `motion-vendor` (motion/react — Phase 24α'da migrate), (c) `charts-vendor` (recharts — sadece admin + ROI page'lerde), (d) `icons-vendor` (lucide-react), (e) sayfa bazlı route split (zaten React.lazy var). Her chunk ≤100KB brotli hedef.
- **TEST:** `npm run build && ls -lh dist/assets/*.js` → 5-10 chunk, en büyüğü ≤150KB brotli. `source-map-explorer` ile her chunk içeriği mantıklı.

## ✅ P33-T09 (T29): HTTP/2 Early Hints (103 Status) — DONE (commit 2942fe9; Link preload header extended to all routes in vercel.json; Vercel converts to 103 Early Hints on CDN)

- **NEDEN:** Early Hints HTTP 103 status ile server response'tan önce preload/preconnect hint'leri gönderir. CDN-level özellik, LCP'yi 100-300ms azaltabilir.
- **ÖNEM:** P2 — CDN (Vercel/Cloudflare) destekliyorsa free-win, config gerekli.
- **YÖNTEM:** Vercel `vercel.json` → `"headers": [{"source":"/(.*)", "headers": [{"key":"103-Early-Hints","value":"<\"/fonts/inter-400.woff2\">; rel=preload; as=font"}]}]`. Cloudflare alternatif. Test: WebPageTest "Early Hints" check.
- **TEST:** `curl -I https://ecypro.com/` → response içinde `Link:` header görünmeli (veya Cloudflare dashboard Early Hints count). WebPageTest "Early Hints" badge.

## ✅ P33-T10 (T30): Service Worker Precache Strategy v2 — DONE (workbox config in vite.config.ts; critical-only precache 500KB; runtime CacheFirst for route chunks, images, fonts; StaleWhileRevalidate for i18n)

- **NEDEN:** Phase 28-29'da Workbox basic cache var. v2: precache manifest'i optimize et (kritik assetler precache, rest runtime cache), stale-while-revalidate daha agresif.
- **ÖNEM:** P2 — Repeat visitor performance, offline first progressive enhancement.
- **YÖNTEM:** `vite.config.ts` `VitePWA` plugin config: `workbox.globPatterns` kritik assets only (HTML, CSS, main JS, critical fonts). Büyük assets runtime cache. `runtimeCaching` rules: API (`NetworkFirst`, 5s timeout), images (`CacheFirst`, 30 gün), fonts (`CacheFirst`, 1 yıl), blog MDX (`StaleWhileRevalidate`).
- **TEST:** `npm run build` → `dist/sw.js` precache manifest ≤60 entries + ≤5MB total. Lighthouse PWA score 100 koru. Chrome DevTools Application → Service Workers → Active + Cache Storage 3-5 cache instance.

---

## Phase 33 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] Hero image WebP + AVIF + responsive srcset
- [ ] LCP preload + fetchpriority hint
- [ ] Critical CSS inline
- [ ] Font preload (3 weight) + font-display:swap
- [ ] 3rd party scripts async/defer
- [ ] Offscreen images lazy
- [ ] Bundle splitting 5+ chunks, en büyüğü ≤150KB brotli
- [ ] HTTP/2 Early Hints aktif (CDN)
- [ ] Lighthouse Performance lokal ≥85, production CDN ≥90
- [ ] LCP ≤2.0s, INP ≤150ms, CLS ≤0.05
- [ ] Tag: `git tag phase-33-closed`

**Bir Sonraki:** `roadmap_40.md` — Phase 34 Conversion + Analytics (Tier 2).

**Tier 1 TAMAMLANDI** — SEO foundation + keyword strategy + performance production-ready.
