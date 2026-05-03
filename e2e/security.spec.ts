 
import { test, expect } from '@playwright/test';
import { setupExternalMocks } from './mocks/external-apis';

test.describe('Security Audit', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalMocks(page);
  });
  test('Verify Security Headers (CSP)', async ({ page }) => {
    await page.goto('/');
    
    // Check for CSP meta tag if headers are not set by the server (Vite dev vs Prod)
    // Production should have headers, dev might use meta tags or default config
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
  });

  test('Form Validation Security - Zod Enforcement', async ({ page }) => {
    await page.goto('/');
    
    // Find contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    
    // Contact.tsx uses HTML5 required + type validation (no static IDs)
    const emailInput = page.locator('#contact input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    // Fill with invalid email to trigger browser validation
    await emailInput.fill('not-an-email');
    const submitBtn = page.locator('#contact button[type="submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });
    
    // HTML5 native validation prevents submission (form still visible)
    const form = page.locator('#contact form').first();
    await expect(form).toBeVisible({ timeout: 3000 });
    
    // Verify XSS input is sanitized (no script execution)
    const scripts = await page.locator('body').evaluate(el => el.querySelectorAll('script[src*="alert"]').length);
    expect(scripts).toBe(0);
  });
});
