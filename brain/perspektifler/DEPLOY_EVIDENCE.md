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
