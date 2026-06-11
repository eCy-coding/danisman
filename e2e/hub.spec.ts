/**
 * GATE-3 — /perspektifler hub: redirects, URL-state round-trip, Load More,
 * pillar + topics pages (istek.md v2 §PHASE 3).
 * Edge 301s are Vercel-side; vite preview exercises the client <Navigate>
 * equivalents — the curl matrix against production covers the edge after deploy.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 900 } });

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  // UrgencyBanner mounts late and shifts layout; wait for the facet bar to
  // hold still so chip clicks land where they aim (same fix as menu.spec).
  let prev = '';
  for (let i = 0; i < 12; i++) {
    const box = await page
      .locator('[data-testid="perspektifler-facet-bar"]')
      .boundingBox()
      .catch(() => null);
    const sig = box ? `${Math.round(box.y)}` : '';
    if (sig && sig === prev) return;
    prev = sig;
    await page.waitForTimeout(150);
  }
}

test.describe('GATE-3 perspektifler hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('exit_intent_shown', '1');
    });
  });

  test('legacy /blog lands on /perspektifler (client navigate)', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForURL('**/perspektifler');
    await expect(page.locator('h1')).toContainText('Perspektifler');
  });

  test('legacy /blog/:slug lands on /perspektifler/:slug', async ({ page }) => {
    await page.goto('/blog/stratejik-dijital-donusum-2026');
    await page.waitForURL('**/perspektifler/stratejik-dijital-donusum-2026');
  });

  test('legacy /insights lands on hub', async ({ page }) => {
    await page.goto('/insights/tag/esg');
    await page.waitForURL('**/perspektifler');
  });

  test('hub anatomy: H1, featured hero, search, facet bar, chips, founder capsule', async ({
    page,
  }) => {
    await page.goto('/perspektifler');
    await settle(page);
    await expect(page.locator('h1')).toContainText('Perspektifler');
    await expect(page.locator('[data-testid="perspektifler-featured"]')).toBeVisible();
    await expect(page.locator('[data-testid="perspektifler-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="perspektifler-facet-bar"]')).toBeVisible();
    const cards = page.locator('[data-testid="article-card"]');
    // 12 grid cards + 1 featured lead + 3 secondary are separate testids — grid only:
    const gridCards = page.locator(
      '[data-testid="insights-article-grid"] [data-testid="article-card"]',
    );
    await expect(gridCards).toHaveCount(12);
    await expect(cards.first()).toBeVisible();
  });

  test('URL-state round-trip: filters → URL → fresh context reproduces view', async ({
    page,
    context,
  }) => {
    await page.goto('/perspektifler');
    await settle(page);
    // Apply category via facet chip + format via select
    await page.getByRole('button', { name: /Yapay Zeka & Teknoloji/ }).click();
    await page.waitForURL('**/perspektifler?*kategori=yapay-zeka-teknoloji*');
    const select = page.locator('[data-testid="perspektifler-facet-bar"] select').first();
    await select.selectOption('makale');
    await page.waitForURL('**format=makale**');

    // Race-proof snapshot: assert BOTH facets visibly applied before reading.
    const chip = page.getByRole('button', { name: /Yapay Zeka & Teknoloji/ });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(select).toHaveValue('makale');
    const status = page.locator('[data-testid="perspektifler-facet-bar"] [role="status"]');
    await expect(status).toHaveText(/^\d+ içgörü/);
    const url = page.url();
    const countText = await status.innerText();

    const fresh = await context.newPage();
    await fresh.addInitScript(() => window.localStorage.setItem('exit_intent_shown', '1'));
    await fresh.goto(url);
    await fresh.waitForLoadState('networkidle');
    await expect(fresh.getByRole('button', { name: /Yapay Zeka & Teknoloji/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      fresh.locator('[data-testid="perspektifler-facet-bar"] select').first(),
    ).toHaveValue('makale');
    const expectedCount = Number.parseInt(countText, 10);
    const freshStatus = fresh.locator('[data-testid="perspektifler-facet-bar"] [role="status"]');
    await expect
      .poll(async () => Number.parseInt(await freshStatus.innerText(), 10), { timeout: 10_000 })
      .toBe(expectedCount);
    await fresh.close();
  });

  test('Daha Fazla Yükle: +12 cards, footer reachable, crawlable page links', async ({ page }) => {
    await page.goto('/perspektifler');
    await settle(page);
    const grid = page.locator('[data-testid="insights-article-grid"] [data-testid="article-card"]');
    await expect(grid).toHaveCount(12);
    await page.locator('[data-testid="perspektifler-load-more"]').click();
    await page.waitForURL('**page=2**');
    const allCards = page.locator('[data-testid="article-card"]');
    await expect(allCards).toHaveCount(24); // 12 + 12, hero excluded by testid
    expect(await allCards.count()).toBeLessThanOrEqual(48);
    await expect(page.locator('nav[aria-label="Sayfalar"] a').first()).toBeVisible();
    await page.locator('footer').last().scrollIntoViewIfNeeded();
    await expect(page.locator('footer').last()).toBeVisible();
  });

  test('search box filters via ?q= (diacritic-insensitive)', async ({ page }) => {
    await page.goto('/perspektifler');
    await settle(page);
    await page.locator('[data-testid="perspektifler-search"]').fill('donusum');
    await page.waitForURL('**q=donusum**');
    const count = page.locator('[data-testid="perspektifler-facet-bar"] [role="status"]');
    await expect(count).not.toContainText(/^0 içgörü/);
  });

  test('category pillar page: intro + Buradan başlayın + locked grid', async ({ page }) => {
    await page.goto('/perspektifler/kategori/strateji');
    await settle(page);
    await expect(page.locator('h1')).toContainText('Strateji');
    await expect(page.locator('[data-testid="pillar-intro"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Buradan başlayın' })).toBeVisible();
    // Category facet hidden (locked) — kategori chips absent inside facet bar
    await expect(
      page.locator('[data-testid="perspektifler-facet-bar"]').getByRole('button', {
        name: /Yapay Zeka & Teknoloji/,
      }),
    ).toHaveCount(0);
  });

  test('konular page lists vocabulary under category headings', async ({ page }) => {
    await page.goto('/perspektifler/konular');
    await settle(page);
    await expect(page.locator('h1')).toContainText('Tüm Konular');
    const groups = page.locator('h2');
    expect(await groups.count()).toBeGreaterThanOrEqual(5);
  });

  test('unknown category slug → hub (no 404 shell)', async ({ page }) => {
    await page.goto('/perspektifler/kategori/yok-boyle-bir-sey');
    await page.waitForURL('**/perspektifler');
  });
});
