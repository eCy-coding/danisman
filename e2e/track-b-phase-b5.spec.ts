/**
 * Track B Phase B5 — E2E smoke tests
 *
 * Tests:
 * 1. FounderPage renders at /founder
 * 2. LandingPage loads with hero content
 * 3. ServicesPage loads with service cards
 * 4. PricingPage loads with pricing tiers
 * 5. ContactPage loads with KVKK consent field
 */

import { test, expect } from '@playwright/test';

test.describe('Track B B5 — Production pages smoke', () => {
  test('FounderPage renders at /founder', async ({ page }) => {
    await page.goto('/founder');
    await expect(page.locator('h1')).toBeVisible();
    // Should show founder name (not redirect to /about)
    await expect(page.getByRole('heading', { name: /Emre Can Yalçın/i })).toBeVisible();
    // Career journey timeline should exist
    await expect(page.getByText(/Kariyer Yolculuğu|Career Journey/i)).toBeVisible();
  });

  test('LandingPage loads with hero heading', async ({ page }) => {
    await page.goto('/');
    // Hero h1 should be visible
    await expect(page.locator('h1').first()).toBeVisible();
    // Navbar should be present (from MainLayout)
    await expect(page.locator('nav').first()).toBeVisible();
    // Footer should be present
    await expect(page.locator('footer').first()).toBeVisible();
  });

  test('ServicesPage loads with service grid', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1').first()).toBeVisible();
    // Service cards should render (data-testid from ServiceCard)
    const cards = page.locator('[data-testid="service-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('PricingPage loads with pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    // Pricing tier cards should be present
    await expect(page.locator('[data-testid^="pricing-tier-"]').first()).toBeVisible({
      timeout: 10000,
    });
    // Should have at least 2 tiers
    const tiers = page.locator('[data-testid^="pricing-tier-"]');
    expect(await tiers.count()).toBeGreaterThanOrEqual(2);
  });

  test('ContactPage loads with KVKK consent checkbox', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1').first()).toBeVisible();
    // KVKK consent checkbox should be present
    const kvkkCheckbox = page.locator('[data-testid="contact-kvkk"]');
    await expect(kvkkCheckbox).toBeVisible({ timeout: 10000 });
    // Should be a checkbox
    await expect(kvkkCheckbox).toHaveAttribute('type', 'checkbox');
  });
});
