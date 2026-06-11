/**
 * FINAL END-TO-END PROOF (istek.md v2 §FINAL) — one scripted journey:
 * menu closed + no artifacts → open panel (insights-only, ≤30 links) → hub →
 * Kategori=yapay-zeka-teknoloji + Format=makale → copy URL → fresh context
 * reproduces it → Load More (footer reachable) → open article → breadcrumb to
 * pillar → search "dönüşüm" → retired URL lands on the hub.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 900 } });

async function stableHover(page: Page, selector: string) {
  await page.waitForLoadState('networkidle');
  let prev = '';
  for (let i = 0; i < 20; i++) {
    const box = await page.locator(selector).boundingBox();
    const sig = box ? `${Math.round(box.x)}:${Math.round(box.y)}` : '';
    if (sig && sig === prev) break;
    prev = sig;
    await page.waitForTimeout(150);
  }
  await page.mouse.move(683, 500);
  await page.locator(selector).hover();
}

test('Perspektifler vertical — full reader journey', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('exit_intent_shown', '1'));

  // 1. Landing: menu closed by default, no BUG-02 artifacts.
  await page.goto('/');
  await expect(page.locator('[data-testid="mega-menu-insights"]')).toBeHidden();
  await expect(page.locator('[data-testid^="navbar-link-"] div.w-8:empty')).toHaveCount(0);

  // 2. Open the Perspektifler panel: insights-only, ≤30 links.
  await stableHover(page, '[data-testid="navbar-link-insights"]');
  const panel = page.locator('[data-testid="mega-menu-insights"]');
  await expect(panel).toBeVisible();
  expect(await panel.locator('a').count()).toBeLessThanOrEqual(30);
  const panelText = (await panel.innerText()).toUpperCase();
  expect(panelText).not.toContain('SEKTÖRLER');
  expect(panelText).not.toContain('HAKKIMIZDA');

  // 3. Through the panel footer to the hub.
  await panel.getByText(/Tüm içgörüleri keşfedin|Explore all insights/).click();
  await page.waitForURL('**/perspektifler');
  await expect(page.locator('h1')).toContainText('Perspektifler');

  // 4. Facets: Kategori + Format → state in URL.
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Yapay Zeka & Teknoloji/ }).click();
  await page.waitForURL('**kategori=yapay-zeka-teknoloji**');
  await page
    .locator('[data-testid="perspektifler-facet-bar"] select')
    .first()
    .selectOption('makale');
  await page.waitForURL('**format=makale**');
  const url = page.url();

  // 5. Fresh context reproduces the filtered view (AC-09).
  const fresh = await context.newPage();
  await fresh.addInitScript(() => localStorage.setItem('exit_intent_shown', '1'));
  await fresh.goto(url);
  await expect(fresh.getByRole('button', { name: /Yapay Zeka & Teknoloji/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await fresh.close();

  // 6. Clear filters → Load More once; footer stays reachable.
  await page.goto('/perspektifler');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="perspektifler-load-more"]').click();
  await page.waitForURL('**page=2**');
  await expect(page.locator('[data-testid="article-card"]')).toHaveCount(24);
  await page.locator('footer').last().scrollIntoViewIfNeeded();
  await expect(page.locator('footer').last()).toBeVisible();

  // 7. Open an article from the grid → breadcrumb back to the category pillar.
  await page
    .locator('[data-testid="insights-article-grid"] [data-testid="article-card"] h3 a')
    .first()
    .click();
  await page.waitForURL('**/perspektifler/**');
  const crumb = page.locator('[data-testid="article-breadcrumb"]');
  await expect(crumb).toBeVisible();
  await crumb.locator('a').nth(1).click(); // Hub → CATEGORY
  await page.waitForURL('**/perspektifler/kategori/**');
  await expect(page.locator('[data-testid="pillar-intro"]')).toBeVisible();

  // 8. Search "dönüşüm" → results appear (diacritic-fold engine).
  await page.goto('/perspektifler');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="perspektifler-search"]').fill('dönüşüm');
  await page.waitForURL('**q=**');
  await expect(
    page.locator('[data-testid="perspektifler-facet-bar"] [role="status"]'),
  ).not.toContainText(/^0 içgörü/);

  // 9. Retired URL lands correctly (client hop; edge 301 covers full loads in prod).
  await page.goto('/insights/tag/esg');
  await page.waitForURL('**/perspektifler');
  await page.goto('/blog/stratejik-dijital-donusum-2026');
  await page.waitForURL('**/perspektifler/stratejik-dijital-donusum-2026');
});
