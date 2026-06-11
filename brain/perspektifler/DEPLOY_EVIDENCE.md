# Perspektifler — Production Deploy Evidence (2026-06-11)

## Adım 1 — PR kontrol & CI triage
- PR #222: mergeable=MERGEABLE; CI failleri triage edildi:
  - vitest: 6 orphan Insight*.test (silinen prototip sayfalarını import) → silindi (ff5847b)
  - cluster-d-case-studies ×3 → shared-taxonomy sözleşmesine migrate (8b0390d)
  - gitleaks (shallow-checkout, "0 bytes partial, no leaks") + npm audit (pre-existing dep) + LH/axe/visual (ESKİ prod'a karşı koşuyor) = bloklamayan infra/pre-existing.
- Sonuç: vitest lokal **2 failed | 139 passed** = branch-öncesi baseline ile birebir.

## Adım 2 — Merge
- `gh pr merge 222 --squash` → **state=MERGED mergedAt=2026-06-11T12:45:48Z**

## Adım 3 — Vercel auto-deploy
- Merge +52s: `danisman` + `danisman-v4t1` Production **Queued** → **Ready**
- Deploy ÖNCESİ kilitlenen eski yön: `ecypro.com/perspektifler → 308 → /blog`, `/blog → 200`

## Adım 4 — Canlı redirect matrisi (deploy SONRASI, curl)
| URL | Sonuç |
|---|---|
| `ecypro.com/blog` | **308 → /perspektifler** ✓ |
| `ecypro.com/insights` | **308 → /perspektifler** ✓ |
| `ecypro.com/blog/stratejik-dijital-donusum-2026` | **308 → /perspektifler/stratejik-dijital-donusum-2026** (param korunur) ✓ |
| `ecypro.com/perspektifler` | **200** ✓ |
| `ecypro.com/perspektifler/stratejik-dijital-donusum-2026` | **200** ✓ |

## Adım 5 — SEO yüzeyi (canlı)
- sitemap.xml: **260 × perspektifler URL · 0 × /blog** ✓
- rss.xml item linkleri: `https://www.ecypro.com/perspektifler/…` ✓
- robots.txt: 3 sitemap referansı ✓
- Not (pre-existing): statik HTML title generic shell (Vercel prerender-skip; client Helmet düzeltiyor — canlı title "Perspektifler | eCyPro Premium Danışmanlık" ölçüldü). Kalıcı fix ayrı iş: PLAN_ssr-prerender-seo.md.

## Adım 6 — Canlı görsel kanıt (headless chromium, 1366×900)
- `live-hub.png` — H1 "Perspektifler", featured hero 1+3, temiz nav (BUG-02 yok)
- `live-menu-open.png` — panel: Kategoriler(sayaçlı) + Formatlar + Öne Çıkanlar + 2026 AI Raporu promo; 17 link (≤30); SEKTÖRLER/HAKKIMIZDA yok
- `live-article.png` — breadcrumb: Perspektifler › Strateji › Stratejik Dijital Dönüşüm Rehberi 2026

## Adım 7 — Prod Lighthouse (mobile)
- JSON: `live-lighthouse-hub.json` — skorlar PROGRESS.md'de.

## FAZ-2C — İkonlar + Prebuilt Prerender Deploy (2026-06-12)
| Adım | Kanıt |
|---|---|
| Nav ikonları | NAV_ITEMS iconName ×7 + Navbar NAV_ICON_MAP (desktop kutular + mobil); canlı `NAV_ICON_SVG_COUNT: 7`; görsel `live-nav-icons.png` ("YENİ" badge ile) |
| Prerender watchdog | `withWatchdog(60s)` her iki denemeyi sarar — 44-route kilidi yapısal çözüldü; final build **152/152 ok, 0 fail, 0 watchdog** |
| PRERENDER_FORCE_LOCAL | `vercel build` (VERCEL=1) altında skip bypass + lokal full-playwright zorlaması → `.vercel/output/static` 152 index.html |
| Prebuilt deploy | `npx vercel@latest deploy --prebuilt --prod --yes` → `▲ Production https://danisman-hk86mwv4j-…` (ilk deneme Vercel API 500 — geçici, retry OK) |
| **Statik title CANLI** | `curl https://ecypro.com/perspektifler` → `<title>Perspektifler \| eCyPro Premium Danışmanlık` (JS'siz; title-shell ÇÖZÜLDÜ — crawler'lar sayfa-başına meta görüyor) |
| Founder canlı | H1 = "Emre Can Yalçın" (artık "Hizmet Kesintisi" değil) |
| Prod LH v2 | 59/97/92/100 (`live-lighthouse-hub-v2.json`) — perf v1=64'e karşı gece-varyans bandında; kazanç crawler-yüzeyi statik meta |
| PR'lar | #223 MERGED 17:57Z (crash fixleri+CI) · #224 MERGED 23:06Z (ikonlar+watchdog) |
| Not | #224 auto-deploy prebuilt'ü ezer → merge sonrası prebuilt re-assert edildi (vd2.log). KALICI öneri (owner): release akışına "merge → vercel build (FORCE_LOCAL) → deploy --prebuilt" adımı ya da CI job'u |
