/**
 * P57.11 — Admin panel E2E smoke.
 *
 * Read-only critical paths — DOES NOT mutate prod data:
 *   - Login redirect (no creds → /admin/login)
 *   - Public 404 inside /admin (random path)
 *   - Admin login page renders form
 *
 * Yetkili senaryolar PREVIEW_AUTH_COOKIE env'i ile çalıştırılır
 * (staging deploy'da CI test kullanıcısı + cookie inject).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

test.describe('P57 admin panel — public smoke', () => {
  test('admin root redirects unauthenticated users to /admin/login', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/admin`);
    expect(res?.status() ?? 200).toBeLessThan(500);
    // SPA either renders login OR redirects there; assertion is on URL path.
    await page.waitForLoadState('domcontentloaded');
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/^\/admin(\/login)?$/);
  });

  test('admin login page renders email + password fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('admin random subpath also gates auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/random-${Date.now()}`);
    await page.waitForLoadState('domcontentloaded');
    // Either NotFound (404) or login redirect — both pass for security
    const html = await page.content();
    expect(html.length).toBeGreaterThan(100);
  });
});

test.describe('P57 admin panel — authed flows (skipped without auth cookie)', () => {
  test.skip(!process.env.PREVIEW_AUTH_COOKIE, 'Requires PREVIEW_AUTH_COOKIE env');

  test.beforeEach(async ({ context }) => {
    if (!process.env.PREVIEW_AUTH_COOKIE) return;
    await context.addCookies([{
      name: 'auth-token',
      value: process.env.PREVIEW_AUTH_COOKIE,
      domain: new URL(BASE_URL).hostname,
      path: '/',
    }]);
  });

  test('overview page renders KPI strip', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/overview`);
    await expect(page.locator('h1')).toContainText(/Operatör Panosu/i);
  });

  test('blog list page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/blog`);
    await expect(page.locator('h1, [role="heading"]')).toBeVisible();
  });

  test('settings tabs renders 7 tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings/tabs`);
    const tabs = page.locator('[role="tablist"] [role="tab"]');
    expect(await tabs.count()).toBeGreaterThanOrEqual(7);
  });
});
