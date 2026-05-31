---
description: Feature implementation — Sonnet-level kodlama iş akışı
---

# /implement [görev]

**İstek4.txt:** "Kodlamayı Sonnet'i ileri düzey kullanacağın şekilde her zaman her işlemde"
Cerrahi hassasiyet ile feature uygulama. Önce oku, sonra yaz, sonra doğrula.

## Adım 1: Mevcut durumu oku

```bash
npm run typecheck 2>&1 | tail -3
npm run lint 2>&1 | tail -3
```

## Adım 2: İlgili dosyaları tara

Görev için etkilenecek dosyaları oku. Min 3 dosya:
- `src/` → component / hook / page
- `server/` → API endpoint / middleware
- `e2e/` → ilgili test spec

## Adım 3: Uygula (cerrahi)

Kurallar (istek1.txt):
- "Hatalı kodlama yapma, Yarım kodlama yapma! Eksik kod bırakma!"
- Minimal değişiklik — sadece gerekli satırları düzenle
- Mevcut pattern'ı koru (TypeScript strict, Tailwind v4, shadcn/ui)
- Import'lar dosya başında
- TOKEN ZERO kuralı: LLM çağrısı smart_router üzerinden

## Adım 4: Doğrula

// turbo
```bash
npm run typecheck 2>&1 | tail -3
```

// turbo
```bash
npm run lint 2>&1 | tail -3
```

// turbo
```bash
npm run test -- --run 2>&1 | tail -5
```

## Adım 5: E2E kontrol

```bash
npx playwright test e2e/[ilgili_spec].spec.ts --project=chromium --reporter=dot 2>&1 | tail -5
```

## Adım 6: Commit

SwarmBus bildir + commit:
```bash
git add [dosyalar]
git commit -m "feat(phase-XX): [görev açıklaması]

roadmap_XX.md P3X-TXX tamamlandı
typecheck ✅ lint ✅"
```

## Notlar
- Referans: docs/prompts/02-feature-implementation.md
- Hata durumunda /fix workflow'una geç
- Phase tamamlandıysa: /phase-close ile kapat
