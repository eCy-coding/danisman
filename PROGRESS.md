# PROGRESS — Perspektifler Rebuild

## GATE-0 — Recon (DONE 2026-06-11)
- DONE: spec saved (brain/PERSPEKTIFLER_REBUILD_SPEC.md), SCOPE.md + allowlist, bug table
  (12 bugs, root-caused to file:line), benchmark matrix (NN/g + Stripe live; rest staged),
  content-inventory.csv (36 mdx, 108 raw tags, 21 raw cats), PLAN.md + PLAN.json,
  CLAUDE.md working principles, GAPS appended to spec.
- DECISION: /perspektifler becomes canonical hub; adopt /insights subsystem; 301 /blog in.
- DECISION: benchmark = 2 live-verified + 8 inferred (labeled); more live spot-checks on demand.
- NEXT: await user approval → Phase 1 (taxonomy.json + merge-map + check-taxonomy gate).

## Decisions log
- 2026-06-11 D1: scope fenced to Perspektifler vertical (SCOPE.md). /about BUG-07 only if global.
- 2026-06-11 D2: canonical hub = /perspektifler (reverse current /perspektifler->/blog redirect).

## GATE-1 — Taxonomy (DONE 2026-06-11)
- DONE: src/data/perspektifler/{taxonomy,merge-map,redirects}.json + scripts/
  build-perspektifler-taxonomy.mjs + scripts/check-taxonomy.mjs.
- EVIDENCE (node scripts/check-taxonomy.mjs): 13/13 PASS — 10 categories, 57 tags (<=60),
  0 dup normalized slugs, 100% of 108 raw tags mapped, 100% of 21 raw cats mapped,
  /blog->/perspektifler correct, 100% article 301s (36), 100% retired tag-URL 301s (108),
  no chain >1 hop. 146 redirects total.
- DECISION: 57-term controlled vocab (room under 60 for quarterly additions); ecyverse tag
  dropped (brand noise); strateji/m-and-a/degerleme/ESG/Liderlik tags dropped (= categories).
- NEXT: Phase 2 — menu BUG-01..04 + BUG-12.

## GATE-2 — Menu (DONE 2026-06-11)
- DONE (görünür ilk düzeltmeler):
  - BUG-01: Navbar'a route-change/outside-click/scroll close listener eklendi (ESC zaten vardı).
  - BUG-02: ikon kutusu yalnızca item.icon varsa render edilir (boş kareler gitti).
  - BUG-03: MEGA_MENUS.insights insights-only → Kategoriler(6)+Formatlar(4)+Öne Çıkanlar(3);
    Sektörler + Hakkımızda grupları KALDIRILDI.
  - BUG-04: MegaMenu footer per-menu → insights "Tüm içgörüleri keşfedin" + /perspektifler.
  - BUG-12: panel z-50 + aria-hidden/pointer-events (kapalı panel inert).
- EVIDENCE: vitest 27/27 PASS (menu-insights + 4 mevcut menü testi); typecheck:web 0; eslint 0.
  Playwright e2e/menu.spec.ts yazıldı (10 test × 3 tarayıcı, --list doğrulandı) → kullanıcıda koşar.
- DECISION: kategori/format/öne-çıkan linkleri kanonik /perspektifler/* hedefler (Phase 3/4'te
  resolve olur). /blog hero watermark çakışması (BUG-12 kalanı) Phase 3 hub'da ele alınır.
- NEXT: Phase 3 — Hub /perspektifler (301 /blog→/perspektifler, hero+facet+arama+Load More).

## IMPROVE-LOOP Oturum-1 (DONE 2026-06-12)
- ALTYAPI: .git/index.lock ×70 temizlendi (host); dirty-tree triyajı (husky sızıntısı + regen churn restore); docs commit 0932c8b.
- BL-01 DONE (6c78597): a6dd95a cherry-pick — çift yüklenen ham index.css kaldırıldı (@layer/preflight ezilmesi kökü) + Pricing/ServiceCard/BlogPage a11y. PerspektiflerFeed.tsx pick'ten çıkarıldı (delete/modify: dosya bu branch'te yok; hub Phase 3'te kendi feed'ini kurar).
- BL-02 DONE (82a3a81): tracked .bak ×2 rm. BL-08 DONE (00214d1): insight-article testine konvansiyonel 404 fetch stub — kök: route-param'sız 3 render + mock'suz fetch (jsdom'da fetch=undici, relative URL reddi). ERR_INVALID_URL 0.
- EVIDENCE: tsc web+server 0; eslint 0; vitest 157 dosya yeşil (12 shard, 1191 pass/15 pre-existing skip) + hedefli 40/40 + pricing PASS; size 100.43/105 kB (CACHED dist).
- RECLASS: BL-05 @ts-expect-error 9/9 açıklamalı-haklı → 🟢 düşük öncelik. ts-prune 410 adayı güvenilmez (false-positive kanıtlı) → BL-09 knip host.
- PENDING-OWNER: LHCI host koşumu (BL-01 etkisi ölçümü), full e2e host, KVKK PR merge.
- NEXT: BL-10 (TODO×2) → BL-09 (knip) → BL-06/07 (App.tsx + service-content bölme).

## IMPROVE-LOOP Oturum-2 (DONE 2026-06-12)
- BL-10 EVALUATED, aksiyon yok: iki TODO da belgeli/kasıtlı erteleme (a: i18n threading = EN içerik kararı, lang='tr' doğru ara önlem; b: TODO(P18) mimari tercih, API kontrat değişikliği) — iş üretilmedi (anti-meta-orchestration).
- BL-13 YENİ (🔴 pre-existing): e2e Booking Wizard sanity 3/3 tarayıcı kırmızı. Kanıt: dist gate-2 anından (bugünkü 5 commit dist'te yok → regresyonumuz değil). Mekanizma: ServicesPage InteractiveLazyMount (intersection-gated) vs test timing; aynı sınıf fix main'de #225. Kalıcı çözüm: gate-3 öncesi main senkronu.
- BL-09 FAZ-1 DONE: knip ham 104 unused file / 27 dep / 103 export (brain/KNIP_RAW_2026-06-12.txt). Örneklem teyitleri: DemoRequestModal+dayjs+emailjs gerçek ölü; keystatic FP (admin.html entry). CLAUDE.md'nin 'Email: EmailJS' satırı bayat. Faz-2: knip.json + teyitli silme.
- ALTYAPI: taze build alındı (vite ✓; 154-route prerender detached sürüyor); brain/IMPROVE_LESSONS.md oluşturuldu (7 ders: DC nohup deseni, sandbox git-write yasağı, ts-prune güvenilmezliği, pick delete/modify kontrolü, dist tazeliği kanıtı, zsh glob, e2e harness).
- PENDING: e2e tek-test re-check (prerender bitince) · LHCI host · KVKK PR merge (owner).
- NEXT: BL-13 (main senkron kararı) → BL-09 faz-2 → BL-06/07.
