# P43 — Lighthouse + SEO Audit (PROD)

**Target:** https://www.ecypro.com/
**Fetch:** 2026-05-17T10:19:32Z · LH 13.0.1 · mobile · simulate (CPU x4, RTT 150ms, 1638/750 kbps)

## Lighthouse Scores

| Performance | Accessibility | Best-Practices | SEO     |
| ----------- | ------------- | -------------- | ------- |
| **89**      | **100**       | **92**         | **100** |

## Web Vitals (mobile, simulated)

| Metric          | Value           | Verdict                     |
| --------------- | --------------- | --------------------------- |
| LCP             | 3069 ms (3.1 s) | needs-improvement (>2500ms) |
| FCP             | 2769 ms (2.8 s) | ok                          |
| CLS             | 0               | excellent                   |
| TBT (INP proxy) | 0 ms            | excellent                   |
| Speed Index     | 2879 ms (2.9 s) | ok                          |
| TTI             | 3069 ms         | ok                          |
| Total bytes     | 410 KB          | lean                        |
| Unused JS       | 0 KB            | clean                       |
| Render-block    | 0 ms            | clean                       |

## SEO Health

| Check                                | Status                                            |
| ------------------------------------ | ------------------------------------------------- |
| `/sitemap.xml`                       | 200, valid XML, hreflang tr/en/x-default          |
| `/robots.txt`                        | 200, `Allow: /`, 4 sitemap entries                |
| Canonical                            | present (`https://www.ecypro.com/`)               |
| og:title / og:description / og:image | all present                                       |
| twitter:card, twitter:image          | present (`summary_large_image`)                   |
| `google-site-verification` meta      | **MISSING** — GSC ownership not verified via meta |
| meta robots                          | `index, follow`                                   |

## Triage

- **LCP 3.1s** is the single soft spot (target <2.5s). TBT/CLS/SI are all green. Total payload 410 KB and zero unused JS suggest the cost is server TTFB + hero hydration, not bundle size.
- **Recommended fix:** preload the LCP hero asset and add `<link rel="preconnect">` for the API/CDN origin used by the hero — typically shaves 400–700 ms off mobile LCP at this payload size. Pair with `fetchpriority="high"` on the hero image/`<img>` (or hero text font) to push the LCP candidate to the top of the critical path.
- **GSC verification:** add `<meta name="google-site-verification" content="...">` in `index.html` (or DNS TXT) so Search Console linking goes through.

## Artifacts

- `outputs/P43_LH_PROD.json` (349 KB full Lighthouse JSON)
- `outputs/P43_LIGHTHOUSE_SUMMARY.md` (this file)
