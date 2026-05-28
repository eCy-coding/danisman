import { test, expect } from '@playwright/test';

test.describe('ROI Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // ROI Calculator moved from homepage to /pricing
    await page.goto('/pricing');
  });

  test('should calculate ROI correctly based on inputs', async ({ page }) => {
    // Wait for network idle to ensure scripts loaded
    await page.waitForLoadState('networkidle');

    // Check if main content exists
    await expect(page.locator('#main-content')).toBeVisible();

    // Wait for calculator to be visible
    const calculator = page.locator('text=Yatırım Getirisi Hesaplayıcı');

    // Scroll to it to trigger animations if any
    await calculator.scrollIntoViewIfNeeded();

    // Check if Inputs exist
    await expect(page.locator('input[name="revenue"]')).toBeVisible();
    await expect(page.locator('input[name="efficiencyGain"]')).toBeVisible();
    await expect(page.locator('input[name="cost"]')).toBeVisible();
    await expect(page.locator('input[name="efficiencyGain"]')).toBeVisible();
    await expect(page.locator('input[name="cost"]')).toBeVisible();

    // Default Values Check (1.000.000 / 20% / 50.000)
    // ROI = ((1.000.000 * 1.2 - 1.000.000) - 50.000) / 50.000 * 100 = 300%
    // Profit = 200.000 - 50.000 = 150.000

    // Wait for the calculation result to appear
    await expect(page.locator('text=%300')).toBeVisible();

    // Change Efficiency to 50%
    await page.fill('input[name="efficiencyGain"]', '50');

    // New Calculation
    // ROI = 900%

    await expect(page.locator('text=%900')).toBeVisible();
  });
});
