---
description: Publish öncesi kalite kapısı — lint + typecheck + test + build + e2e:fast.
allowed-tools: Bash(npm run lint *), Bash(npm run typecheck *), Bash(npm run test *), Bash(npm run build *), Bash(npm run test:e2e:fast *), Read(**)
---

# /publish-check

Publish öncesi tam kalite zincirini sırayla çalıştır:

1. `npm run lint` → ESLint clean mi?
2. `npm run typecheck` → strict TS geçiyor mu?
3. `npm run test -- --run` → unit testler tek geçiş.
4. `npm run build` → production build başarılı mı?
5. `npm run test:e2e:fast` → sanity duman testi.

**Her adımda fail varsa dur** — sonraki adıma geçme.

Çıktı formatı (her adım için):
```
[1/5] lint        ✓ pass    (12s)
[2/5] typecheck   ✓ pass    (45s)
[3/5] unit        ✓ pass    (8s)
[4/5] build       ✗ FAIL    → özet hata
```

Tüm adımlar geçerse:
- Toplam süreyi raporla.
- "✓ Publish'e hazır" mesajı ver.
- Sonraki önerilen adım: `/phase-status` ile mevcut phase durumunu kontrol et.

Lighthouse + a11y için: `npm run lh:audit` ve `npx playwright test e2e/a11y.spec.ts`.
