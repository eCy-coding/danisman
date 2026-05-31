# EcyPro — Test Stratejisi (Test Pyramid)
# Durum: Vitest 29/29 + E2E 285/285 (3 browser) ✅
# ─────────────────────────────────────────────────────────

## Test Piramidi

```
        ┌─────────────┐
        │    E2E      │  285 test  ← Playwright (chromium/firefox/webkit)
        │  (10-15%)   │
        ├─────────────┤
        │ Integration │   ~5 test  ← API + DB integration
        │  (10-20%)   │
        ├─────────────┤
        │   Unit      │  29 test   ← Vitest (pure functions, hooks)
        │  (70-80%)   │
        └─────────────┘
```

## Unit Testler (Vitest)

### Test Konumu
```
src/
├── __tests__/                 ← Genel test
├── components/
│   └── ui/__tests__/          ← Component test
└── lib/
    └── __tests__/             ← Utility test

server/
├── controllers/*.test.ts      ← Backend controller test
```

### Örnek Pattern
```typescript
// src/lib/__tests__/utility.test.ts
import { describe, it, expect } from 'vitest';
import { utilityFunction } from '../utility';

describe('utilityFunction', () => {
  it('expected behavior', () => {
    expect(utilityFunction(input)).toBe(expected);
  });

  it('edge case: empty input', () => {
    expect(utilityFunction('')).toBe('');
  });

  it('error case: invalid input throws', () => {
    expect(() => utilityFunction(null)).toThrow();
  });
});
```

### Çalıştırma
```bash
npm test                # Watch mode
npm test -- --run       # Tek sefer (CI için)
npm test -- --coverage  # Coverage raporu
```

## E2E Testler (Playwright)

### Spec Konumu
```
e2e/
├── sanity_check.spec.ts       ← Hızlı smoke test
├── critical_flows.spec.ts     ← Kritik kullanıcı akışları
├── navigation.spec.ts         ← Nav + routing
├── newsletter.spec.ts         ← Newsletter form
├── ai_assessment.spec.ts      ← AI quiz akışı
├── interactive_core.spec.ts   ← Growth Calc + Booking + Quiz
├── case_studies.spec.ts       ← Case study filter
├── content.spec.ts            ← İçerik yükleme
├── services-filter.spec.ts    ← Services search
├── zen_mode.spec.ts           ← Zen + Personalization
├── mobile_compatibility.spec.ts ← iPhone 12 viewport
├── resilience.spec.ts         ← Error boundary + offline
├── conversion-elements.spec.ts ← CTA'lar
├── expansion_pack.spec.ts     ← Batch routing
├── api_integration.spec.ts    ← API entegrasyonu
├── comprehensive_audit.spec.ts ← Cross-browser audit
├── spider.spec.ts             ← Link spider (HTTP health)
├── runtime_perfection.spec.ts ← Runtime errors
└── mocks/
    └── external-apis.ts       ← Mock server stub'ları
```

### Stabil Selector Öncelik Sırası

```typescript
// 1️⃣ Best — data-testid
await page.getByTestId('newsletter-submit').click();

// 2️⃣ Good — Role + accessible name
await page.getByRole('button', { name: 'Gönder' }).click();

// 3️⃣ OK — Label
await page.getByLabel('E-posta').fill('test@example.com');

// 4️⃣ Fragile — Text content (bilingual regex kullan)
await page.getByText(/Anlaşıldı|Understood/).click();

// ❌ AVOID — CSS selector (kırılgan)
await page.locator('.btn-primary').click();
```

### Kritik Konfigürasyon (playwright.config.ts)
```typescript
use: {
  baseURL: 'http://localhost:4173',
  serviceWorkers: 'block',        // SW mock intercept fix
  trace: 'on-first-retry',
  video: 'retain-on-failure',
  storageState: {                  // Cookie consent pre-seed
    cookies: [],
    origins: [{
      origin: 'http://localhost:4173',
      localStorage: [
        { name: 'ecypro_cookie_consent', value: '{"type":"all",...}' }
      ]
    }]
  },
},
expect: { timeout: 8000 },
timeout: 60_000,
workers: 4,
```

### Yaygın E2E Hataları & Çözümleri

| Hata | Çözüm |
|------|-------|
| `networkidle` timeout (Unsplash) | Image mock + `domcontentloaded` + `waitForTimeout(500)` |
| Service Worker intercept | `serviceWorkers: 'block'` config |
| Strict mode: 3 elements | `.first()` veya daha spesifik selector |
| `invisible` element text match | `getByRole('heading')` + filter |
| Flaky: animation timing | `waitForTimeout(800)` AnimatePresence için |

## Çalıştırma Komutları

```bash
# Tek browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Tek spec
npx playwright test e2e/sanity_check.spec.ts

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Rapor göster
npx playwright show-report
```

## CI Entegrasyonu (.github/workflows/ci.yml)

```yaml
- name: E2E Test
  run: |
    npx playwright install --with-deps chromium
    npm run build
    npx playwright test --project=chromium
  env:
    CI: true
```

## FV4 Matriks Hedefi

- **Unit**: 29/29 ✅ (100% yeşil)
- **E2E Chromium**: 95/95 ✅
- **E2E Firefox**: 95/95 ✅
- **E2E WebKit**: 95/95 ✅
- **Toplam**: 285/285 ✅
