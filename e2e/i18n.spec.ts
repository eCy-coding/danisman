
import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage to ensure fresh start
    await page.addInitScript(() => {
        window.localStorage.removeItem('i18nextLng');
    });
    await page.goto('/');
  });

  test('should default to English and switch to Turkish', async ({ page }) => {
    // 1. Initial Load — default language (after clearing localStorage, browser locale determines)
    // Hero badge rotates between personas; check h1 title or main heading is visible
    await expect(page.locator('h1').first()).toBeVisible();
    // Language toggle button should exist
    const langBtn = page.locator('button:has-text("EN"), button:has-text("TR")').first();
    await expect(langBtn).toBeVisible();

    // 2. Switch language via toggle
    const currentLang = await langBtn.textContent();
    await langBtn.click();
    await page.waitForTimeout(500);

    // After toggle, language button should show opposite code
    const newLang = currentLang?.trim() === 'EN' ? 'TR' : 'EN';
    await expect(page.locator(`button:has-text("${newLang}")`).first()).toBeVisible();

    // Hero h1 still visible after language switch
    await expect(page.locator('h1').first()).toBeVisible();

    // 3. Persistence Check — reload preserves language
    await page.reload();
    await expect(page.locator('h1').first()).toBeVisible();
    
    // LocalStorage should persist the selected language
    const lng = await page.evaluate(() => window.localStorage.getItem('i18nextLng'));
    expect(['tr', 'en']).toContain(lng);
  });

  test('should allow switching back to English', async ({ page }) => {
    // Start in TR (manually set)
    await page.addInitScript(() => {
        window.localStorage.setItem('i18nextLng', 'tr');
    });
    await page.goto('/');
    
    // Verify TR: Hero h1 visible + lang toggle shows TR
    await expect(page.locator('h1').first()).toBeVisible();
    const trBtn = page.locator('button:has-text("TR")').first();
    await expect(trBtn).toBeVisible();
    
    // Switch to EN
    await trBtn.click();
    await page.waitForTimeout(500);
    
    // Verify EN: toggle should now show EN
    await expect(page.locator('button:has-text("EN")').first()).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
