---
description: Feature implementation — cerrahi hassasiyet ile Sonnet-level kodlama
allowed-tools: Read, Edit, Bash, Glob, Write
---

# /implement $ARGUMENTS

**istek4.txt:** "Kodlamayı Sonnet'i ileri düzey kullanacağın şekilde her zaman"
**istek1.txt:** "Hatalı kodlama yapma, Yarım kodlama yapma! Eksik kod bırakma!"

Adımlar:
1. Önce `npm run typecheck 2>&1 | tail -3` çalıştır — mevcut durum
2. Etkilenecek dosyaları oku (min 3)
3. $ARGUMENTS görevini uygula:
   - Mevcut pattern'ı koru (TypeScript strict, Tailwind v4, shadcn/ui)
   - Import'ları dosya başında tut
   - Minimal değişiklik prensip (cerrahi)
   - TOKEN ZERO: LLM çağrısı smart_router üzerinden
4. `npm run typecheck 2>&1 | tail -3` doğrula
5. `npm run lint 2>&1 | tail -3` doğrula
6. `npm run test -- --run 2>&1 | tail -5` doğrula
7. İlgili E2E testi çalıştır

Commit formatı: `feat(scope): Türkçe açıklama (P[XX]-T[YY])`
