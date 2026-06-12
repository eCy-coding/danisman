/**
 * SVC GATE-5 — Services mega menu navigation contract.
 *
 * Root-cause regression armor: before taxonomy v2 the resolver was
 * catalog-only, so 5 of the 9 visible menu items landed on /404 (the bug the
 * owner screenshotted in prod). Every menu target must now render a real
 * detail page, and previously-dead orphan slugs must resolve.
 */
import { test, expect } from '@playwright/test';

const MENU_CASES: { label: string; path: string; h1: RegExp }[] = [
  {
    label: 'Kurumsal Strateji',
    path: '/services/strategic-transformation',
    h1: /Stratejik Dönüşüm/,
  },
  { label: 'Yapay Zeka & Veri', path: '/services/ai-analytics', h1: /Yapay Zeka/ },
  { label: 'Veri Yönetişimi & Uyum', path: '/services/data-governance', h1: /Veri Yönetişimi/ },
  { label: 'Gelir Büyümesi', path: '/services/market-entry', h1: /Pazara Giriş/ },
];

test.describe('SVC GATE-5 services mega menu', () => {
  test('panel exposes 9 unique service targets and the featured card', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('navbar-link-services').focus();
    const panel = page.getByTestId('mega-menu-services');
    await expect(panel).toBeVisible();

    const hrefs = await panel
      .locator('a[href^="/services/"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toHaveLength(9);
    expect(new Set(hrefs).size).toBe(9);

    await expect(panel.locator('a[href="/maturity-assessment"]')).toBeVisible();
  });

  test('menu items navigate to real detail pages — never /404', async ({ page }) => {
    // Locale-agnostic: firefox boots EN, so items are clicked by href —
    // never by TR label text.
    for (const { path, h1 } of MENU_CASES) {
      await page.goto('/');
      await page.getByTestId('navbar-link-services').focus();
      const panel = page.getByTestId('mega-menu-services');
      await expect(panel).toBeVisible();
      await panel.locator(`a[href="${path}"]`).click();

      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator('h1').first()).toHaveText(h1);
      expect(page.url()).not.toContain('/404');
    }
  });

  test('previously-dead orphan and new valuation slugs resolve directly', async ({ page }) => {
    await page.goto('/services/payroll-audit');
    await expect(page.locator('h1').first()).toHaveText(/Bordro Denetimi/);

    await page.goto('/services/company-valuation');
    await expect(page.locator('h1').first()).toHaveText(/Şirket Değerleme/);
  });

  test('junk slug still lands on 404 (resolver stays strict)', async ({ page }) => {
    await page.goto('/services/not-a-real-service');
    await expect(page).toHaveURL(/\/404$/);
  });

  test('detail v2 surfaces: lifecycle nav, section pills, variant CTA', async ({ page }) => {
    await page.goto('/services/company-valuation');
    // Lifecycle position + next-step navigation (M&A step 1/5 → negotiation-loi).
    await expect(page.getByTestId('lifecycle-position')).toHaveText(/1\/5/);
    await expect(page.getByTestId('lifecycle-next')).toHaveAttribute(
      'href',
      '/services/negotiation-loi',
    );
    // Sticky in-page section nav with working anchors.
    const nav = page.getByTestId('detail-section-nav');
    await expect(nav).toBeVisible();
    await nav.locator('a[href="#methodology"]').click();
    await expect(page.locator('#methodology')).toBeInViewport();
    // Pillar page renders WITHOUT lifecycle nav (umbrella, not a step).
    await page.goto('/services/mergers-acquisitions');
    await expect(page.getByTestId('lifecycle-nav')).toHaveCount(0);
  });

  test('Escape closes the panel and returns focus to the trigger (APG)', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByTestId('navbar-link-services');
    await trigger.focus();
    await expect(page.getByTestId('mega-menu-services')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mega-menu-services')).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
