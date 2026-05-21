import { test, expect, type Page } from '@playwright/test';

/**
 * Launch smoke suite — runs against a deployed preview (Vercel) or a local
 * `vite preview`. Target is driven by PREVIEW_URL via the baseURL in
 * scripts/qa/playwright.preview.config.ts, so every goto here is relative.
 *
 * Selectors are verified against the live components, NOT assumed:
 *  - The mounted banner is src/components/CookieBanner.tsx
 *    (data-testid="cookie-banner", reject = data-testid="cookie-reject-all").
 *  - It reads consent from lib/consent-v1 (key "ecypro_consent_v1"); the banner
 *    only renders when that key is absent, so the consent tests clear storage.
 */

async function clearConsent(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* storage blocked — banner will show anyway */
    }
  });
}

test.describe('eCyPro launch smoke', () => {
  test('Home loads and the cookie banner appears for a fresh visitor', async ({ page }) => {
    await clearConsent(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/eCyPro/i);
    await expect(page.getByTestId('cookie-banner')).toBeVisible({ timeout: 5000 });
  });

  test('Quick-Check page renders its KVKK heading', async ({ page }) => {
    await page.goto('/quick-check');
    await expect(page.locator('h1')).toContainText(/KVKK/i);
  });

  test('Pricing Calculator page renders its heading', async ({ page }) => {
    await page.goto('/pricing-calculator');
    // Hardcoded TR copy: "Hangi paket size uygun?"
    await expect(page.locator('h1')).toContainText(/paket|pricing|fiyat/i);
  });

  test('Rejecting cookies leaves no GA (_ga) cookie behind', async ({ page }) => {
    await clearConsent(page);
    await page.goto('/');
    await page.getByTestId('cookie-reject-all').click();
    // Give any (incorrectly) fired analytics a beat to write a cookie.
    await page.waitForTimeout(1000);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name.startsWith('_ga'))).toBeUndefined();
  });
});

test.describe('eCyPro touch targets (mobile)', () => {
  // The global CSS enforces a 44×44 minimum on real buttons under a coarse
  // pointer / ≤768px (WCAG 2.1 AAA), so audit in a mobile viewport. Scope to
  // buttons + role=button — inline text links are intentionally exempt.
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('All visible buttons meet the 44px tap-target height', async ({ page }) => {
    await page.goto('/');
    const targets = page.locator('button:visible, [role="button"]:visible');
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);
    const undersized: string[] = [];
    for (let i = 0; i < count; i++) {
      const el = targets.nth(i);
      const box = await el.boundingBox();
      if (box && box.height > 0 && box.height < 43.5) {
        undersized.push(`${(await el.innerText()).trim().slice(0, 32)} → ${box.height}px`);
      }
    }
    expect(undersized, `Undersized tap targets:\n${undersized.join('\n')}`).toEqual([]);
  });
});
