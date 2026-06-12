# OWNER TIER-3 QUEUE — Sahip Onayı/Host Gereken İşler

> Bu işler Tier-3 (owner-only) veya host-only (Chrome/SSH/prod) olduğundan ajan
> otonom tamamlayamaz. Her biri kanıt/gerekçe ile listelenmiştir. Güncelleme: 2026-06-13.

## Açık (owner aksiyonu bekliyor)

| # | İş | Neden owner/host | Hazır komut / sonraki adım |
|---|---|---|---|
| O1 | **KVKK PR merge** (`KVKK_BREACH_ALERT.md`, IP-hash) | Tier-3: main merge + no-auto-merge etiketi | PR'ı incele → owner "Merge" |
| O2 | **AC-06 Lighthouse prod re-measure** | Host Chrome + prod URL; committed LH perf 59-64 (LCP 7-10.5s) | Deploy sonrası: `npm run lh:audit` (PREVIEW_URL=prod) → AC-06 yeniden değerlendir |
| O3 | **AC-07 axe host run** | Playwright + Chrome (sandbox'ta koşmaz) | host: `npx playwright test e2e/a11y-perspektifler.spec.ts` |
| O4 | **AC-06 kalıcı çözüm: SSR/prerender perf** | LCP 7-10.5s render-blocking; prod ölçümü + mimari karar | `PLAN_ssr-prerender-seo.md` referans; ayrı sprint |
| O5 | **Branch → main merge** (`fix/project-gaps-2026-06-08`) | Tier-3: protected main, owner explicit gate | CI yeşil + bu kuyruk boşaldıktan sonra owner "Merge" |

## Notlar
- O2/O3 sandbox'ta KOŞULAMAZ (Chrome yok) — ajan PENDING işaretledi, uydurmadı.
- AC-06 dışındaki 11 AC kanıtlı PASS (bkz. brain/PERSPEKTIFLER_AC_STATUS_2026-06-13.md).
- Ajan tarafı branch durumu: tsc 0/0 · eslint 0 · vitest yeşil (pre-existing/intermittent hariç) · e2e sanity 6/6 · build exit 0 (temiz ortam) · prerender 175/175.
