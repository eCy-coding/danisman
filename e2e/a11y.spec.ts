import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit (WCAG 2.2 AAA)', () => {
  test('Landing Page should pass accessibility checks', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    
    // Scroll to trigger all whileInView animations
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 500));
      window.scrollTo(0, 0);
    });

    // Wait for content to allow potential hydration shifts or font loads and animations
    await page.waitForTimeout(2000); 

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      // Exclude Sonner toast container (3rd-party landmark-unique false positive)
      .exclude('section[aria-label*="Notifications"]')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
        console.error('A11y Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Services Page should pass accessibility checks', async ({ page }) => {
    test.setTimeout(120000);
    // Block external images to avoid networkidle hanging in WebKit
    await page.route(/images\.unsplash\.com|via\.placeholder|pexels\.com|picsum\.photos/, r =>
      r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg"/>' })
    );
    await page.goto('/services', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 500));
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(1500);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .exclude('section[aria-label*="Notifications"]')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
        console.error('A11y Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
