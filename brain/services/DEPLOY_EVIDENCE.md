# SVC DEPLOY EVIDENCE — 2026-06-12

## D1 — Merge
- `gh pr merge 227 --squash` → **MERGED**, squash SHA `6d6fe20ebb39b65a8d566ca1f35896da40e62767`.
- CI triage: "Failed Tests 23" = Gate-0 baseline'daki aynı 23 pre-existing (canonical 1 + track-b 9 + founder 12 + static-rules 1; lint 0 error) — log: run 27391822844. Lighthouse-CI/axe-prod fail'leri eski canlıyı denetliyordu.

## D2 — Worktree → main
- `git checkout main && git pull` → `6d6fe20` (`.sync/claude.jsonl` artifact stash+drop ile aşıldı).
- `.vercel/project.json` ana repodan kopyalandı (`prj_vNPwZaC5vMYZxImuo231YpVYYwN2`).

## D3 — Prebuilt build (FAZ-2C akışı)
- `vercel pull --yes --environment=production` ✓
- `PRERENDER_FORCE_LOCAL=1 vercel build --prod` → **VBUILD_EXIT=0**
- **`[prerender] 170/170 ok, 0 fail`** · `.vercel/output/static/services` = **40 sayfa** · `services/company-valuation/index.html` mevcut.

## D4 — Deploy
- `vercel deploy --prebuilt --prod` → `https://danisman-ijpr94dre-ecys-projects.vercel.app` Production Ready (18s), **Aliased → https://ecypro.com**.
- Auto-deploy yarışı (`qhnxj3jse`, prerender'sız, merge tetikli) alias'ı kaybetti — prebuilt en-son-production. Re-assert gerekmedi.

## D5 — Canlı kanıt matrisi (apex; www→apex 308 bilinen)
```
200  strategic-transformation  →  Stratejik Dönüşüm & Kurumsal Planlama | eCyPro…
200  ai-analytics              →  Yapay Zeka (AI) & İş Analitiği | eCyPro…
200  digital-strategy          →  Dijital Dönüşüm & Teknoloji Stratejisi | eCyPro…
200  payroll-audit             →  Bordro Denetimi & İstihdam Teşvikleri | eCyPro…   (ESKİ ORPHAN)
200  company-valuation         →  Şirket Değerleme & Kazanç Kalitesi (QoE) | eCyPro… (YENİ SAYFA)
index /services: 200 · sitemap: 156 satır services/ = 39 slug × 4 hreflang ✓
```
Statik title'lar = prerender canlıda çalışıyor (title-shell yok).
Görseller: `live-mega-menu-open.png` (yeni hedefler menüde) · `live-services-index.png` ·
`live-lifecycle-visualizer.png` · `live-company-valuation.png` (fallback illüstrasyon canlı).

## Deploy öncesi/sonrası
- ÖNCE: menünün 9 öğesinden 5'i 404 (owner ekran görüntüsü), 17 sitemap URL ölü.
- SONRA: 9/9 hedef 200 + statik title; sitemap 39 canonical, 0 ölü.

## Re-assert (yarış 2 — #228 docs merge sonrası)
- `ld34rl347` (auto, prerender'sız) Ready olup alias'ı aldı; canlı title generic shell'e düştü (kanıt yakalandı).
- `vercel deploy --prebuilt --prod` → **`rat7ce684` Aliased ecypro.com**; canlı title ilk denemede statik: "Şirket Değerleme & Kazanç Kalitesi (QoE)".
- Final matris (re-assert sonrası): 5/5 rota 200 + statik title · sitemap 156 satır (39×4).

## Rollback
`vercel rollback https://danisman-qhnxj3jse-ecys-projects.vercel.app` (önceki production) — tek komut.

## Owner kuyruğu (deploy sonrası)
Search Console sitemap yeniden gönder (39 servis URL — 17 eski 404 recrawl) · visual snapshot re-baseline · npm audit CI · gitleaks tarihsel 24 kayıt.
