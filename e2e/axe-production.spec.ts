/**
 * e2e/axe-production.spec.ts — Launch-day WCAG 2.1 AA production gate.
 *
 * Runtime, DOM-aware axe-core audit of the 5 highest-traffic Foundation routes
 * across both locales (10 tests). Replaces the static regex scanner approach;
 * surfaces real violations rather than silencing them.
 *
 * Run: npx playwright test e2e/axe-production.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Core pages that MUST pass WCAG 2.1 AA on launch day.
const PATHS = ['/', '/services', '/pricing', '/about', '/contact'];
const LOCALES = ['/tr', '/en'];

// External image hosts that occasionally hang under WebKit's networkidle —
// stubbed out to keep the audit deterministic.
async function stubExternalImages(page: Page): Promise<void> {
  await page.route(/images\.unsplash\.com|via\.placeholder|pexels\.com|picsum\.photos/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );
}

test.describe('eCyPro Production A11y Audit (WCAG 2.1 AA)', () => {
  for (const locale of LOCALES) {
    for (const path of PATHS) {
      const url = locale + (path === '/' ? '' : path);
      test(`axe ${url}`, async ({ page }) => {
        await stubExternalImages(page);
        await page.goto(url);
        // Wait for hydration so dynamic content (CookieBanner, LanguageSwitcher)
        // is in the DOM before the scan.
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          // Third-party Sonner toast container — landmark-unique false positive
          // (documented across a11y.spec.ts, a11y-ci.spec.ts, accessibility.spec.ts).
          .exclude('section[aria-label*="Notifications"]')
          .analyze();
        expect(
          results.violations,
          `A11y violations on ${url}:\n${JSON.stringify(results.violations, null, 2)}`,
        ).toEqual([]);
      });
    }
  }
});
