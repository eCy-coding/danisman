import { test, expect } from '@playwright/test';

test.describe('Services Ecosystem', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('Loads "Integrated Consulting Ecosystem" page', async ({ page }) => {
    await expect(page.getByText(/Entegre Danışmanlık/)).toBeVisible();
    // "All / Hepsi" filter pill is stable via data-testid (id="all").
    await expect(page.getByTestId('services-filter-all')).toBeVisible();
  });

  test('Department filters work', async ({ page }) => {
    // Default: Show all — use real service titles from services.ts
    await expect(page.getByText('Stratejik Dönüşüm & Kurumsal Planlama')).toBeVisible();
    await expect(page.getByText(/Makroekonomik Risk/)).toBeVisible();

    // Filter: Economics dept — DEPARTMENTS uses id="economics" (formerly İKTİSAT label).
    const economicsBtn = page.getByTestId('services-filter-economics');
    if (await economicsBtn.isVisible()) {
      await economicsBtn.click();
      await page.waitForTimeout(300);
      // Economics items visible (first() — multiple title refs possible)
      await expect(page.getByText(/Makroekonomik Risk/).first()).toBeVisible();
      // Business items hidden
      await expect(page.getByText('Stratejik Dönüşüm & Kurumsal Planlama').first()).toBeHidden();
    }
  });

  test('Search functionality works', async ({ page }) => {
    const searchInput = page.getByTestId('services-search-input');
    await searchInput.fill('İnsan');
    await page.waitForTimeout(300);

    // Verify: HR service appears (first() to avoid strict mode with duplicate labels)
    await expect(page.getByText(/İnsan Kaynakları/).first()).toBeVisible();
    // Verify: non-HR service hides
    await expect(page.getByText('Stratejik Dönüşüm & Kurumsal Planlama')).toBeHidden();

    // Empty/No Results Search
    await searchInput.fill('NonExistentService12345XYZ');
    // Wait for AnimatePresence + motion entry animation to complete
    await page.waitForTimeout(1200);
    // No-results heading is now stable via data-testid (avoids invisible mega-menu false-positives).
    await expect(page.getByTestId('services-no-results')).toBeVisible({ timeout: 8000 });
  });
});
