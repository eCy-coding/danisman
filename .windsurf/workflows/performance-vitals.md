---
description: P33 Performance Audit — LCP/CLS/FCP ölç + Lighthouse raporu
---

# /performance-vitals

roadmap_30.md P33-T21-T30 doğrulama. istek3.txt: "LCP doğrudan google sıralama faktörü"

## Adım 1: Core Web Vitals E2E

```bash
npx playwright test e2e/crawl_performance_vitals.spec.ts --project=chromium --reporter=list
```

## Adım 2: Image + Mobile audit

```bash
npx playwright test e2e/crawl_image_lcp.spec.ts e2e/crawl_mobile_pwa.spec.ts --project=chromium --reporter=dot
```

## Adım 3: Lighthouse (build sonrası)

```bash
npm run build && npx lhci autorun 2>&1 | tail -20
```

## Adım 4: Bundle analizi

// turbo
```bash
npm run build 2>&1 | grep -E "\.js|\.css" | sort -k2 -h | tail -10
```

## Adım 5: Hero image WebP (P33-T21)

```bash
ls public/images/ | grep -E "\.webp|\.avif" | wc -l
```

Eksikse:
```bash
for f in public/images/*.{jpg,jpeg,png}; do
  cwebp -q 80 "$f" -o "${f%.*}.webp" 2>/dev/null && echo "✅ $f → webp"
done
```

## Adım 6: Font preload (P33-T25)

```bash
grep -n "preload.*font\|font.*preload" index.html || echo "⚠ Font preload eksik"
```

## Adım 7: 3rd party async (P33-T26)

```bash
grep -n "script.*src\|src.*script" index.html | grep -v "async\|defer\|module" | head -5
```

## Hedef (roadmap_30.md)
- LCP ≤ 2.0s (production CDN)
- CLS ≤ 0.05
- INP ≤ 150ms
- Lighthouse Performance local ≥ 85, production ≥ 90

## Notlar
- Referans: docs/prompts/05-performance-audit.md
- crawl_performance_vitals: CDP PerformanceObserver ile gerçek ölçüm
