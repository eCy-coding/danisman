---
description: Kod inceleme — docs/prompts/04-code-review-checklist.md tam denetim
allowed-tools: Read, Bash, Glob
---

# /review $ARGUMENTS

docs/prompts/04-code-review-checklist.md standartlarına göre $ARGUMENTS dosyasını incele.

Kontrol sırası:
1. `npm run typecheck && npm run lint` — statik analiz
2. TypeScript strict: `any`, unsafe cast?
3. Error handling: boş catch, bare `except:`?
4. Security: eval, innerHTML, hardcoded secret, SQL injection risk?
5. Performance: N+1 query, missing memo, blocking await?
6. Test coverage: unit test var mı?
7. i18n: Türkçe hard-code string var mı?
8. A11y: aria-label, alt eksik?
9. `git diff HEAD~1 -- $ARGUMENTS` — son değişiklik mantıklı mı?

Çıktı:
```
✅ GEÇEN: [liste]
⚠ UYARI: [liste]
❌ BLOKÖR: [commit öncesi fix lazım]
```
