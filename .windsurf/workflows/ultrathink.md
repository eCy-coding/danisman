---
description: Ultrathink — Derin çapraz alan analizi (Opus-seviye planlama)
---

# /ultrathink

**İstek4.txt direktifi:** "Planlamayı opus'u ileri düzey kullanarak yap"
Bir görev öncesinde matematiksel + mantıksal + teknik çapraz analiz yapar.

## Adım 1: Bağlam yükle

Aktif görevi belirle — roadmap + prompts + memory oku:
// turbo
```bash
cat brain/roadmap/roadmap_10.md | head -20
cat brain/roadmap/roadmap_20.md | head -20
cat prompts/istek3.txt | head -20
cat prompts2/01-system-master.md | head -30
```

## Adım 2: Çapraz analiz matrisi

Görev için şu boyutları değerlendir:
1. **Matematiksel:** Etki × çaba × risk skoru hesapla (ICE: Impact/Confidence/Ease 1-10)
2. **Mantıksal:** Bağımlılık zinciri — bu görev hangi görevleri bloke/açar?
3. **Teknik:** Mevcut tech stack ile uyum — typecheck/lint/test geçebilir mi?
4. **Stratejik:** Roadmap önceliği — Tier 1 > 2 > 3. En yüksek Tier 1 todo önce.
5. **SEO/Conversion:** istek3.txt arkadaş tavsiyeleri ile align mi?

## Adım 3: En iyi yaklaşımı seç

```
Seçim kriterleri (prompts2/09-architecture-decisions.md):
- Reversibility: geri alınabilir mi?
- Consistency: mevcut pattern ile tutarlı mı?
- Minimal değişiklik: cerrahi hassasiyet
```

## Adım 4: Plan çıktısı

Şu formatta özet üret:
```
GÖREV: [isim]
ICE SKORU: Impact=X, Confidence=Y, Ease=Z → Toplam: N
BAĞIMLILIK: [önceki] → [bu] → [sonraki]
ETKILENEN DOSYALAR: [liste]
ONAY: [istek kuralına göre geçerli mi?]
YAKLAŞIM: [tek cümle]
BAŞLA → /implement
```

## Notlar
- Bu workflow kod yazmaz — planlar
- Sonraki adım: /implement ile uygulamaya geç
- Referans: prompts2/10-ai-agent-orchestration.md
