/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test.describe('Consulting Real-Time Features', () => {
  test('should display live viewer count on service page', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    
    // 1. Store clean state
    await page.addInitScript(() => {
        localStorage.setItem('ecypro-lang', 'en');
    });
    await page.goto('/services/strategic-transformation');
    
    // 2. Wait for page load (bilingual title)
    await expect(page.getByText(/Stratejik Dönüşüm|Strategic Transformation/i).first()).toBeVisible({ timeout: 8000 });

    // 3. Check for Live Tracker presence
    const trackerText = page.locator('text=/\\d+ Live Viewers/');
    await expect(trackerText).toBeVisible({ timeout: 10000 });
  });
});
