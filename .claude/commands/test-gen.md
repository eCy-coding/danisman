---
description: Test generation — Vitest unit + Playwright E2E piramit stratejisi
allowed-tools: Read, Edit, Bash, Glob, Write
---

# /test-gen $ARGUMENTS

prompts2/07-testing-strategy.md tabanlı. $ARGUMENTS için test yaz.

1. Mevcut test durumu: `npm run test -- --run 2>&1 | tail -5`
2. $ARGUMENTS'ı oku — component/hook/API route/feature?
3. Test türünü seç (piramit: unit > integration > E2E)
4. Şablon uygula:

**Unit (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
describe('[Module]', () => {
  it('[davranış]', () => {
    const result = fn(input);
    expect(result).toEqual(expected);
  });
});
```

**E2E (Playwright):**
```typescript
import { test, expect } from '@playwright/test';
test('[user story]', async ({ page }) => {
  await page.goto('http://localhost:4173/...');
  await expect(page.locator('h1')).toBeVisible();
});
```

5. `npm run test -- --run 2>&1 | tail -5` doğrula
6. Coverage: `npm run test -- --coverage 2>&1 | grep Lines | tail -2`

Kural: Test silme/zayıflatma yasak. Referans: prompts2/07-testing-strategy.md
