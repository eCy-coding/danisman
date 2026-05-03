 

import { test, expect } from '@playwright/test';

test.describe('Content Engine (Keystatic)', () => {

  test('Case Studies page loads seed content', async ({ page }) => {
    test.setTimeout(90000);
    // 1. Navigate
    await page.goto('/case-studies', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 2. Check actual h1 ('Başarı Hikayeleri' in Turkish)
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText(/Başarı Hikayeleri|Case Studies/i).first()).toBeVisible();

    // 3. Check seed content from GENERATED_CASE_STUDIES (real data)
    await page.waitForLoadState('networkidle');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 8000 });

    // 4. Verify at least one case study card is present
    const cardCount = await page.locator('article').count();
    expect(cardCount).toBeGreaterThan(0);
  });

});
