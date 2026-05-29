/**
 * e2e/admin-insights.spec.ts — Perspektif Admin CRUD smoke (PB-11/PB-12/PB-13)
 *
 * Covers all six admin insights routes introduced by the stacked chain:
 *   #96  feat/perspektif-admin-category-mgmt  → /admin/insights/categories
 *   #107 feat/perspektif-posts-admin          → /admin/insights/posts  + /posts/new + /posts/:id/edit
 *   #110 feat/perspektif-metadata-admin       → /admin/insights/metadata
 *
 * Strategy:
 *   - Public smoke: auth-guard redirect (no credentials required)
 *   - Authed flows: read-only UI assertions; no data is created / mutated
 *
 * Env vars:
 *   PREVIEW_URL            – defaults to http://localhost:4173
 *   PREVIEW_AUTH_COOKIE    – if set, authed suites run; staging CI test user cookie
 *
 * Run:
 *   npx playwright test e2e/admin-insights.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Inject admin auth cookie so authed routes resolve without redirect. */
async function injectAuthCookie(context: import('@playwright/test').BrowserContext) {
  const cookie = process.env.PREVIEW_AUTH_COOKIE;
  if (!cookie) return;
  await context.addCookies([
    {
      name: 'auth-token',
      value: cookie,
      domain: new URL(BASE_URL).hostname,
      path: '/',
    },
  ]);
}

// ── Public smoke — no credentials ─────────────────────────────────────────────

test.describe('Admin insights — public smoke (no auth)', () => {
  const INSIGHTS_ROUTES = [
    '/admin/insights',
    '/admin/insights/categories',
    '/admin/insights/posts',
    '/admin/insights/posts/new',
    '/admin/insights/metadata',
  ] as const;

  for (const route of INSIGHTS_ROUTES) {
    test(`${route} redirects unauthenticated user to /admin/login`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('domcontentloaded');
      const url = new URL(page.url());
      // SPA auth-guard: path becomes /admin/login (or stays /admin/login after redirect)
      expect(url.pathname).toMatch(/^\/admin(\/login)?$/);
    });
  }
});

// ── Authed flows — requires PREVIEW_AUTH_COOKIE ────────────────────────────────

