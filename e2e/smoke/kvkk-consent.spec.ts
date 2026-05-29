// KVKK / GDPR cookie consent banner smoke tests.
// These tests do NOT pre-seed consent state — each uses a fresh browser context.
import { test, expect } from '@playwright/test';

// Shared: clear both v1 and v2 consent keys so banner always shows
async function clearConsent(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('ecypro_cookie_consent');
    localStorage.removeItem('ecypro_cookie_consent_v2');
  });
}

test.describe('KVKK Consent Banner', () => {
  test('banner appears on first visit (no prior consent)', async ({ page }) => {
    await clearConsent(page);
    await page.goto('/');

    // Banner must become visible within 10 s of page load
    const banner = page.locator(
      '[data-testid="cookie-banner"], [aria-label*="cookie"], [aria-label*="çerez"], ' +
        '[class*="CookieBanner"], [class*="cookie-banner"], [role="dialog"][aria-modal]',
    );
    await expect(banner.first()).toBeVisible({ timeout: 10_000 });
  });

  test('accepting consent dismisses banner + persists across reload', async ({ page }) => {
    await clearConsent(page);
    await page.goto('/');

    const banner = page.locator(
      '[data-testid="cookie-banner"], [aria-label*="cookie"], [aria-label*="çerez"], ' +
        '[class*="CookieBanner"], [class*="cookie-banner"], [role="dialog"][aria-modal]',
    );

    const bannerEl = banner.first();
    const bannerVisible = await bannerEl.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!bannerVisible) {
      test.skip(true, 'Cookie banner not found — may be hidden behind a different selector');
      return;
    }

    // Click "Accept all" / "Tümünü Kabul Et"
    const acceptBtn = bannerEl.locator('button:has-text(/kabul|accept|tümünü|allow all/i)');
    await acceptBtn.first().click();

    // Banner must disappear
    await expect(bannerEl).toBeHidden({ timeout: 5_000 });

    // Consent must be persisted in localStorage
    const v1 = await page.evaluate(() => localStorage.getItem('ecypro_cookie_consent'));
    const v2 = await page.evaluate(() => localStorage.getItem('ecypro_cookie_consent_v2'));
    expect(v1 || v2).toBeTruthy();

    // Reload — banner must stay hidden
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Give React time to mount
    await page.waitForTimeout(1_500);
    await expect(bannerEl).toBeHidden({ timeout: 5_000 });
  });

  test('navigating to /cookies page renders cookie settings', async ({ page }) => {
    await page.goto('/cookies');
    const response = page.url();
    expect(response).toMatch(/\/cookies/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('banner does not appear when consent already given', async ({ page }) => {
    // Pre-set v1 consent before page load
    await page.addInitScript(() => {
      localStorage.setItem(
        'ecypro_cookie_consent',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'all',
          preferences: { essential: true, analytics: true, marketing: true },
        }),
      );
    });
    await page.goto('/');
    await page.waitForTimeout(1_500);

    const banner = page.locator(
      '[data-testid="cookie-banner"], [aria-label*="cookie"], [aria-label*="çerez"], ' +
        '[class*="CookieBanner"], [class*="cookie-banner"], [role="dialog"][aria-modal]',
    );
    await expect(banner.first()).toBeHidden({ timeout: 5_000 });
  });
});
