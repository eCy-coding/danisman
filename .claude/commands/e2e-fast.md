---
description: Hızlı sanity duman testi — sadece sanity_check spec.
allowed-tools: Bash(npm run test:e2e:fast *), Read(**)
---

# /e2e-fast

`npm run test:e2e:fast` çalıştır → `sanity_check` spec'ini list reporter ile koşturur.

Amaç:
- Hızlı duman testi (< 30 saniye).
- Major regression detect.
- CI öncesi pre-flight.

Fail durumunda:
- Hangi assertion düştüğünü göster.
- Kök neden ipucu ver (selector, network, timing).

Tam suite için: `/e2e`.
