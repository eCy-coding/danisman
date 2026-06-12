import { test, expect } from '@playwright/test';

test.describe('Content Expansion Verification', () => {
  test('Service Detail Page should load correctly', async ({ page }) => {
    // Route: /services/:slug — slug comes from item.link path segment
    await page.goto('/services/strategic-transformation');
    await page.waitForLoadState('networkidle');

    // Expect h1 to be visible (use first() to avoid strict mode)
    await expect(page.locator('h1').first()).toBeVisible();
    // Title matches real data (bilingual regex)
    await expect(
      page.getByRole('heading', { name: /Stratejik Dönüşüm|Strategic Transformation/i }).first(),
    ).toBeVisible();

    // Back link to services exists
    await expect(page.locator('main a').first()).toBeVisible();
  });

  test('Blog Post Page should load correctly', async ({ page }) => {
    // Use real MDX slug from src/content/blog/
    await page.goto('/perspektifler/stratejik-dijital-donusum-2026');
    await page.waitForLoadState('networkidle');

    // Use first() to avoid strict mode violation (MDX may render h1 twice)
    await expect(page.locator('h1').first()).toBeVisible();
    // Check for blog post title
    await expect(page.getByText(/Stratejik Dijital Dönüşüm/i).first()).toBeVisible();
  });

  test('Invalid Service Slug should 404', async ({ page }) => {
    await page.goto('/services/invalid-slug-xyz-99999');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/404|bulunamadı|not found/i).first()).toBeVisible();
  });

  test('Invalid Blog ID should 404', async ({ page }) => {
    await page.goto('/perspektifler/invalid-slug-xyz-99999');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/404|bulunamadı|not found/i).first()).toBeVisible();
  });
});
