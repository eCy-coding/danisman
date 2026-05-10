---
description: Test generation — Vitest unit + Playwright E2E piramit stratejisi
---

# /test-gen [component_veya_feature]

prompts2/07-testing-strategy.md tabanlı. Test önce, sonra kod.

## Adım 1: Mevcut test durumu

// turbo
```bash
npm run test -- --run 2>&1 | tail -8
npx playwright test --list 2>&1 | wc -l
```

## Adım 2: Hangi test türü gerekli?

Test piramidi (prompts2/07):
```
     /\  E2E (Playwright) — en az, en maliyetli
    /  \ Integration test — API + DB
   /    \ Unit test (Vitest) — en çok, en hızlı
```

- **Unit:** `src/lib/`, `src/hooks/`, `src/utils/` → `*.test.ts`
- **Integration:** `server/routes/` → `*.test.ts` (supertest)
- **E2E:** User journey → `e2e/crawl_*.spec.ts`

## Adım 3: Unit test şablonu (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('[ModuleName]', () => {
  it('[expected behavior]', () => {
    // Arrange
    const input = ...;
    // Act
    const result = fn(input);
    // Assert
    expect(result).toEqual(expected);
  });
});
```

## Adım 4: E2E test şablonu (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('[Feature]', () => {
  test('[user story]', async ({ page }) => {
    await page.goto('http://localhost:4173/path');
    await page.waitForTimeout(400);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Adım 5: Çalıştır

// turbo
```bash
npm run test -- --run 2>&1 | tail -5
```

## Adım 6: Coverage

```bash
npm run test -- --coverage 2>&1 | grep -E "Lines|Stmts" | tail -3
```

## Notlar
- Test silme/zayıflatma yasak (istek1.txt)
- Referans: prompts2/07-testing-strategy.md
- E2E crawl'lar: npm run test:crawl
