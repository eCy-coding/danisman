---
description: Akıllı git commit — typecheck + lint + conventional message
---

# /commit-smart [açıklama]

Güvenli commit akışı. Önce kontrol, sonra commit.

## Adım 1: Durum

// turbo
```bash
git status --short
git diff --stat
```

## Adım 2: Kalite kapısı

// turbo
```bash
npm run typecheck 2>&1 | tail -2
npm run lint 2>&1 | tail -2
```

Hata varsa → dur. /fix workflow'u.

## Adım 3: Değişiklikleri stage et

```bash
git add [dosyalar]
# NOT: .env, *.db, *.log, *.pid asla stage edilmez (Altın Kural 6)
```

## Adım 4: Commit mesajı (Conventional Commits)

Format: `<type>(<scope>): <kısa açıklama>` (Türkçe)

Types:
- `feat` — yeni özellik
- `fix` — hata düzeltme
- `perf` — performans
- `test` — test ekleme/düzenleme
- `refactor` — yeniden yapılandırma
- `docs` — dokümantasyon
- `ci` — CI/CD değişikliği
- `chore` — yapılandırma

Örnek:
```bash
git commit -m "feat(crawl-e2e): Conversion funnel E2E eklendi (P34-T31)

- CTA presence 5 kritik sayfa
- GA4 dataLayer init doğrulama
- ROI Calculator funnel
typecheck ✅ lint ✅ test:crawl 160/160 ✅"
```

## Adım 5: Güvenlik kontrol (Altın Kural 6)

```bash
git diff --cached | grep -i "api_key\|secret\|password\|token" | head -5
```

Çıktı varsa → dur, commit etme!

## Notlar
- git push --force YASAK (Altın Kural deny list)
- Lefthook pre-push: typecheck + build otomatik çalışır
- gitleaks secret sızıntısını yakalar
