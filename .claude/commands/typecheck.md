---
description: Frontend + server TypeScript strict tip kontrolü.
allowed-tools: Bash(npm run typecheck *), Bash(npm run typecheck:web *), Bash(npm run typecheck:server *), Read(**)
---

# /typecheck

Adımlar:

1. `npm run typecheck` — frontend + server zinciri (`tsc --noEmit && tsc -p tsconfig.server.json --noEmit`).
2. Hata varsa:
   - İlk 10 hatayı `dosya:satır kural-açıklama` formatında özetle.
   - Hatanın hangi katmanda olduğunu (web / server) belirt.
   - Önerilen düzeltmeyi kullanıcıya sun (otomatik düzeltme YOK).
3. Hata yoksa: "✓ Type check geçti" yaz ve dur.

İpucu: Sadece bir katman için → `npm run typecheck:web` veya `npm run typecheck:server`.
