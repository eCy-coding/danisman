 
import { test, expect } from '@playwright/test';

test.describe('Grand Slam Suite: Critical User Flows', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000); 
    await page.goto('/');
  });

  test('Flow 1: Visitor Conversion Verify (Landing -> Contact)', async ({ page }) => {
    // 1. Land on Home
    // Check title or main H1
    await expect(page.locator('h1').first()).toBeVisible();
    
    // 2. Navigate to Contact Section
    // Contact section id="contact"
    const contactSection = page.locator('#contact');
    await expect(contactSection).toBeVisible();
    
    // 3. Verify Form Elements are interactive (Contact.tsx uses id, not name attr)
    const submitBtn = page.locator('#contact button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();

    // Check Inputs by type
    await expect(page.locator('#contact input[type="text"]').first()).toBeVisible();
    await expect(page.locator('#contact input[type="email"]').first()).toBeVisible();
  });

  test('Flow 2: Content Consumption', async ({ page }) => {
    // Check if we have service entries
    // Services section has id="services" in Services.tsx component
    await expect(page.locator('#services, [id="services"]').first()).toBeAttached();

    const articles = page.locator('article');
    if (await articles.count() > 0) {
        const firstArticle = articles.first();
        await expect(firstArticle).toBeVisible();
    }
  });

});
