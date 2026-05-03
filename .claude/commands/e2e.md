---
description: Tam Playwright E2E suite — mock + preview + tüm spec'ler.
allowed-tools: Bash(npm run e2e:local *), Bash(npm run test:e2e *), Bash(npx playwright *), Read(**)
---

# /e2e

E2E test zinciri:

1. **Yerel zincir** (önerilen): `npm run e2e:local`
   - mock-server + vite preview + playwright sırayla başlar.
2. **Sadece test** (sunucular zaten ayaktaysa): `npm run test:e2e`.

Sonuçları yorumla:
- ✓ Tüm testler geçti → `playwright-report/index.html` linkini ver.
- ✗ Fail varsa: ilk fail spec'i belirle, hata bağlamını özetle.
- Kullanıcıya sor: rapor açılsın mı? (`npx playwright show-report`).

Hızlı duman testi için: `/e2e-fast`.