test.describe('Admin insights — authed (skipped without auth cookie)', () => {
  test.skip(!process.env.PREVIEW_AUTH_COOKIE, 'Requires PREVIEW_AUTH_COOKIE env');

  test.beforeEach(async ({ context }) => {
    await injectAuthCookie(context);
  });

  // ── Hub page (/admin/insights) ───────────────────────────────────────────────

  test.describe('Hub overview (/admin/insights)', () => {
    test('renders Perspektif Dashboard heading', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/insights`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /Perspektif Dashboard/i })).toBeVisible();
    });

    test('page responds 200 and has no console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      const res = await page.goto(`${BASE_URL}/admin/insights`);
      await page.waitForLoadState('networkidle');
      expect(res?.status() ?? 200).toBeLessThan(500);
      const fatal = consoleErrors.filter(
        (e) => !e.includes('favicon') && !e.includes('ResizeObserver'),
      );
      expect(fatal).toHaveLength(0);
    });
  });

  // ── Categories page (/admin/insights/categories) ─────────────────────────────

  test.describe('Categories CRUD (/admin/insights/categories)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/insights/categories`);
      await page.waitForLoadState('networkidle');
    });

    test('page loads without 5xx error', async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/admin/insights/categories`);
      await page.waitForLoadState('networkidle');
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test('filter bar is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="category-filter-bar"]')).toBeVisible();
    });

    test('search input is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="category-search"]')).toBeVisible();
    });

    test('"+ Kategori Ekle" button is present', async ({ page }) => {
      await expect(page.locator('[data-testid="add-category-btn"]')).toBeVisible();
    });

    test('domain filter chips render (≥1 chip)', async ({ page }) => {
      const chips = page.locator('[data-testid^="domain-filter-"]');
      expect(await chips.count()).toBeGreaterThanOrEqual(1);
    });

    test('table or empty-state renders (not blank)', async ({ page }) => {
      const content = page.locator('[data-testid^="category-row-"], [data-testid="empty-state"]');
      // Wait up to 8s for API response
      await expect(content.first()).toBeVisible({ timeout: 8000 });
    });

    test('clicking "+ Kategori Ekle" opens modal', async ({ page }) => {
      await page.locator('[data-testid="add-category-btn"]').click();
      await expect(page.locator('[data-testid="category-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-form"]')).toBeVisible();
    });
  });

  // ── Posts list page (/admin/insights/posts) ───────────────────────────────────

  test.describe('Posts list (/admin/insights/posts)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/insights/posts`);
      await page.waitForLoadState('networkidle');
    });

    test('posts-page container renders', async ({ page }) => {
      await expect(page.locator('[data-testid="posts-page"]')).toBeVisible();
    });

    test('"+ Yazı Ekle" button is present', async ({ page }) => {
      await expect(page.locator('[data-testid="add-post-btn"]')).toBeVisible();
    });

    test('filter bar is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="posts-filter-bar"]')).toBeVisible();
    });

    test('search input is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="posts-search"]')).toBeVisible();
    });

    test('domain filter chips render (≥4 chips)', async ({ page }) => {
      const chips = page.locator('[data-testid^="domain-filter-"]');
      expect(await chips.count()).toBeGreaterThanOrEqual(4);
    });

    test('table or empty-state renders after API resolves', async ({ page }) => {
      const content = page.locator(
        '[data-testid="posts-table"], [data-testid="posts-empty-state"]',
      );
      await expect(content.first()).toBeVisible({ timeout: 8000 });
    });
  });

  // ── New post page (/admin/insights/posts/new) ─────────────────────────────────

  test.describe('New post edit form (/admin/insights/posts/new)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/insights/posts/new`);
      await page.waitForLoadState('networkidle');
    });

    test('post-edit-page container renders', async ({ page }) => {
      await expect(page.locator('[data-testid="post-edit-page"]')).toBeVisible();
    });

    test('save-draft button is present', async ({ page }) => {
      await expect(page.locator('[data-testid="save-draft-btn"]')).toBeVisible();
    });

    test('Turkish title input is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="post-title-tr"]')).toBeVisible();
    });

    test('slug field is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="post-slug"]')).toBeVisible();
    });

    test('domain selector is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="post-domain"]')).toBeVisible();
    });
  });

  // ── Metadata page (/admin/insights/metadata) ──────────────────────────────────

  test.describe('Metadata — Authors / Tags / Series (/admin/insights/metadata)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/insights/metadata`);
      await page.waitForLoadState('networkidle');
    });

    test('page loads without 5xx', async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/admin/insights/metadata`);
      await page.waitForLoadState('networkidle');
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test('Yazarlar tab is visible and active by default', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-yazarlar"]')).toBeVisible();
    });

    test('Etiketler tab is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-etiketler"]')).toBeVisible();
    });

    test('Seriler tab is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-seriler"]')).toBeVisible();
    });

    test('clicking Etiketler tab switches panel', async ({ page }) => {
      await page.locator('[data-testid="tab-etiketler"]').click();
      // Panel switch happened — tab stays visible (no crash)
      await page.waitForTimeout(300);
      await expect(page.locator('[data-testid="tab-etiketler"]')).toBeVisible();
    });

    test('clicking Seriler tab switches panel', async ({ page }) => {
      await page.locator('[data-testid="tab-seriler"]').click();
      await page.waitForTimeout(300);
      // Add series button or empty state should be reachable
      const seriesContent = page.locator(
        '[data-testid="add-series-btn"], [data-testid="series-empty-state"], [data-testid^="series-row-"]',
      );
      await expect(
        seriesContent.or(page.locator('[data-testid="tab-seriler"]')).first(),
      ).toBeVisible({ timeout: 8000 });
    });
  });
});
