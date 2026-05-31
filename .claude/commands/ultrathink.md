---
description: Derin çapraz alan analizi — Opus-seviye stratejik planlama
allowed-tools: Read, Bash, Glob
---

# /ultrathink

**istek4.txt:** "Planlamayı opus'u ileri düzey kullanarak yap"

$ARGUMENTS görevini şu boyutlardan analiz et:

1. **Matematiksel** — ICE skoru: Impact × Confidence × Ease (1-10 × 1-10 × 1-10)
2. **Mantıksal** — Bağımlılık zinciri: önceki görevler → bu → sonraki
3. **Teknik** — TypeScript/Vite/React stack ile uyum, breaking change riski
4. **Stratejik** — roadmap Tier sırası: P31-P33 Tier1 önce
5. **SEO/Conversion** — istek3.txt rehber tavsiyeleri ile alignment

Şu dosyaları oku:
- `brain/roadmap/roadmap_10.md` (P31 durumu)
- `docs/prompts/01-system-master.md` (sistem kuralları)
- `docs/prompts/09-architecture-decisions.md` (ADR)

Çıktı formatı:
```
GÖREV: [isim]
ICE: Impact=X Confidence=Y Ease=Z → SKOR=N
BAĞIMLILIK: [önceki] → [bu] → [sonraki]
YAKLAŞIM: [tek cümle]
DOSYALAR: [liste]
BAŞLA: /implement ile devam et
```
