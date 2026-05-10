---
description: Stratejik planlama — Roadmap'ten sıradaki görev seç ve plan üret
---

# /plan

**İstek4.txt:** "Planlamayı opus'u ileri düzey kullanarak yap"
Roadmap'i okur, ICE scoring yapar, öncelikli görevi planlar.

## Adım 1: Roadmap durumu

// turbo
```bash
grep -n "⬜\|✅" brain/roadmap/roadmap_10.md brain/roadmap/roadmap_20.md brain/roadmap/roadmap_30.md | head -30
```

## Adım 2: Pending görevleri bul

// turbo
```bash
grep -n "⬜" brain/roadmap/roadmap_10.md | head -10
grep -n "⬜" brain/roadmap/roadmap_20.md | head -10
grep -n "⬜" brain/roadmap/roadmap_30.md | head -10
```

## Adım 3: Tier 1 görevlere odaklan

Tier sırası: P31 (SEO/GSC) → P32 (Keyword) → P33 (LCP) → P34 (Conversion) → P35 (Security)

roadmap_100.md özeti:
```
Tier 1 (Kritik)  : Phase 31-33 | SEO + Keyword + Performance (önce bunlar)
Tier 2 (Yüksek)  : Phase 34-37 | Conversion + Security + Admin + Booking
Tier 3 (Orta)    : Phase 38-40 | Authority + i18n + DevOps
```

## Adım 4: Seçilen görevi detaylandır

İlk ⬜ görevi oku:
```bash
cat brain/roadmap/roadmap_10.md | grep -A 10 "⬜" | head -20
```

## Adım 5: Görev planı üret

Format:
```
GÖREV: P31-T01 GSC Property Doğrulama
FAZ: roadmap_10.md
TİER: 1 (Kritik)
TAHMİN: 15dk
ETKILENEN: public/, .env.example
DOĞRULAMA: npm run typecheck && npm run lint
BAŞLA → /implement [görev_adı]
```

## Notlar
- Tier 1 bitmeden Tier 2 başlama → roadmap_100.md "matematiksel hata"
- Brain/memory.md ile senkron tut
- Referans: prompts2/02-feature-implementation.md
