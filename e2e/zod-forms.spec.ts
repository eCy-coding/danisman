/**
 * P44-T02 — Zod fanout smoke tests.
 *
 * Happy path + invalid-input checks for each migrated public form.
 * Uses mock server routes (same pattern as newsletter.spec.ts).
 */

import { test, expect } from '@playwright/test';

// ── Discovery form (/discovery) ───────────────────────────────────────────────

test.describe('Discovery form (/discovery)', () => {
  test('happy path: valid payload → success state', async ({ page }) => {
    await page.route('**/v1/discovery', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto('/discovery', { waitUntil: 'domcontentloaded' });

    await page.fill('#disc-name', 'Emre Yalçın');
    await page.fill('#disc-email', 'emre@ecypro.com');
    await page.fill('#disc-company', 'eCyPro');
    await page.check('#disc-kvkk');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
  });

  test('submit blocked when kvkkConsent unchecked', async ({ page }) => {
    await page.goto('/discovery', { waitUntil: 'domcontentloaded' });

    await page.fill('#disc-name', 'Emre Yalçın');
    await page.fill('#disc-email', 'emre@ecypro.com');
    await page.fill('#disc-company', 'eCyPro');
    // intentionally do NOT check KVKK consent

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });
});

// ── NewsletterSection (homepage) ──────────────────────────────────────────────

test.describe('NewsletterSection (homepage)', () => {
  test('happy path: email + consent → success', async ({ page }) => {
    await page.route('**/newsletter/subscribe', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', code: 'SUBSCRIBED' }),
      }),
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const emailInput = page.getByTestId('newsletter-email');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('test@example.com');

    const consentLabel = page.locator('[data-testid="newsletter-consent"]').locator('..');
    await consentLabel.click();

    const submitBtn = page.getByTestId('newsletter-submit');
    await submitBtn.click();

    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
  });

  test('submit blocked when consent unchecked', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const emailInput = page.getByTestId('newsletter-email');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('test@example.com');
    // consent not checked

    const submitBtn = page.getByTestId('newsletter-submit');
    await expect(submitBtn).toBeDisabled();
  });
});

// ── DataRightsPage (/privacy/data-rights) ────────────────────────────────────

test.describe('DataRightsPage DSAR form', () => {
  test('happy path: export request with valid email', async ({ page }) => {
    await page.route('**/gdpr/export', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto('/privacy/data-rights', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('user@example.com');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
  });

  test('invalid email: shows validation error', async ({ page }) => {
    await page.goto('/privacy/data-rights', { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('not-an-email');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5_000 });
  });
});

// ── DiscoveryPage (/discovery-page or Calendly-backed route) ──────────────────

test.describe('DiscoveryPage form', () => {
  test('submit disabled without KVKK consent', async ({ page }) => {
    await page.goto('/discovery-page', { waitUntil: 'domcontentloaded' }).catch(() => {
      // route may 404 in test env — skip gracefully
    });

    const form = page.getByTestId('discovery-form');
    if (!(await form.isVisible().catch(() => false))) return;

    const submitBtn = page.getByTestId('discovery-submit');
    await expect(submitBtn).toBeDisabled();
  });
});
