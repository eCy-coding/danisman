---
description: Publish öncesi tam kalite zinciri (lint + typecheck + test + build + e2e:fast)
---

EcyPro publish öncesi kalite kapısı. Her adım sıralı; biri fail ederse dur.

## Adımlar

1. Lint:
// turbo
```bash
npm run lint
```

2. TypeCheck (web + server):
// turbo
```bash
npm run typecheck
```

3. Unit testler (tek geçiş, watch yok):
// turbo
```bash
npm run test -- --run
```

4. Production build:
```bash
npm run build
```

5. E2E sanity duman testi:
```bash
npm run test:e2e:fast
```

## Karar Mantığı

- Herhangi bir adım fail ederse:
  - Sonraki adıma **geçme**.
  - Hata özetini ver.
  - Kök neden tahmini ve önerilen düzeltmeyi paylaş.
  - Kullanıcıya sor: düzeltmeyi ben yapayım mı?

- Tüm adımlar geçerse:
  - Toplam süre.
  - "✓ Publish'e hazır" mesajı.
  - Sonraki önerilen adım: a11y + lighthouse.
    ```bash
    npx playwright test e2e/a11y.spec.ts --project=chromium
    npm run lh:audit
    ```

## Notlar

- `lefthook.yml` zaten pre-push'ta `typecheck + build` koşturuyor — bu workflow ek olarak unit + e2e:fast ekler.
- `gitleaks` her commit'te çalışır → secret commit edilemez.
