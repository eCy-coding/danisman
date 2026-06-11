/**
 * GATE-2 — Perspektifler mega-menü davranışı (BUG-01..04, BUG-12).
 *
 * - Kapalı-varsayılan: her route'ta sayfa yüklenince panel KAPALI.
 * - Açılma: Perspektifler trigger'ına focus/hover → panel açılır.
 * - Kapanma: ESC, dışarı tık, route değişimi, scroll.
 * - Kapsam: insights-only, ≤30 link, Sektörler/Hakkımızda YOK.
 *
 * Not: panel hover+focus ile açılır (Hizmetler fix'i, commit 8af969d ile aynı desen).
 */

import { test, expect, type Page } from '@playwright/test';

const ROUTES = ['/', '/blog', '/case-studies', '/methodology', '/about'];
const PANEL = 'Perspektifler açılır paneli';

async function openInsights(page: Page) {
  const trigger = page.getByTestId('navbar-link-insights');
  await expect(trigger).toBeVisible();
  await trigger.hover();
  await trigger.focus();
  return page.getByRole('region', { name: PANEL });
}

test.describe('Perspektifler mega-menü', () => {
  for (const route of ROUTES) {
    test(`kapalı-varsayılan: ${route} yüklenince panel kapalı`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      // Panel aria-hidden (kapalı) → region erişilebilir ağaçta görünmez olmalı.
      await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0);
    });
  }

  test('açılır, insights-only ve ≤30 link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const panel = await openInsights(page);
    await expect(panel).toBeVisible();

    await expect(panel.getByText('Kategoriler', { exact: true })).toBeVisible();
    await expect(panel.getByText('Formatlar', { exact: true })).toBeVisible();
    await expect(panel.getByText('Öne Çıkanlar', { exact: true })).toBeVisible();

    // BUG-03: Sektörler/Hakkımızda grupları yok
    await expect(panel.getByText('Metodolojimiz')).toHaveCount(0);
    await expect(panel.getByText('Firmamız')).toHaveCount(0);

    // BUG-04: insights footer
    await expect(panel.getByText('Tüm içgörüleri keşfedin')).toBeVisible();
    await expect(panel.getByText('Tüm hizmetlerimizi keşfedin')).toHaveCount(0);

    const links = await panel.locator('a[href]').count();
    expect(links).toBeLessThanOrEqual(30);
  });

  test('ESC ile kapanır', async ({ page }) => {
    await page.goto('/');
    const panel = await openInsights(page);
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0);
  });

  test('dışarı tık ile kapanır', async ({ page }) => {
    await page.goto('/');
    const panel = await openInsights(page);
    await expect(panel).toBeVisible();
    await page.mouse.click(5, 400); // nav dışında bir nokta
    await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0);
  });

  test('scroll ile kapanır', async ({ page }) => {
    await page.goto('/');
    const panel = await openInsights(page);
    await expect(panel).toBeVisible();
    await page.mouse.wheel(0, 300);
    await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0);
  });

  test('route değişiminde kapanır', async ({ page }) => {
    await page.goto('/');
    const panel = await openInsights(page);
    await expect(panel).toBeVisible();
    await page.goto('/about');
    await expect(page.getByRole('region', { name: PANEL })).toHaveCount(0);
  });
});
