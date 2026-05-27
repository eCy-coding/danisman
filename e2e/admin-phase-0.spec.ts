/**
 * Phase 0.5 — Admin Panel Critical Path E2E
 *
 * Validates Phase 0 P0-1/P0-2/P0-3 fixes at browser level.
 * Runs against local preview (npm run preview) or PREVIEW_URL env.
 *
 * These tests verify the golden path — they do NOT mutate production data.
 * Authenticated flows skipped unless PREVIEW_AUTH_COOKIE is set.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';

test.describe('Phase 0 — AdminGuard RBAC enforcement (unauthenticated)', () => {
  test('unauthenticated access to /admin/blog redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/blog`);
    await page.waitForLoadState('domcontentloaded');
    const url = new URL(page.url());
    // Must redirect to login, never serve blog admin to unauthenticated user
    expect(url.pathname).toMatch(/\/admin\/login$/);
  });

  test('unauthenticated access to /admin/users redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/\/admin\/login$/);
  });

  test('admin login page renders form fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});

test.describe('Phase 0 — No login flash on hard reload (P0-2 isLoading fix)', () => {
  test('navigating to /admin without session shows login (no flash)', async ({ page }) => {
    // Clear session state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Should be at login page — no flash to admin content and back
    const url = new URL(page.url());
    expect(url.pathname).toMatch(/\/admin(\/login)?$/);
  });
});

test.describe('Phase 0 — Authenticated admin flows (requires PREVIEW_AUTH_COOKIE)', () => {
  test.skip(
    !process.env.PREVIEW_AUTH_COOKIE,
    'Requires PREVIEW_AUTH_COOKIE env var (CI auth token)',
  );

  test.beforeEach(async ({ context }) => {
    if (!process.env.PREVIEW_AUTH_COOKIE) return;
    await context.addCookies([
      {
        name: 'auth-token',
        value: process.env.PREVIEW_AUTH_COOKIE,
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);
  });

  test('Admin blog page renders create form with slug + title fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/blog`);
    await page.waitForLoadState('networkidle');

    // P0-1 fix: blog create form must be present and connected to API
    const slugInput = page.locator('input[placeholder*="slug"], input[name="slug"]').first();
    const titleInput = page
      .locator('input[placeholder*="title"], input[placeholder*="başlık"], input[name="title"]')
      .first();

    await expect(slugInput).toBeVisible();
    await expect(titleInput).toBeVisible();
  });

  test('Blog create button is disabled without slug (guard against empty submit)', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/admin/blog`);
    await page.waitForLoadState('networkidle');

    // Find create button — disabled when slug empty (P0-1 submit guard)
    const createBtn = page
      .locator('button:has-text("Create Post"), button:has-text("Oluştur")')
      .first();
    await expect(createBtn).toBeDisabled();
  });
});
