---
description: Bug fix — Root cause first, minimal upstream fix
---

# /fix [hata_açıklaması]

Hata düzeltme protokolü. Semptom değil, kök neden. Tek satır yeterliyse tek satır.

## Adım 1: Hatayı yakala

// turbo
```bash
npm run typecheck 2>&1
npm run lint 2>&1
npm run test -- --run 2>&1 | tail -20
```

## Adım 2: Kök nedeni bul

```bash
grep -rn "ERROR\|error\|Error" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -20
```

E2E fail ise:
```bash
npx playwright test [spec] --project=chromium --reporter=list 2>&1 | tail -30
```

## Adım 3: Lokalize et

Şu soruları sor:
1. Hangi dosya, hangi satır?
2. Ne bekleniyor, ne geliyor?
3. Son hangi değişiklik bu hatayı tetikledi? (`git log --oneline -5`)

## Adım 4: Minimal fix uygula

```bash
git log --oneline -5
git diff HEAD~1 -- [hatalı_dosya]
```

Kurallar:
- Downstream workaround yerine upstream fix
- Minimum satır değişikliği
- Regression test ekle

## Adım 5: Doğrula

// turbo
```bash
npm run typecheck 2>&1 | tail -3 && npm run lint 2>&1 | tail -3
```

## Adım 6: Commit

```bash
git commit -m "fix: [kısa açıklama]

Root cause: [neydi]
Fix: [ne yapıldı]"
```

## Notlar
- Referans: docs/prompts/04-code-review-checklist.md
- Sentry error ise: error.message + stack trace bak
- Type error ise: `tsc --noEmit --strict`
