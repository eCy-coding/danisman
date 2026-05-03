---
description: ESLint --fix + Prettier --write — tek komutla biçim hatalarını gider.
allowed-tools: Bash(npm run lint *), Bash(npm run format *), Read(**)
---

# /lint-fix

Aşağıdaki adımları sırayla çalıştır:

1. `npm run lint -- --fix` — ESLint otomatik düzeltme.
2. `npm run format` — Prettier ile tüm proje formatla.
3. Çıktıyı özetle: kaç dosya değişti, kalan uyarı/hata sayısı.

Eğer 1. veya 2. adım fail ederse:
- Hata çıktısını oku.
- Kök nedeni özetle (kural adı, dosya yolu).
- Otomatik çözülemeyen sorunları madde madde listele.
- **Düzeltmeyi otomatik yapma** — kullanıcıya öner.
