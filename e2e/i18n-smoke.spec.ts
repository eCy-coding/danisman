/**
 * i18n-EN smoke tests — feat/i18n-en-scaffold
 *
 * Validates that:
 *   1. /en/* routes render English text (LocaleRoute switches i18n to 'en')
 *   2. LanguageToggle component switches language correctly
 *   3. Language preference is persisted to localStorage when analytics consent is active
 */

import { test, expect } from '@playwright/test';

test.describe('i18n EN smoke', () => {
  test('EN founder page renders English badge and breadcrumb', async ({ page }) => {
    await page.goto('/en/founder');
    // Wait for LocaleRoute useEffect to fire and set lang attribute
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', {
      timeout: 5000,
    });
    // EN badge
    await expect(page.locator('text=Founder & Chief Strategist')).toBeVisible();
    // EN breadcrumb
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText('Home');
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText('Founder');
    // EN timeline heading
    await expect(page.locator('text=Career Journey')).toBeVisible();
  });

  test('EN pricing page renders English hero title and CTA', async ({ page }) => {
    await page.goto('/en/pricing');
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', {
      timeout: 5000,
    });
    const heroTitle = page.getByTestId('pricing-hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Transparent Pricing');
    // EN CTA badge (several PRICING strings on the page — assert the first)
    await expect(page.locator('text=PRICING').first()).toBeVisible();
  });

  test('EN discovery page renders English form labels', async ({ page }) => {
    await page.goto('/en/discovery');
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', {
      timeout: 5000,
    });
    await expect(page.locator('h1')).toContainText('Discovery Meeting Request');
    await expect(page.locator('label[for="disc-name"]')).toContainText('Full Name');
    await expect(page.locator('label[for="disc-email"]')).toContainText('Email');
  });

  test('LanguageToggle switches from TR to EN', async ({ page }) => {
    await page.goto('/tr/founder');
    // Should be in TR
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'tr', {
      timeout: 5000,
    });
    await expect(page.locator('text=Kurucu & Baş Stratejist')).toBeVisible();

    // Click language toggle
    await page.locator('[data-testid="utility-dock"] > button').click(); // open merged dock (D-6)
    const toggle = page.getByTestId('language-toggle');
    await toggle.click();

    // Should switch to EN
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', {
      timeout: 5000,
    });
    await expect(page.locator('text=Founder & Chief Strategist')).toBeVisible();
  });

  test('language preference persisted after analytics consent', async ({ page }) => {
    // Global setup seeds analytics consent — localStorage write should happen on changeLanguage
    await page.goto('/tr');
    await page.locator('[data-testid="utility-dock"] > button').click(); // open merged dock (D-6)
    await page.getByTestId('language-toggle').click();
    // Wait for EN to load
    await page.waitForFunction(() => document.documentElement.getAttribute('lang') === 'en', {
      timeout: 5000,
    });
    // Verify localStorage was written (consent is seeded in global-setup)
    const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'));
    expect(storedLang).toBe('en');
  });
});
