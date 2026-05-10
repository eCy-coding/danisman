---
description: Stratejik planlama — roadmap'ten sıradaki todo seç ve plan yap
allowed-tools: Read, Bash, Glob
---

# /plan

roadmap Tier 1 önceliği ile bir sonraki görevi seç ve planla.

Adımlar:
1. `grep -n "⬜" brain/roadmap/roadmap_10.md brain/roadmap/roadmap_20.md brain/roadmap/roadmap_30.md | head -15` çalıştır
2. İlk Tier 1 ⬜ görevi seç
3. roadmap dosyasından görev açıklamasını oku (NEDEN + ÖNEM + YÖNTEM)
4. ICE analizi yap (Impact/Confidence/Ease)
5. Şu formatta plan üret:

```
GÖREV: P[XX]-T[YY] [isim]
FAZ: roadmap_[XX].md
TIER: [1/2/3]
TAHMİN: [süre]
ETKILENEN: [dosyalar]
DOĞRULAMA: npm run typecheck && npm run lint && [test komutu]
```

Tier sırası: P31 > P32 > P33 > P34 > P35 (roadmap_100.md "matematiksel hata" kuralı)
