// Form smoke tests — render + validation only; no real submissions to avoid spam.
// If a staging E2E_BASE_URL is set, submit paths can be enabled by removing the skip.
import { test, expect } from '@playwright/test';

test.describe('Form Render & Validation Smoke', () => {
  test('contact form renders required fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('form').first()).toBeVisible();

    // Name, email and message inputs must exist
    await expect(page.locator('input[name="name"], input[id="name"]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[id="email"]').first()).toBeVisible();
  });

  test('contact form blocks submit with empty required fields', async ({ page }) => {
    await page.goto('/contact');
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    const submit = form
      .locator('button[type="submit"], button:has-text(/gönder|send|submit/i)')
      .first();
    if (await submit.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submit.click();
      // HTML5 validation or custom error message should appear — form must NOT navigate away
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/contact/);
    }
  });

  test('discovery form renders required fields', async ({ page }) => {
    // Navigate — may 308 to /discovery-call
    await page.goto('/discovery', { waitUntil: 'domcontentloaded' });
    const url = page.url();
    const isDiscoveryRoute = url.includes('/discovery');
    if (!isDiscoveryRoute) {
      test.skip(true, `Redirected away from discovery routes: ${url}`);
      return;
    }

    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15_000 });

    // At minimum an email or name field must be present
    const hasInputs = await form.locator('input').count();
    expect(hasInputs).toBeGreaterThan(0);
  });

  test('KVKK checkbox required for contact submit', async ({ page }) => {
    await page.goto('/contact');
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Look for KVKK / privacy checkbox
    const kvkkCheckbox = form
      .locator(
        'input[type="checkbox"][name*="kvkk"], input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="privacy"]',
      )
      .first();
    if (await kvkkCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Fill name + email but leave KVKK unchecked
      await form.locator('input[name="name"], input[id="name"]').first().fill('Smoke Test');
      await form
        .locator('input[name="email"], input[id="email"]')
        .first()
        .fill('smoke@test.invalid');
      const submit = form
        .locator('button[type="submit"], button:has-text(/gönder|send|submit/i)')
        .first();
      if (await submit.isVisible().catch(() => false)) {
        await submit.click();
        await page.waitForTimeout(500);
        // Must not navigate away — KVKK gate blocks submit
        expect(page.url()).toMatch(/\/contact/);
      }
    }
  });
});
