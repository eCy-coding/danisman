# 🚀 EcyPro Premium Consulting — İstek5.txt Kapsamlı Geliştirme Yol Haritası

> **Tarih:** Mayıs 2026  
> **Referans:** `prompts/istek5.txt` — 15-Pane E2E Build Script  
> **Durum:** 846 E2E test / 85 spec / 7 phase / 15 pane ✅

---

## 📊 Mevcut Durum Özeti

| Metrik          | Değer         | Hedef  |
| --------------- | ------------- | ------ |
| Toplam E2E Test | **846**       | 1000+  |
| Spec Dosyası    | **85**        | 100    |
| 15-Pane Kapsam  | **15/15** ✅  | 15/15  |
| TS Derlemesi    | **0 hata** ✅ | 0 hata |
| LHCI Score      | A11y ≥ 0.98   | 1.00   |

---

## 🏗️ Phase 1 — Çekirdek Altyapı (Critical) ← ŞU AN

### Pane 0 — 🖥️ Frontend-Dev

```bash
npm run dev          # Vite HMR + TypeScript watch
npm run typecheck    # sıfır hata garantisi
```

#### Cerrahi Müdahaleler:

- [x] `vite.config.ts` — chunk stratejisi, rollupOptions optimizasyonu
- [ ] `src/lib/fonts.ts` — Google Fonts self-host (performance)
- [ ] `src/hooks/useIntersection.ts` — lazy section observer güçlendir
- [ ] `index.html` — preconnect, dns-prefetch link hints

#### Test Paketi: `crawl_ux_critical.spec.ts` + `crawl_ux2-4.spec.ts` (36 test)

---

### Pane 1 — 🛠️ Backend-API

```bash
npm run server       # tsx server/index.ts
npm run start:dev    # NestJS/Express dev mode
```

#### Cerrahi Müdahaleler:

- [ ] `server/routes/contact.ts` — rate limiting middleware (express-rate-limit)
- [ ] `server/routes/blog.ts` — pagination + search optimizasyonu
- [ ] `server/middleware/security.ts` — helmet.js + cors sertleştirme
- [ ] `server/mock-server.mjs` — tüm eksik endpoint mock'ları ekle

#### Test Paketi: `api_integration.spec.ts` + `crawl_api_security.spec.ts` (20 test)

---

### Pane 2 — 💾 DB-Postgres

```bash
npm run dev:db       # docker compose postgres + redis + mailpit
npx prisma migrate dev
npx prisma studio    # GUI
```

#### Cerrahi Müdahaleler:

- [ ] `prisma/schema.prisma` — index optimizasyonu (composite indexes)
- [ ] `scripts/seed.ts` — production-like test data (100 blog, 50 contact)
- [ ] Connection pooling: PgBouncer konfigürasyonu
- [ ] Redis cache: session + API response cache layer

#### Test Paketi: `crawl_db_integration.spec.ts` (21 test)

---

## 🎨 Phase 2 — UI/UX & Component Library (High)

### Pane 5 — 🎨 UI-Storybook

```bash
npm run storybook    # port 6006
```

#### Cerrahi Müdahaleler:

- [ ] `.storybook/main.ts` — Vite builder, addon-a11y, addon-interactions ekle
- [ ] `src/stories/Button.stories.tsx` — EcyPro buton varyantları
- [ ] `src/stories/MediaPicture.stories.tsx` — WebP/AVIF bileşen
- [ ] `src/stories/SkeletonLoader.stories.tsx` — loading state varyantları
- [ ] `src/stories/VoicePlayer.stories.tsx` — blog okuma bileşeni
- [ ] `src/stories/StickyTOC.stories.tsx` — içindekiler tablosu
- [ ] `src/stories/DemoRequestModal.stories.tsx` — conversion modal

#### CSS Geliştirme:

```css
/* src/styles/tokens.css */
:root {
  --color-primary: #6366f1;
  --color-surface: #0f172a;
  --radius-lg: 1rem;
  --shadow-glow: 0 0 30px rgba(99, 102, 241, 0.3);
}
```

