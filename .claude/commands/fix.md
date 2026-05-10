---
description: Bug fix — Root cause first, minimal upstream fix
allowed-tools: Read, Edit, Bash, Glob
---

# /fix $ARGUMENTS

Root cause bul, minimal upstream fix uygula. Semptom değil, neden.

1. `npm run typecheck 2>&1 && npm run lint 2>&1` — hatayı lokalize et
2. `git log --oneline -5` — regresyon kim getirdi?
3. `git diff HEAD~1 -- [hatalı_dosya]` — son değişiklik ne?
4. Hatanın kök nedeni: $ARGUMENTS
5. Minimal fix uygula (tek satır yeterliyse tek satır)
6. Regression test ekle
7. `npm run typecheck && npm run lint && npm run test -- --run` — doğrula
8. `git commit -m "fix: [kısa açıklama]\n\nRoot cause: ...\nFix: ..."`
