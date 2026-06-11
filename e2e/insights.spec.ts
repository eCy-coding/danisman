/**
 * MIGRATED (Gate-6): this spec used to exercise the mock /insights prototype
 * (deleted — istek.md v2 R-3). It now asserts the legacy URL contract: every
 * retired /insights* URL lands on the canonical hub in ONE client hop.
 */
import { test, expect } from '@playwright/test';

const LEGACY_URLS = [
  '/insights',
  '/insights/some-old-article',
  '/insights/tag/esg',
  '/insights/series/ma-playbook/2',
  '/insights/author/emre-can-yalcin',
  '/insights/archive/2026/01',
  '/insights/search',
];

test.describe('legacy /insights URLs → canonical hub', () => {
  for (const url of LEGACY_URLS) {
    test(`${url} lands on /perspektifler`, async ({ page }) => {
      await page.goto(url);
      await page.waitForURL('**/perspektifler');
      await expect(page.locator('h1')).toContainText('Perspektifler');
    });
  }
});
