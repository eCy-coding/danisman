---
description: Akıllı git commit — typecheck + lint + conventional message (Türkçe)
allowed-tools: Bash, Read
---

# /commit $ARGUMENTS

Güvenli commit akışı. Önce kalite kapısı, sonra commit.

1. `git status --short` — değişiklikleri gör
2. `npm run typecheck 2>&1 | tail -2 && npm run lint 2>&1 | tail -2` — hata yoksa devam
3. Secret kontrolü: `git diff --cached | grep -i "api_key\|secret\|password\|ANTHROPIC\|token" | head -3`
4. Conventional commit formatı:
   - `feat(scope): Türkçe açıklama` — yeni özellik
   - `fix(scope): Türkçe açıklama` — hata düzeltme
   - `perf(scope): Türkçe açıklama` — performans
   - `test(scope): Türkçe açıklama` — test
   - `chore(scope): Türkçe açıklama` — yapılandırma

5. Commit: `git commit -m "$ARGUMENTS\n\ntypecheck ✅ lint ✅"`

YASAK (Altın Kural deny list): git push --force, git reset --hard, git commit --no-verify
.env, *.db, *.log, *.pid asla commit edilmez.
