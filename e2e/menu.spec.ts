/**
 * GATE-2 — Perspektifler mega-menu behavior (istek.md v2 §PHASE 2).
 * Asserts: closed-by-default on 5 routes, all close behaviors, keyboard path,
 * insights-only scope, ≤30 links, no BUG-02 empty icon artifacts.
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTES = ['/', '/case-studies', '/blog', '/methodology', '/about'];
const PANEL = '[data-testid="mega-menu-insights"]';
const NAV_LINK = '[data-testid="navbar-link-insights"]';

test.use({ viewport: { width: 1366, height: 900 } });

/** Late-mounting layout (UrgencyBanner) shifts the navbar ~30ms after load;
 *  a stationary cursor then receives mouseleave and the hover-intent timer is
 *  cancelled. Wait until the nav link's box is stable before hovering. */
async function waitForStableLayout(page: Page) {
  await page.waitForLoadState('networkidle');
  // WebKit opens the Utilities rail's full-screen backdrop on load — dismiss
  // any stray overlay before measuring (it would also swallow hovers).
  const utilitiesBackdrop = page.locator('aside[aria-label="Utilities"] div.fixed.inset-0');
  if (await utilitiesBackdrop.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    if (await utilitiesBackdrop.isVisible().catch(() => false)) {
      await utilitiesBackdrop.click({ position: { x: 683, y: 500 }, force: true });
    }
    await utilitiesBackdrop.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
  let prev = '';
  for (let i = 0; i < 20; i++) {
    const box = await page.locator(NAV_LINK).boundingBox();
    const sig = box ? `${Math.round(box.x)}:${Math.round(box.y)}` : '';
    if (sig && sig === prev) return;
    prev = sig;
    await page.waitForTimeout(150);
  }
}

async function openInsightsPanel(page: Page) {
  await waitForStableLayout(page);
  for (let attempt = 0; attempt < 4; attempt++) {
    // Park mid-page: the left edge hosts the Utilities rail whose hover opens
    // a full-screen z-60 backdrop that would swallow the next hover.
    await page.mouse.move(683, 500);
    await page.locator(NAV_LINK).hover();
    try {
      await expect(page.locator(PANEL)).toBeVisible({ timeout: 1500 });
      return;
    } catch {
      /* layout/hydration race — retry */
    }
  }
  await expect(page.locator(PANEL)).toBeVisible({ timeout: 2000 });
}

test.describe('GATE-2 mega-menu', () => {
  test.beforeEach(async ({ page }) => {
    // Hovering the navbar puts the cursor inside the top-20px exit-intent
    // zone; the ExitIntentModal's full-screen z-60 backdrop would swallow
    // every later pointer action. It is once-per-visitor in production —
    // seed its shown-flag so menu behavior is tested in isolation.
    await page.addInitScript(() => {
      window.localStorage.setItem('exit_intent_shown', '1');
    });
  });

  for (const route of ROUTES) {
    test(`closed by default on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator(PANEL)).toBeHidden();
    });
  }

  test('BUG-02: no empty icon boxes before nav labels', async ({ page }) => {
    await page.goto('/');
    const emptyIconBoxes = page.locator('[data-testid^="navbar-link-"] div.w-8:empty');
    await expect(emptyIconBoxes).toHaveCount(0);
  });

  test('opens on hover-intent, closes on ESC', async ({ page }) => {
    await page.goto('/');
    await openInsightsPanel(page);
    await page.keyboard.press('Escape');
    await expect(page.locator(PANEL)).toBeHidden();
  });

  test('closes on outside click', async ({ page }) => {
    await page.goto('/');
    await openInsightsPanel(page);
    await page.mouse.click(20, 600);
    await expect(page.locator(PANEL)).toBeHidden();
  });

  test('closes on scroll >100px', async ({ page }) => {
    await page.goto('/');
    await openInsightsPanel(page);
    await page.mouse.move(683, 500); // leave the nav so hover re-open cannot fire
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' as ScrollBehavior }));
    await expect(page.locator(PANEL)).toBeHidden();
  });

  test('closes on route change (panel link navigation)', async ({ page }) => {
    await page.goto('/');
    await openInsightsPanel(page);
    await page.locator(`${PANEL} a`).first().click();
    await expect(page.locator(PANEL)).toBeHidden();
    expect(new URL(page.url()).pathname).not.toBe('/');
  });

  test('keyboard path: focus opens panel, items tabbable', async ({ page }) => {
    await page.goto('/');
    await waitForStableLayout(page);
    await page.locator(NAV_LINK).focus();
    await expect(page.locator(PANEL)).toBeVisible();
    await expect(page.locator(NAV_LINK)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(NAV_LINK)).toHaveAttribute('aria-controls', 'mega-menu-insights');
    if (test.info().project.name === 'webkit') {
      // Safari/WebKit does not move focus to links on plain Tab; assert the
      // panel items are focusable instead of simulating the keypress.
      await page.locator(`${PANEL} a`).first().focus();
      const inPanel = await page.evaluate(
        () => !!document.activeElement?.closest('[data-testid="mega-menu-insights"]'),
      );
      expect(inPanel).toBe(true);
    } else {
      await page.keyboard.press('Tab');
      const focusedHref = await page.evaluate(() => document.activeElement?.getAttribute('href'));
      expect(focusedHref).toBeTruthy();
    }
  });

  test('insights-only scope: ≤30 links, no SEKTÖRLER/HAKKIMIZDA groups, hub footer', async ({
    page,
  }) => {
    await page.goto('/');
    await openInsightsPanel(page);
    const panel = page.locator(PANEL);

    const linkCount = await panel.locator('a').count();
    expect(linkCount).toBeLessThanOrEqual(30);

    const text = (await panel.innerText()).toUpperCase();
    expect(text).not.toContain('SEKTÖRLER');
    expect(text).not.toContain('HAKKIMIZDA');
    expect(text).not.toContain('HİZMETLERİMİZİ'); // BUG-04 services wording

    // Locale-agnostic: firefox boots in EN (navigator language detection).
    await expect(panel.getByText(/Tüm içgörüleri keşfedin|Explore all insights/)).toBeVisible();
    await expect(panel.getByText(/^(Kategoriler|Categories)$/)).toBeVisible();
    await expect(panel.getByText(/^(Formatlar|Formats)$/)).toBeVisible();
    await expect(panel.getByText(/2026 AI (Dönüşüm Raporu|Transformation Report)/)).toBeVisible();
  });
});
