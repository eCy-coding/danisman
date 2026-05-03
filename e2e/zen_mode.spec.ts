import { test, expect } from '@playwright/test';

test.describe('The Zen of Code Features', () => {

  test('Zen Mode Toggle Functionality', async ({ page }) => {
    // 1. Navigate to Home
    await page.goto('/');

    // 2. Locate Zen Toggle
    const zenButton = page.locator('button[aria-label="Enable Zen Mode"]');
    await expect(zenButton).toBeVisible();

    // 3. Activate Zen Mode
    await zenButton.click();

    // 4. Verify HTML class
    const html = page.locator('html');
    await expect(html).toHaveClass(/zen-mode/);

    // 5. Verify Visual Changes (Background became white)
    // We check body background color. 
    // Computed style check
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    // 6. Deactivate Zen Mode
    await page.click('button[aria-label="Disable Zen Mode"]');
    await expect(html).not.toHaveClass(/zen-mode/);
  });

  test('Personalization Hooks (No Crash)', async ({ page }) => {
    // Just verify pages with new hooks load correctly
    await page.goto('/services');
    await expect(page.getByText('Entegre Danışmanlık')).toBeVisible();

    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    // Blog page title is bilingual
    await expect(page.getByText(/İçgörüler|Insights|Blog/i).first()).toBeVisible();
  });

});
