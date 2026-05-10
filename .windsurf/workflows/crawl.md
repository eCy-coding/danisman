---
description: E2E Crawl suite çalıştır — SEO + Performance + Security + Conversion
---

# /crawl [--spec=all|seo|perf|security|conversion]

P31-P35 roadmap E2E doğrulama. 10 spec × 160+ test.

## Hızlı: Tüm crawl suite

```bash
npm run test:crawl
```

## Seçici çalıştırma

### SEO Audit (P31-P32)
```bash
npx playwright test e2e/crawl_seo_audit.spec.ts e2e/crawl_content_quality.spec.ts e2e/crawl_schema_deep.spec.ts --project=chromium --reporter=dot
```

### Performance (P33)
```bash
npx playwright test e2e/crawl_performance_vitals.spec.ts e2e/crawl_image_lcp.spec.ts e2e/crawl_mobile_pwa.spec.ts --project=chromium --reporter=dot
```

### Security (P35)
```bash
npx playwright test e2e/crawl_security_headers.spec.ts --project=chromium --reporter=dot
```

### Conversion (P34)
```bash
npx playwright test e2e/crawl_conversion_funnel.spec.ts --project=chromium --reporter=dot
```

### Link Integrity (P31)
```bash
npx playwright test e2e/crawl_link_integrity.spec.ts --project=chromium --reporter=dot
```

### Python Scripts (11-12)
```bash
npx playwright test e2e/crawl_python.spec.ts --project=chromium --reporter=dot
```

## Adım 2: Raporları oku

```bash
ls crowler/reports/ | tail -5
```

## Adım 3: Fail varsa

```bash
npx playwright show-report
```

## Sunucu durumu

Önce sunucu ayakta mı?
// turbo
```bash
curl -s http://localhost:4173/ | head -1 && curl -s http://localhost:3001/__health
```

Değilse başlat:
```bash
npm run build && npm run preview &
npm run dev:server &
```

## Notlar
- crawl_seo_audit: 46 sayfa parametrik SEO
- crawl_performance_vitals: CDP gerçek LCP/CLS ölçümü
- crawl_security_headers: OWASP Top 10 headers
- Referans: crowler/README.md
