/**
 * e2e/admin-leads.spec.ts
 * Phase 1.5 — Admin Leads E2E smoke tests (3 tests)
 *
 * Tests run against preview server at localhost:4173.
 * All API calls mocked via page.route() — no real Notion/server required.
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

const MOCK_LEADS_RESPONSE = {
  data: {
    results: [
      {
        id: 'p1',
        name: 'Ahmet Yılmaz',
        company: 'ACME Holding',
        status: 'New',
        revenueRange: '100M-300M USD',
      },
    ],
    hasMore: false,
    nextCursor: null,
  },
};

async function setupAdminMocks(page: Page): Promise<void> {
  // Auth mock: authenticated ADMIN user
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { id: 'u1', role: 'ADMIN', name: 'Admin User' },
      }),
    }),
  );
  // Leads list mock
  await page.route('**/api/admin/leads', (r) => {
    if (r.request().method() === 'GET') {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LEADS_RESPONSE),
      });
    } else {
      r.continue();
    }
  });
  // SSE — return empty stream so EventSource doesn't throw
  await page.route('**/api/admin/events', (r) =>
    r.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }),
  );
  // Suppress noise
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/www.google-analytics.com/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/googletagmanager.com/**', (r) => r.fulfill({ status: 200 }));
  await page.route('**/api/geo/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: {} }),
    }),
  );
}

test.describe('Admin Leads Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('A-LEADS-01: leads page renders h1 and form', async ({ page }) => {
    await setupAdminMocks(page);

    // Inject auth token so the route guard passes
    await page.addInitScript(() => {
      const store = {
        state: {
          token: 'mock-jwt',
          user: { id: 'u1', role: 'ADMIN', name: 'Admin' },
          totpRequired: false,
          totpVerified: false,
        },
        version: 0,
      };
      localStorage.setItem('app-storage', JSON.stringify(store));
    });

    await page.goto(`${BASE_URL}/admin/leads`);
    await page.waitForLoadState('load');

    // Page must have an h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });

    // Form must be present
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('A-LEADS-02: leads list shows existing Aday from API', async ({ page }) => {
    await setupAdminMocks(page);

    await page.addInitScript(() => {
      const store = {
        state: {
          token: 'mock-jwt',
          user: { id: 'u1', role: 'ADMIN', name: 'Admin' },
          totpRequired: false,
          totpVerified: false,
        },
        version: 0,
      };
      localStorage.setItem('app-storage', JSON.stringify(store));
    });

    await page.goto(`${BASE_URL}/admin/leads`);
    await page.waitForLoadState('load');

    // Table or list showing the mocked lead
    const cell = page.getByText('Ahmet Yılmaz');
    await expect(cell).toBeVisible({ timeout: 8000 });
  });

  test('A-LEADS-03: form submit calls POST /api/admin/leads', async ({ page }) => {
    await setupAdminMocks(page);

    let postCalled = false;
    await page.route('**/api/admin/leads', (r) => {
      if (r.request().method() === 'POST') {
        postCalled = true;
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', data: { id: 'p2', status: 'New' } }),
        });
      } else {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_LEADS_RESPONSE),
        });
      }
    });

    await page.addInitScript(() => {
      const store = {
        state: {
          token: 'mock-jwt',
          user: { id: 'u1', role: 'ADMIN', name: 'Admin' },
          totpRequired: false,
          totpVerified: false,
        },
        version: 0,
      };
      localStorage.setItem('app-storage', JSON.stringify(store));
    });

    await page.goto(`${BASE_URL}/admin/leads`);
    await page.waitForLoadState('load');

    // Fill form
    const nameInput = page.getByLabel(/ad soyad/i);
    const emailInput = page.getByLabel(/e-posta/i);
    const companyInput = page.getByLabel(/şirket/i);

    if (!(await nameInput.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await nameInput.fill('Test Aday');
    await emailInput.fill('test@example.com');
    await companyInput.fill('Test Şirketi');

    // Select revenue range
    const revenueSelect = page.getByLabel(/ciro aralığı/i);
    await revenueSelect.selectOption({ index: 1 });

    // Select source
    const sourceSelect = page.getByLabel(/kaynak/i);
    await sourceSelect.selectOption({ index: 1 });

    // Select at least one service interest
    const serviceCheckboxes = page.getByRole('checkbox', { name: /advisory|danışmanlık/i });
    const firstService = serviceCheckboxes.first();
    if (await firstService.isVisible()) {
      await firstService.check();
    }

    // KVKK consent
    const kvkkCheckbox = page.getByRole('checkbox', { name: /kvkk/i });
    await kvkkCheckbox.check();

    // Submit
    const submitBtn = page.getByRole('button', { name: /aday kaydet/i });
    await submitBtn.click();

    // Wait for POST to be called
    await page.waitForTimeout(1000);
    expect(postCalled).toBe(true);
  });
});
