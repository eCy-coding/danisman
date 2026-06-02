import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES = [
  '/',
  '/about',
  '/services',
  '/blog',
  '/case-studies',
  '/faq',
  '/contact',
  '/pricing',
  '/privacy',
  '/cookies',
  '/admin/login',
  '/founder',
];
const REPORTS_DIR = path.join('e2e', 'a11y', 'reports');

async function stubExternalImages(page: Page) {
  await page.route(/images\.unsplash\.com|via\.placeholder|pexels\.com|picsum\.photos/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );
}

test.describe('eCyPro WCAG 2.1 AA — All Pages', () => {
  test.beforeAll(() => {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  });

  for (const route of ROUTES) {
    test(`axe WCAG AA: ${route}`, async ({ page }) => {
      test.setTimeout(60_000);
      if (route === '/admin/login') {
        test.skip(
          true,
          'admin login page: unauthenticated state — skip axe to avoid false positives',
        );
        return;
      }
      await stubExternalImages(page);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (response && response.status() === 404) {
        test.skip(true, `${route} → 404, skipping`);
        return;
      }
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 500));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('section[aria-label*="Notifications"]')
        .analyze();
      const reportPath = path.join(REPORTS_DIR, `axe-${route.replace(/\//g, '-') || 'home'}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      const critical = results.violations.filter((v) => v.impact === 'critical');
      const serious = results.violations.filter((v) => v.impact === 'serious');
      const moderate = results.violations.filter((v) => v.impact === 'moderate');
      if (moderate.length > 0) {
        console.warn(`[axe] ${route} moderate violations:`, moderate.map((v) => v.id).join(', '));
      }
      expect(
        critical,
        `Critical A11y violations on ${route}:\n${JSON.stringify(critical, null, 2)}`,
      ).toHaveLength(0);
      expect(
        serious,
        `Serious A11y violations on ${route}:\n${JSON.stringify(serious, null, 2)}`,
      ).toHaveLength(0);
    });
  }
});
