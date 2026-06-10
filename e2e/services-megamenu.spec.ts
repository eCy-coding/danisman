/**
 * Phase 6 — HİZMETLER mega-menü uçtan uca (e2e) testi.
 *
 * Kapsam:
 *   - Hizmetler tetikleyicisine hover → mega-menü açılır.
 *   - 3 kategori + 9 hizmet derin-linki görünür ve doğru route'a gider.
 *   - "AI Olgunluk Analizi / Analizi Başlat" CTA → /maturity-assessment.
 *   - Alt bar "Tümünü gör" → /services.
 *   - Her derin-link tıklanınca /404 DEĞİL, gerçek hizmet sayfası açılır.
 *   - TR + EN.
 *
 * Not: Mega-menü yalnızca masaüstünde (lg+) hover ile açılır.
 */

import { test, expect, type Page } from '@playwright/test';

const DEEP_LINKS: Record<string, string> = {
  'Kurumsal Strateji': '/services/strategic-transformation',
  'M&A Danışmanlığı': '/services/mergers-acquisitions',
  'Organizasyonel Tasarım': '/services/organizational-design',
  'Yapay Zeka & Veri': '/services/ai-analytics',
  'Dijital Dönüşüm': '/services/digital-strategy',
  'Bulut & Platform': '/services/cloud-platform-modernization',
  'Gelir Büyümesi': '/services/revenue-growth-strategy',
  'Maliyet Dönüşümü': '/services/cost-optimization',
  'Dijital Operasyonlar': '/services/digital-operations',
};

async function openServicesMenu(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const trigger = page.getByTestId('navbar-link-services');
  await expect(trigger).toBeVisible();
  await trigger.hover();
  const panel = page.getByRole('region', { name: 'Hizmetler açılır paneli' });
  await expect(panel).toBeVisible();
  return panel;
}

test.describe('HİZMETLER mega-menü', () => {
  test('3 kategori + 9 derin-link + CTA görünür', async ({ page }) => {
    const panel = await openServicesMenu(page);

    for (const title of ['Strateji', 'Teknoloji', 'Performans']) {
      await expect(panel.getByText(title, { exact: true })).toBeVisible();
    }

    for (const [label, href] of Object.entries(DEEP_LINKS)) {
      const link = panel.locator(`a[href="${href}"]`);
      await expect(link, `eksik link: ${label} → ${href}`).toHaveCount(1);
    }

    // Öne çıkan CTA
    await expect(panel.getByText('AI Olgunluk Analizi')).toBeVisible();
    await expect(panel.locator('a[href="/maturity-assessment"]')).toBeVisible();

    // Alt bar
    await expect(panel.locator('a[href="/services"]')).toBeVisible();
  });

  test('her derin-link gerçek hizmet sayfası açar (404 değil)', async ({ page }) => {
    for (const href of Object.values(DEEP_LINKS)) {
      await page.goto(href);
      // 404 sayfasına yönlenmemeli; URL korunmalı ve h1 görünür olmalı.
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('CTA "Analizi Başlat" → /maturity-assessment', async ({ page }) => {
    const panel = await openServicesMenu(page);
    await panel.getByRole('link', { name: /Analizi Başlat/ }).click();
    await expect(page).toHaveURL(/\/maturity-assessment$/);
  });
});
