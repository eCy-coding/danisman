# EcyPro — Performans Denetim Promptu
# Hedef: Lighthouse Performance ≥ 85 | LCP ≤ 2.5s | INP ≤ 200ms | CLS ≤ 0.1
# ─────────────────────────────────────────────────────────

## Denetim Adımları

### 1. Baseline Ölçümü
```bash
npm run build
npm run preview &
sleep 3
npx lighthouse http://localhost:4173 \
  --output=json \
  --output-path=/tmp/lh-baseline.json \
  --only-categories=performance \
  --chrome-flags="--headless"
```

### 2. Metrik Analizi
```bash
node -e "
const d = require('/tmp/lh-baseline.json');
const m = d.audits;
console.log('FCP :', m['first-contentful-paint'].displayValue);
console.log('LCP :', m['largest-contentful-paint'].displayValue);
console.log('TBT :', m['total-blocking-time'].displayValue);
console.log('CLS :', m['cumulative-layout-shift'].displayValue);
console.log('TTI :', m['interactive'].displayValue);
console.log('SI  :', m['speed-index'].displayValue);
"
```

### 3. Bundle Analizi
```bash
# Büyük chunk'ları bul
du -sh dist/assets/*.js | sort -h | tail -10

# Vendor bundle içeriği
npx source-map-explorer dist/assets/vendor-*.js
```

## Optimizasyon Kontrol Listesi

### HTML
- [ ] `<html lang="tr">` veya dinamik dil attribute
- [ ] `<meta charset="utf-8">` en üstte
- [ ] `<link rel="preload" as="font" type="font/woff2" crossorigin>` kritik fontlar
- [ ] `<link rel="modulepreload">` kritik JS chunk'ları
- [ ] `<link rel="preconnect" href="https://...">` CDN'ler
- [ ] App Shell pre-render (statik hero skeleton)

### CSS
- [ ] Critical CSS inlining (above-fold için)
- [ ] `content-visibility: auto` below-fold için
- [ ] Tailwind v4 auto-optimization aktif
- [ ] Kullanılmayan CSS purge edildi

### JavaScript
- [ ] `React.lazy()` sayfa bazlı code splitting
- [ ] `<Suspense>` loading state
- [ ] Dynamic import: `const x = await import('...')`
- [ ] Tree shaking: named import kullan
- [ ] Bundle ana ≤ 200KB (gzip'lenmiş)

### Assets
- [ ] Fontlar self-host (`@fontsource/*`)
- [ ] Images WebP/AVIF format
- [ ] `loading="lazy"` below-fold images
- [ ] `decoding="async"` decoder boost
- [ ] Responsive `srcset` + `sizes`

### Network
- [ ] Brotli compression (tercih: Vite Brotli plugin)
- [ ] HTTP/2 server push veya Early Hints
- [ ] Cache-Control headers
- [ ] Service Worker runtime caching

## Mevcut Baseline (Phase 29)

```
Performance : 73 (local)
Accessibility: 100
Best Practices: 100
SEO         : 100

FCP  : ~0.8s
LCP  : ~1.2s
TBT  : ~80ms
CLS  : 0
```

**Beklenti**: CDN (Vercel Edge) + Brotli sonrası Performance ≥ 85.

## Darboğaz Tespit Şablonu

```
Darboğaz    : [Metrik adı — Ölçüm]
Kök Neden   : [Analiz]
Çözüm       : [Somut aksiyon]
Etki        : [Beklenen iyileşme]
Risk        : [Side-effect, E2E etkisi]
Doğrulama   : [Komut + metrik]
```
