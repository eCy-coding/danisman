 
import { test, expect } from '@playwright/test';

test.describe('Phase 13: Grand UI/UX Expansion Pack', () => {

  test.beforeEach(async () => {
    // Shared setup if needed
  });

  test('Batch 1 (Core): Routes Load Successfully', async ({ page }) => {
    // 1. About
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // "Hakkımızda" or "About Us"
    
    // 2. Team
    await page.goto('/team');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 3. Contact
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Also check for the form specifically reused
    await expect(page.locator('#contact form')).toBeVisible();

    // 4. FAQ
    await page.goto('/faq');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Batch 2 (Business): Routes Load Successfully', async ({ page }) => {
    // 5. Careers
    await page.goto('/careers');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 6. Industries
    await page.goto('/industries');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 7. Methodology
    await page.goto('/methodology');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 8. Partners
    await page.goto('/partners');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Batch 3 (Content): Routes Load Successfully', async ({ page }) => {
    test.setTimeout(90000);
    // 9. Case Studies
    await page.goto('/case-studies', { waitUntil: 'domcontentloaded', timeout: 50000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('img').first()).toBeVisible({ timeout: 15000 });

    // 10. Events
    await page.goto('/events', { waitUntil: 'domcontentloaded', timeout: 50000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 11. Locations
    await page.goto('/locations', { waitUntil: 'domcontentloaded', timeout: 50000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });

  test('Batch 4 (Legal/Auth): Routes Load Successfully', async ({ page }) => {
    // 12. Privacy
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 13. Terms
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 14. Cookies
    await page.goto('/cookies');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 15. Login
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Giriş Yap/i })).toBeVisible();

    // 16. Register
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 17. Forgot Password
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

});
