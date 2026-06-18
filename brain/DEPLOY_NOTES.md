# Deploy Notes — Perspektifler SEO/GEO + Test Harness (2026-06-18)

Branch: `fix/project-gaps-2026-06-08` · origin'in **8 commit** önünde.

## Değişiklik seti (bu oturum, 8 commit)
- `ae4f43f` kartlarda prefers-reduced-motion (a11y)
- `b4eb7b5` kart `<picture>`/AVIF + kırık-kapak fix · aurora/gold hero (#2/#3)
- `d028105` **test harness fix** — React 19 act: `vitest.config` NODE_ENV=test + sahte act polyfill kaldır
- `2df471a` evolution log (E5)
- `52f5b96` çift Navbar/Footer kaldır (footer 2→1) + sayfaya-özel OG/Twitter + raster og:image
- `e8a6ec3` banner `<header>` landmark + M8
- `8064662` **index.html JSON-LD data-seo-id** — prod duplikasyon dedup (/perspektifler 10→7 tekil)
- `5090e0d` anasayfa WebSite dedup (JsonLd id, SearchAction korunur) + test/yorum

## Doğrulama (gerçek makine)
- `npm run build` → exit 0 (Vercel'in deploy komutu)
- `npx tsc --noEmit` → exit 0
- Değiştirilen 10 dosyada `eslint` → exit 0 (temiz)
- Perspektifler vertical testleri → 12/12; harness-probe 2/2
- JSON-LD: `/perspektifler` ve `/` → 7'şer blok, hepsi TEKİL (Chrome render ile doğrulandı); anasayfa WebSite SearchAction korundu

## ⚠️ Pre-existing CI durumu (BU BRANCH'TEN DEĞİL — deploy öncesi bilinmeli)
- `npm run lint` → 294 error / 115 warning (repo geneli; **benim dosyalarım temiz**)
- `npm run test:coverage` → 21 fail / 1096 pass (FounderPage×3, betterstack×3 `node:` modül, a11y×2, i18n×1). Bu 21 dosyada bu oturumda **0 commit** var (kanıtlı pre-existing).
- `ci.yml`: `quality` job (lint + typecheck + test:coverage) **zorunlu**, `build needs: quality`. Sıkı okumayla bu pre-existing red'ler CI'yı bloke edebilir. Site şu an bu red'lerle canlı olduğundan ya CI bloklamıyor ya deploy (deploy.yml/Vercel) bağımsız — **merge öncesi branch protection teyit edilmeli.**

## Deploy mekanizması
`deploy.yml` → push to `main` → Vercel CLI. `vercel.json` redirect'leri (`/blog`,`/insights`→`/perspektifler` 301) zaten mevcut.

## Komutlar (kullanıcı çalıştırır)
```
cd ~/Desktop/ecypro
git push origin fix/project-gaps-2026-06-08
# GitHub'da PR aç → main'e; CI yeşil/tolere ise merge → Vercel otomatik deploy
# (alternatif doğrudan: npx vercel --prod  — CI'yı baypas eder)
```

## Commit'siz (deploy'a girmez): `.husky/*` (oturum dışı), `public/sitemap*.xml`+`rss.xml` (build'de yeniden üretilir).
