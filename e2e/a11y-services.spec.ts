/**
 * SVC GATE-9 — axe pass for the Services vertical (B6 budget:
 * 0 serious/critical on /services + 3 sampled detail pages + open mega menu).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'services index', path: '/services' },
  { name: 'detail — pillar (mergers-acquisitions)', path: '/services/mergers-acquisitions' },
  { name: 'detail — new entry (company-valuation)', path: '/services/company-valuation' },
  { name: 'detail — adopted orphan (payroll-audit)', path: '/services/payroll-audit' },
];

const scan = async (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // Same documented exclusions as e2e/a11y.spec.ts (CSS-var contrast false
    // positives + 3rd-party toast landmark + WCAG 2.2 target-size backlog).
    .exclude('section[aria-label*="Notifications"]')
    .exclude('.bg-secondary')
    .exclude('.bg-white.text-neutral')
    .disableRules(['target-size'])
    .analyze();

test.describe('SVC a11y — services surfaces', () => {
  for (const { name, path } of PAGES) {
    test(`${name} has zero serious/critical violations`, async ({ page }) => {
      test.setTimeout(120000);
      await page.goto(path);
      await page.waitForTimeout(1500);
      const results = await scan(page);
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      if (blocking.length) {
        console.error(`${name} violations:`, JSON.stringify(blocking, null, 2));
      }
      expect(blocking).toEqual([]);
    });
  }

  test('open services mega menu has zero serious/critical violations', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    // webkit: focus() alone does not reliably open the panel — use the
    // product's primary hover-intent path, fall back to focus.
    const trigger = page.getByTestId('navbar-link-services');
    await trigger.hover();
    const panel = page.getByTestId('mega-menu-services');
    try {
      await expect(panel).toBeVisible({ timeout: 3000 });
    } catch {
      await trigger.focus();
      await expect(panel).toBeVisible();
    }
    const results = await new AxeBuilder({ page })
      .include('[data-testid="mega-menu-services"]')
      // Same documented page-level exclusions as e2e/a11y.spec.ts — if the
      // engine widens the scan past include(), the known CSS-var contrast
      // false-positives (hero CTA gold-on-black is really 14.8:1) must not
      // fail this menu-scoped test.
      .exclude('[data-testid="hero-cta-primary"]')
      .exclude('.bg-secondary')
      .exclude('.bg-white.text-neutral')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .disableRules(['target-size'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    if (blocking.length) {
      console.error('menu violations:', JSON.stringify(blocking, null, 2));
    }
    expect(blocking).toEqual([]);
  });
});