#### Test Paketi: `crawl_a11y_wcag.spec.ts` + `crawl_ui_components.spec.ts` (35 test)

---

### Pane 12 — 🏗️ UI-Designer

```bash
npx figma-to-react --watch   # Figma token sync
```

#### Cerrahi Müdahaleler:

- [ ] `src/components/ui/MediaPicture.tsx` — `<picture>` WebP/AVIF component
- [ ] `src/components/ui/SkeletonLoader.tsx` — pulse animasyon varyantları
- [ ] `src/components/ui/ScrollProgressBar.tsx` — blog okuma progress
- [ ] `src/components/ui/VoicePlayer.tsx` — TTS audio player
- [ ] `src/components/layout/MobileBottomNav.tsx` — mobile navigation
- [ ] `src/components/ui/PageLoadingBar.tsx` — route transition bar

#### HTML5 Semantik:

```html
<!-- Hero section semantic structure -->
<section aria-labelledby="hero-title">
  <h1 id="hero-title" class="sr-only">Global Strategic Consulting</h1>
  <picture>
    <source srcset="hero.avif" type="image/avif" />
    <source srcset="hero.webp" type="image/webp" />
    <img
      src="hero.jpg"
      alt="EcyPro Premium Consulting"
      fetchpriority="high"
      loading="eager"
      width="1920"
      height="1080"
    />
  </picture>
</section>
```

#### Test Paketi: `crawl_forms_validation.spec.ts` (15 test)

---

## 📦 Phase 3 — Media & Asset Pipeline (Medium)

### Pane 6 — 📦 Media-Watcher

```bash
node scripts/watch-media.js   # WebP/AVIF dönüştürücü
npm run media:watch            # tsx scripts/watch-media.ts
```

#### Cerrahi Müdahaleler:

- [ ] `scripts/watch-media.ts` — sharp ile WebP/AVIF batch conversion
- [ ] `scripts/watch-media.js` — node wrapper (tsx-less)
- [ ] `public/images/` — hero, service, blog görselleri optimize et
- [ ] `vite.config.ts` — `vite-plugin-imagemin` entegrasyonu
- [ ] SVG sprite: `public/sprite.svg` — tüm ikonları birleştir

#### WebP Optimizasyon Hedefleri:

| Görsel Tipi | Max Size | Format      |
| ----------- | -------- | ----------- |
| Hero        | 100KB    | AVIF + WebP |
| Blog kapak  | 50KB     | WebP        |
| Avatar/Icon | 5KB      | WebP/SVG    |
| OG Image    | 120KB    | JPG         |

#### Test Paketi: `crawl_media_optimization.spec.ts` + `crawl_image_lcp.spec.ts` (28 test)

---

## 🔎 Phase 4 — SEO & Geo (High)

### Pane 4 — 🔎 SEO-Geo-Admin

```bash
npm run seo:watch    # tsx scripts/seo-watch.ts
```

#### Cerrahi Müdahaleler:

- [ ] `src/lib/seo.ts` — SSR meta generator (dynamic og:image)
- [ ] `public/robots.txt` — Sitemap referansı, crawl budget
- [ ] `public/sitemap.xml` — tüm URL'ler, hreflang, priority
- [ ] `src/components/seo/JsonLd.tsx` — Organization, Article, FAQ schema
- [ ] `index.html` — hreflang alternate link tags

