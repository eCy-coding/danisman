---
description: P33 Performance audit — LCP/CLS/FCP + bundle + image
allowed-tools: Read, Bash, Glob
---

# /performance

roadmap_30.md P33 T21-T30 performans denetimi.
istek3.txt: "LCP doğrudan google için sıralama faktörü"

1. `npx playwright test e2e/crawl_performance_vitals.spec.ts --project=chromium --reporter=dot`
2. `npm run build 2>&1 | grep -E "\.js" | sort -k2 -h | tail -5` — bundle boyutları
3. `ls public/images/ | grep -cE "\.webp|\.avif"` — WebP/AVIF sayısı
4. `grep -c 'loading="lazy"' dist/index.html 2>/dev/null || echo "build önce"` — lazy count
5. `grep -n "preload.*font" index.html || echo "⚠ Font preload eksik"`
6. `grep -n "fetchpriority" index.html || echo "⚠ Hero fetchpriority eksik"`

Hedef:
- LCP ≤ 2.0s (production), CLS ≤ 0.05, INP ≤ 150ms
- Lighthouse ≥ 90 production CDN

Referans: prompts2/05-performance-audit.md
