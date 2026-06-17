# PERSPEKTİFLER — EVOLUTION LOG (yaşayan spec)

Her adımda: ne öğrenildi · hangi varsayım değişti · master prompt'a hangi madde eklenmeli.
Kaynak spec: `brain/PERSPEKTIFLER_REBUILD_SPEC.md`. Disiplin: kanıt-veya-sessizlik.

## 2026-06-12 · E1 — "Empirik durum: Perspektifler ZATEN shipped"
- ÖĞRENİLEN: Repo, oturum-içi GATE-2'nin çok ilerisinde. Gerçek kaynak kodu okundu
  (meta dosya değil): `/perspektifler` hub = `BlogPage` → `PerspektiflerFeed` (247 sat)
  → `PerspektiflerFacetBar` (5 facet + mobil bottom-sheet) + `BlogCard` + curated
  `PerspektiflerHero` + motor `lib/perspektifler.ts` (URL-state, fold-search, zero-hide,
  DOM cap 48, related/series, case-study birleşimi). 12 bug + hub/kart/pillar/arama
  spec'i FİİLEN karşılanmış. Testler: `lib/perspektifler.test` + `menu-insights` 17/17 yeşil.
- VARSAYIM DEĞİŞTİ: "Phase 3'ten devam et / hub'ı kur" varsayımı GEÇERSİZ — hub var ve
  nitelikli. Arama Fuse.js DEĞİL, bağımsız ranked fold-search ile çözülmüş (G2 hedefi
  "ağır bağımlılık yok" farklı ama geçerli yolla karşılanmış → spec G2 güncellendi sayılır).
- MASTER PROMPT'A EKLE:
  1. "Devam et" tipi talimatlarda ÖNCE gerçek ürünü (kod/route/render) doğrula; meta
     belge (SCOPE/PROGRESS/"shipped") yön kaynağı DEĞİL — yalnızca kod kanıtı yön verir.
  2. Yeniden-inşa görevlerinde ilk adım: "zaten var mı?" envanteri (route + bileşen +
     test), sonra plan. Çift-yapım riskini sıfırlar.
  3. Sandbox'ta tarayıcı binary'si yok → "screenshot" yerine (a) gerçek bileşen kodu,
     (b) prerender HTML, (c) kullanıcı makinesinde Playшright screenshot komutu.

## 2026-06-12 · E2 — İlk iyileştirme: kartlarda prefers-reduced-motion
- ÖĞRENİLEN: `index.css` reduced-motion kuralı YALNIZCA `.ecy-skeleton-shimmer`'ı
  susturuyor; `BlogCard` (motion.article, kart başına stagger) reduced-motion
  kullanıcıları için animasyonu durdurmuyordu (Phase-6 a11y bütçesi açığı). `PerspektiflerHero`
  statik (motion yok) → tek gerçek animasyon kaynağı kart girişi.
- YAPILDI: `BlogCard`'a `useReducedMotion` guard'ı (reduced → initial=false, anlık final
  state). Kanıt: blog-card.test 3/3, typecheck 0, eslint 0.
- VARSAYIM DEĞİŞTİ: "motion/react otomatik reduced-motion'a saygılı" YANLIŞ — explicit
  guard gerekiyor. Daha zengin motion/3D eklemeden ÖNCE bu guard ön koşul.
- MASTER PROMPT'A EKLE:
  4. Yeni motion/animasyon ekleyen her Perspektifler PR'ı, `useReducedMotion` (veya
     `<MotionConfig reducedMotion="user">`) ile gelmeli; aksi halde a11y gate (axe +
     prefers-reduced-motion) reddeder.
  5. Global a11y alternatifi: ileride `index.css`'e genel reduced-motion (transform/anim
     kill) kuralı düşünülebilir — ama global (scope dışı), owner onayıyla.

## 2026-06-12 · E3 — Kart görseli <picture>/AVIF + kırık kapak fix (#2)
- ÖĞRENİLEN: `/images/` klasörü repoda YOK → 36 kartın kapağı (`/images/blog-default.jpg`)
  fiilen kırık. sharp kurulu değil + yeni bağımlılık scope-dışı → sandbox'ta AVIF üretilemez.
- YAPILDI: BlogCard `<picture>` + AVIF/WebP `<source>` (coverOptimized gate → türev yoksa
  emit YOK, 0 kırık source) + srcset/sizes + decoding=async + onError→/og-default.jpg +
  `/images/*` kapaklarını /og-default.jpg'e düşüren resolveCover. Kanıt: blog-card 5/5.
- MASTER PROMPT'A EKLE:
  6. Görsel optimizasyonunda "türev var mı?" gate'i şart — yoksa <source> 404 = kırık görsel;
     progressive-enhancement (coverOptimized flag) + onError fallback ile asla kırma.
  7. Asset varlığını ENVANTERLE doğrula (ls public/...): "shipped" sanılan kapaklar eksik olabilir.

## 2026-06-12 · E4 — Hero design zenginleştirme (#3)
- YAPILDI: Perspektifler hub hero'su saf-CSS aurora (blue+gold+indigo blur katmanları +
  bg-grid mask), gold pill eyebrow (TR-tutarlı "Strateji & Yapay Zeka İçgörüleri"),
  Playfair H1 + blue→white→amber gradient + gold hairline, subtitle slate-300 (kontrast↑).
  LCP-güvenli: animasyon YOK (saf CSS, 0 runtime); reduced-motion sorunu doğmaz.
- VARSAYIM: "zengin hero = motion/3D gerekir" YANLIŞ — statik katmanlı CSS gradient hem
  premium hem LCP-dostu. Infinite animasyon LCP/INP riski; bilinçli kaçınıldı.
- MASTER PROMPT'A EKLE:
  8. Hero/above-the-fold görselde infinite animasyondan kaçın (LCP/INP bütçesi); statik
     katmanlı CSS aurora tercih et. Motion gerekirse one-shot + reduced-motion guard.
