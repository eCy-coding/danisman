 

import { test, expect } from '@playwright/test';

test.describe('Services Ecosystem', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/services');
    });

    test('Loads "Integrated Consulting Ecosystem" page', async ({ page }) => {
        await expect(page.getByText(/Entegre Danışmanlık/)).toBeVisible();
        await expect(page.getByRole('button', { name: /HEPSİ|ALL/i })).toBeVisible();
    });

    test('Department filters work', async ({ page }) => {
        // Default: Show all — use real service titles from services.ts
        await expect(page.getByText('Stratejik Dönüşüm & Kurumsal Planlama')).toBeVisible();
        await expect(page.getByText(/Makroekonomik Risk/)).toBeVisible();

        // Filter: İktisat — Economics dept button
        const iktisatBtn = page.getByRole('button', { name: /İKTİSAT/ });
        if (await iktisatBtn.isVisible()) {
             await iktisatBtn.click();
             await page.waitForTimeout(300);
             // Economics items visible (first() — multiple title refs possible)
             await expect(page.getByText(/Makroekonomik Risk/).first()).toBeVisible();
             // Business items hidden
             await expect(page.getByText('Stratejik Dönüşüm & Kurumsal Planlama').first()).toBeHidden();
        }
    });

    test('Search functionality works', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Hizmetlerde"]');
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
        // Use heading role to avoid invisible mega-menu text matches
        const noResultsEl = page.getByRole('heading', { name: /Sonuç|no_results/i }).or(
          page.locator('.col-span-full h3').filter({ hasText: /Sonuç|no_results/i })
        );
        await expect(noResultsEl.first()).toBeVisible({ timeout: 8000 });
    });
});
