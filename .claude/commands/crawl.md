---
description: E2E crawl suite çalıştır — SEO + Performance + Security + Conversion
allowed-tools: Bash
---

# /crawl

160+ test, 10 spec. Sunucu ayakta mı kontrol et, sonra çalıştır.

```bash
curl -s http://localhost:4173/ | head -1 || echo "⚠ Sunucu kapalı — npm run preview çalıştır"
npm run test:crawl
```

Seçici çalıştırma için argüman: $ARGUMENTS
- `seo` → `npx playwright test e2e/crawl_seo_audit.spec.ts e2e/crawl_content_quality.spec.ts --project=chromium`
- `perf` → `npx playwright test e2e/crawl_performance_vitals.spec.ts e2e/crawl_image_lcp.spec.ts --project=chromium`
- `security` → `npx playwright test e2e/crawl_security_headers.spec.ts --project=chromium`
- `conversion` → `npx playwright test e2e/crawl_conversion_funnel.spec.ts --project=chromium`
- `mobile` → `npx playwright test e2e/crawl_mobile_pwa.spec.ts --project=chromium`
- `python` → `npx playwright test e2e/crawl_python.spec.ts --project=chromium`

Fail durumunda: `npx playwright show-report`