#### JSON-LD Şema Hedefleri:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "name": "EcyPro Premium Consulting" },
    { "@type": "WebSite", "potentialAction": { "@type": "SearchAction" } },
    { "@type": "FAQPage", "mainEntity": [...] }
  ]
}
```

#### Test Paketi: `crawl_seo_deep.spec.ts` + `crawl_authority_seo.spec.ts` (46 test)

---

### Pane 13 — 🧭 Geo-Manager

```bash
node scripts/geo-manager.js   # IP geolocation watch
npm run geo:watch              # tsx scripts/geo-watch.ts
```

#### Cerrahi Müdahaleler:

- [ ] `server/routes/geo.ts` — IP lookup API (MaxMind GeoLite2)
- [ ] `src/components/GeoBanner.tsx` — currency + language auto-detect
- [ ] `src/hooks/useGeo.ts` — geolocation hook sertleştir
- [ ] Fallback chain: API → localStorage → navigator.language

#### Test Paketi: `crawl_geo_banner.spec.ts` + `crawl_i18n_international.spec.ts` (41 test)

---

## 🧪 Phase 5 — Test & Quality (Critical)

### Pane 3 — 🧪 E2E-Playwright (Cypress → Playwright)

```bash
npm run e2e:watch   # playwright UI mode
npm run test:e2e    # headless CI mode
```

#### Playwright Config Güçlendirmesi:

- [x] `timeout: 90_000` — test başına 90sn
- [x] `globalTimeout: 30 * 60_000` — suite 30dk
- [x] `retries: CI ? 2 : 1` — flaky test retry
- [ ] `globalSetup: './e2e/global-setup.ts'` — sunucu ısınma
- [ ] `snapshotDir: './e2e/snapshots'` — visual regression

#### Test Kapsam Hedefi (Mevcut → Hedef):

```
Phase 1-Core:    57 → 80  test
Phase 2-UI/UX:  111 → 140 test
Phase 3-Media:   28 → 35  test
Phase 4-SEO:    104 → 130 test
Phase 5-Quality:134 → 170 test
Phase 6-Obs:    112 → 140 test
Phase 7-Ops:    103 → 120 test
TOPLAM:         649 → 815 test (net-unique, phase mapped)
```

### Pane 7 — ⚙️ CI-Lighthouse

```bash
npm run lhci:watch        # continuous lighthouse
npx lhci autorun          # tek seferlik
```

#### Hedef Skorlar:

| Metrik         | Şu An   | Hedef   |
| -------------- | ------- | ------- |
| Performance    | ≥ 0.70  | ≥ 0.85  |
| Accessibility  | ≥ 0.98  | 1.00    |
| Best Practices | ≥ 0.95  | 1.00    |
| SEO            | 1.00    | 1.00    |
| LCP            | ≤ 4.0s  | ≤ 2.5s  |
| CLS            | ≤ 0.10  | ≤ 0.05  |
| TBT            | ≤ 600ms | ≤ 200ms |

#### Test Paketi: `crawl_performance_vitals.spec.ts` (24 test)

### Pane 10 — 🔐 Sec-Watch

```bash
npm run sec:watch    # tsx scripts/sec-watch.ts
npm audit --audit-level=high
```

#### Test Paketi: `crawl_security_headers.spec.ts` + `crawl_api_security.spec.ts` (39 test)

---

## 📈 Phase 6 — Observability (Medium)

### Pane 8 — 🗒️ Log-Tail

```bash
npm run logs:tail    # bash scripts/logs-tail.sh
docker logs -f ecypro_app ecypro_db
```

#### Eklenecekler:

- [ ] `scripts/logs-tail.sh` güçlendir — color coding, error filter
- [ ] Sentry DSN — production error tracking
- [ ] PM2 log rotation — ecosystem.config.cjs

### Pane 9 — 📈 Analytics-Dev

```bash
npm run analytics:dev   # tsx scripts/analytics-dev.ts
node scripts/analytics-dev.js
```

#### Eklenecekler:

- [ ] `scripts/analytics-dev.ts` — fake GA4/GTM dev server sertleştir
- [ ] GTM preview mode entegrasyonu
- [ ] Hotjar session replay mock

#### Test Paketi: `analytics.spec.ts` + `crawl_analytics_dev.spec.ts` (32 test)

---

## 🚀 Phase 7 — Ops & Deploy (Low)

### Pane 11 — 🚀 Deploy-Watch

```bash
npm run deploy:watch    # tsx scripts/deploy-watch.ts
```

#### Eklenecekler:

- [ ] GitHub Actions workflow — `.github/workflows/e2e.yml`
- [ ] Blue-green deployment — nginx-bluegreen.conf aktifleştir
- [ ] Cloudflare Workers — edge caching
- [ ] Docker multi-stage build optimizasyonu

### Pane 14 — 🧑‍💼 Lead-CRM

```bash
npm run crm:watch    # tsx scripts/crm-watch.ts
node scripts/crm-sync.js
```

#### Test Paketi: `crawl_admin_crm.spec.ts` + `crawl_booking_flow.spec.ts` (38 test)

---

## 🛠️ Kritik Eksik Dosyalar (Cerrahi Müdahale Listesi)

### A. Node.js Wrapper Scripts (istek5.txt pane komutları)

```
scripts/watch-media.js    ← node scripts/watch-media.js
scripts/analytics-dev.js  ← node scripts/analytics-dev.js
scripts/geo-manager.js    ← node scripts/geo-manager.js (geo-watch.ts wrapper)
scripts/crm-sync.js       ← node scripts/crm-sync.js (crm-watch.ts wrapper)
```

### B. Python Araçları

```
scripts/e2e_health.py     ← E2E sağlık dashboard + HTML rapor
scripts/performance_report.py ← LHCI JSON → markdown + HTML
scripts/seo_audit.py      ← sitemap + robots + schema analyzer
```

### C. HTML5 Araçları

```
public/tools/e2e-dashboard.html  ← canlı test sonuçları dashboard
public/tools/lhci-report.html    ← Lighthouse CI HTML raporu
```

### D. CSS Geliştirmeler

```
src/styles/tokens.css     ← Design token custom properties
src/styles/a11y.css       ← Accessibility yardımcı sınıflar
src/styles/debug.css      ← E2E debugging CSS
```

### E. Playwright Güçlendirme

```
e2e/global-setup.ts       ← Sunucu warmup + DB seed
e2e/fixtures/index.ts     ← Ortak test fixture'ları
e2e/helpers/mocks.ts      ← Merkezi mock yöneticisi
```

---

## 📋 Öncelik Sırası (Bu Haftaki Sprint)

```
1. [KRİTİK] e2e/comprehensive_audit.spec.ts — başlık fix
2. [KRİTİK] scripts/*.js wrapper'lar — pane komutları
3. [YÜKSEK]  scripts/e2e_health.py — Python sağlık monitörü
4. [YÜKSEK]  public/tools/e2e-dashboard.html — HTML5 dashboard
5. [YÜKSEK]  e2e/global-setup.ts — sunucu ısınma
6. [ORTA]    .storybook/ — addon-a11y + stories ekleme
7. [ORTA]    src/components/ui/*.tsx — MediaPicture, SkeletonLoader
8. [DÜŞÜK]   src/styles/tokens.css — design tokens
9. [DÜŞÜK]   .lighthouserc.js — mobile preset ekleme
```

---

## 🔄 CI/CD Pipeline Akışı

```
git push
  │
  ├─→ GitHub Actions: typecheck + lint + vitest
  │     └─→ npm run typecheck (0 hata zorunlu)
  │
  ├─→ Playwright E2E (paralel, 6 worker)
  │     ├─→ Phase 1-3: Core + UI + Media (5dk)
  │     ├─→ Phase 4-5: SEO + Quality (8dk)
  │     └─→ Phase 6-7: Observability + Ops (5dk)
  │
  ├─→ Lighthouse CI (3 run × 6 page)
  │     └─→ Performance ≥ 0.70 (warn) | A11y ≥ 0.98 (error)
  │
  └─→ Deploy (Hostinger/Vercel)
        ├─→ Frontend: vite build → CDN
        └─→ Backend: PM2 → Node.js
```

---

## 📊 Python Analiz Araçları Çalıştırma

```bash
# E2E sağlık raporu
python3 scripts/e2e_coverage_report.py

# E2E health dashboard (HTML üretir)
python3 scripts/e2e_health.py --output public/tools/e2e-dashboard.html

# SEO audit
python3 scripts/seo_audit.py --base-url http://localhost:4173

# Performance report
python3 scripts/performance_report.py --lhci-dir lighthouse-reports/
```

---

_Son güncelleme: `python3 scripts/e2e_coverage_report.py` çıktısına göre otomatik_
