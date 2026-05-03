 

import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Compatibility & Responsiveness', () => {

  test('Mobile Navigation Works', async ({ page }) => {
    await page.goto('/');
    
    // Check if Hamburger menu is visible (Mobile nav trigger)
    // Assuming standard "Menu" button or icon exists for mobile
    // I need to know the selector. Usually `[aria-label="Menu"]` or `.lucide-menu` or button inside `nav`.
    // I'll search for a button that is visible on mobile but might be hidden on desktop.
    // If generic, I'll look for the nav toggle.
    
    const menuButton = page.getByLabel(/Menu|Menü/i).or(page.locator('button:has(.lucide-menu)'));
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    
    // Verify Mobile Menu Opens
    // Should see "About", "Services", etc. in the mobile drawer.
    // They might be in a dialog or drop-down.
    const mobileNavLink = page.getByRole('link', { name: /Hakkımızda|About/i }).first();
    await expect(mobileNavLink).toBeVisible();
    
    // Navigate
    await mobileNavLink.click();
    await expect(page).toHaveURL(/.*about/);
  });

  test('No Horizontal Scroll (Visual Stability)', async ({ page }) => {
    await page.goto('/services/strategic-management');
    
    // Check viewport width vs scroll width
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow slight buffer for scrollbars but generally should be equal
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('Contact Form is Usable on Mobile', async ({ page }) => {
    await page.goto('/contact');
    
    // Contact form uses InputField with label "Ad Soyad" (no static placeholder)
    const nameInput = page.locator('#contact input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.tap(); // Mobile tap
    await nameInput.fill('Mobile User');
    
    // Submit button in contact form
    const submitBtn = page.locator('#contact button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });
});
