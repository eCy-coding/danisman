import { test, expect } from '@playwright/test';

/**
 * EcyPro — Critical User Flows E2E Tests
 *
 * Tests the complete user journey from landing to booking.
 */

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Hero section renders with CTAs', async ({ page }) => {
    // Verify hero is visible
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    // Verify primary CTA
    // Copy is driven by the GrowthBook A/B flag `hero-cta-variant` (book|explore,
    // see src/components/sections/Hero.tsx) — the literal string never contains
    // "başla/start/get started" in either variant or language; it reads "Tanışma
    // Toplantısı Planla"/"Book a Discovery Call" (book, default) or "Hizmetleri
    // Keşfet"/"Explore Services" (explore). Match the real copy family instead
    // of a stale placeholder string.
    const contactLink = page.locator('[data-testid="hero-cta-primary"]');
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toContainText(/planla|discovery|keşfet|explore/i);

    // Verify secondary CTA
    const servicesLink = page.locator('[data-testid="hero-cta-secondary"]');
    await expect(servicesLink).toBeVisible();
  });

  test('Navigation scroll to sections works', async ({ page }) => {
    // Click services link in nav or hero
    const servicesNav = page.locator('a[href="#services"]').first();
    if (await servicesNav.isVisible()) {
      await servicesNav.click();
      await page.waitForTimeout(1000);

      // Verify scroll happened
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(100);
    }
  });

  test('Contact section has form elements', async ({ page }) => {
    // Navigate to contact section
    await page.evaluate(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Check for form inputs
    const contactSection = page.locator('#contact');
    if (await contactSection.isVisible()) {
      // Should have at least name/email inputs
      const inputs = contactSection.locator('input');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('No console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors
    const realErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Meta tags and SEO basics', async ({ page }) => {
    // Title exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    // Meta description (use first() — react-helmet adds a second one)
    const metaDesc = page.locator('meta[name="description"]').first();
    await expect(metaDesc).toHaveAttribute('content', /.{20,}/);

    // Viewport meta
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Single H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero should still be visible
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test('Language switcher works', async ({ page }) => {
    // src/components/LanguageSwitcher.tsx renders two ALWAYS-visible buttons
    // (data-testid="lang-tr" / "lang-en") and no-ops when clicking the
    // already-active locale (`if (next === current) return;`). Default
    // locale is 'tr' (DEFAULT_LANG in src/lib/i18n-react.ts), so the old
    // loose selector `button:has-text("TR")` deterministically matched the
    // ALREADY-active TR button first in DOM order → clicking it was a
    // guaranteed no-op → h1 never changed. Target the switcher's own
    // testids and click whichever button is NOT currently active.
    const trBtn = page.locator('[data-testid="lang-tr"]');
    const enBtn = page.locator('[data-testid="lang-en"]');

    if (await enBtn.isVisible().catch(() => false)) {
      const isTrActive = (await trBtn.getAttribute('aria-pressed')) === 'true';
      const initialText = await page.locator('h1').first().textContent();
      await (isTrActive ? enBtn : trBtn).click();
      await page.waitForTimeout(500);
      const newText = await page.locator('h1').first().textContent();

      // Text should change after language switch
      if (initialText && newText) {
        expect(newText).not.toBe(initialText);
      }
    }
  });

  test('PWA manifest is accessible', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    if ((await manifestLink.count()) > 0) {
      const href = await manifestLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
