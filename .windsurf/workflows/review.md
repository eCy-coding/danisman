---
description: Kod inceleme — docs/prompts/04-code-review-checklist.md tam denetim
---

# /review [dosya_veya_diff]

Cerrahi kod incelemesi. Önce typecheck/lint, sonra mantık, sonra güvenlik.

## Adım 1: Statik analiz

// turbo
```bash
npm run typecheck 2>&1 | tail -5
npm run lint 2>&1 | tail -5
```

## Adım 2: Son değişiklikleri oku

// turbo
```bash
git diff HEAD~1 --stat
git log --oneline -5
```

## Adım 3: Kod kalitesi kontrol listesi (docs/prompts/04)

Şu sorular sırayla:
1. TypeScript strict mode: `any` var mı? `as X` cast zorunlu mu?
2. Error handling: `catch (e) {}` boş mu? `console.error` yerine logger var mı?
3. Security: user input sanitize edildi mi? SQL injection var mı? env key hard-code mu?
4. Performance: `useEffect` dep array doğru mu? `useMemo` gerekli mi? DB N+1 var mı?
5. Test: unit test yazıldı mı? E2E coverage var mı?
6. i18n: Türkçe string hard-code mu? `t('key')` kullanılmış mı?
7. A11y: `aria-label`, `alt`, `role` eksik mi?

## Adım 4: Güvenlik audit (P35 eşleştirme)

```bash
grep -rn "eval(\|innerHTML\|dangerouslySetInnerHTML" src/ | head -5
grep -rn "process.env\." src/ | grep -v "VITE_\|NODE_ENV" | head -5
```

## Adım 5: Rapor

Format:
```
✅ GEÇEN: [liste]
⚠ UYARI: [liste]
❌ BLOKÖR: [liste — commit öncesi düzeltilmeli]
ÖNERI: [tek paragraf]
```

## Notlar
- Referans: docs/prompts/04-code-review-checklist.md
- Blokör varsa /fix workflow'una geç
