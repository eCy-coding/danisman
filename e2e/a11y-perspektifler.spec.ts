/**
 * GATE-6 — axe-core on the Perspektifler vertical: hub, category pillar,
 * article, and the open mega-menu state. 0 critical/serious violations.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ viewport: { width: 1366, height: 900 } });

const scan = async (page: import('@playwright/test').Page, label: string, include?: string) => {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (blocking.length) {
    console.warn(
      `[axe:${label}]`,
      JSON.stringify(blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))),
    );
  }
  expect(blocking, `${label}: critical/serious axe violations`).toEqual([]);
};

test.describe('GATE-6 axe — perspektifler vertical', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('exit_intent_shown', '1');
    });
  });

  test('hub', async ({ page }) => {
    await page.goto('/perspektifler');
    await page.waitForLoadState('networkidle');
    await scan(page, 'hub');
  });

  test('category pillar', async ({ page }) => {
    await page.goto('/perspektifler/kategori/strateji');
    await page.waitForLoadState('networkidle');
    await scan(page, 'category');
  });

  test('article', async ({ page }) => {
    await page.goto('/perspektifler/stratejik-dijital-donusum-2026');
    await page.waitForLoadState('networkidle');
    await scan(page, 'article');
  });

  test('open mega-menu state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="navbar-link-insights"]').focus();
    await expect(page.locator('[data-testid="mega-menu-insights"]')).toBeVisible();
    // Scoped to the nav+panel: the open-menu criterion audits the MENU. The
    // homepage hero behind the backdrop carries a pre-existing contrast debt
    // (slate-400 on gold CTA) — logged in OUT_OF_SCOPE.md, not this vertical.
    await scan(page, 'open-menu', 'nav[aria-label="Ana Navigasyon"]');
  });
});
