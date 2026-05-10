/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test('Production Audit: Capture Console Errors', async ({ page }) => {
  const consoleErrors: string[] = [];

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  // Listen for unhandled exceptions
  page.on('pageerror', (exception) => {
    consoleErrors.push(`UNHANDLED EXCEPTION: ${exception.message}`);
    console.log(`PAGE CRASH: ${exception.message}`);
  });

  // Mock local API (mock server may be on different port than built app expects)
  await page.route('http://localhost:3001/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/health')) {
      await route.fulfill({ status: 200, json: { status: 'ok', service: 'ecypro-api' } });
    } else if (url.includes('/geo/')) {
      await route.fulfill({ status: 200, json: { country: 'TR', banner: null } });
    } else {
      await route.fulfill({ status: 200, json: {} });
    }
  });

  // Mock API endpoints that won't resolve in preview/local
  await page.route('https://api.ecypro.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/health')) {
      await route.fulfill({ status: 200, json: { status: 'ok' } });
    } else {
      await route.fulfill({ status: 200, json: {} });
    }
  });

  // Mock Sentry DSN to prevent any network calls
  await page.route('https://mock@o0.ingest.sentry.io/**', async (route) => {
    await route.fulfill({ status: 200, json: {} });
  });
  await page.route('**/ingest.sentry.io/**', async (route) => {
    await route.fulfill({ status: 200, json: {} });
  });

  // Go to the production preview URL
  await page.goto('http://localhost:4173');

  // Wait for hydration and stability
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toBeVisible();

  // Give app time to finish async initialization
  await page.waitForTimeout(1000);

  // Filter out benign/expected errors in preview environment
  const BENIGN_PATTERNS = [
    'Content Security Policy',
    'font-src',
    'ERR_NAME_NOT_RESOLVED',
    'unhealthy state on startup',
    'Cross-Origin Request Blocked',
    'A server with the specified hostname could not be found',
    'Failed to load resource', // 404s for optional assets (favicons, manifests, etc.)
    'Sentry', // Any Sentry-related errors with mock DSN
    'Session Replay', // Sentry session replay
    'net::ERR_', // Network errors in local/preview
    'the server responded with a status of 4', // 404/403 etc for missing optional resources
    'sendBeacon', // Beacon API failures in preview
    'serviceWorker', // SW registration in preview
    'layout-shift', // React 19/Vite layout shift warning in preview
    'react-i18next', // i18next init warning
    'attribute cx', // Recharts SVG circle rendering during layout
    'attribute cy', // Recharts SVG circle rendering during layout
    'attribute r', // Recharts SVG circle rendering during layout
    '<circle>', // Recharts SVG element initialization
    'width(-1)', // Recharts container dimension warning
    'height(-1)', // Recharts container dimension warning
    'Console Ninja', // Dev extension log
    'MIME type', // Firefox CSS MIME warning in preview (tailwindcss asset)
    'was not loaded because its MIME', // Firefox CSS MIME variant
    'text/css', // Firefox MIME type mismatch in preview
  ];

  const filteredErrors = consoleErrors.filter(
    (msg) => !BENIGN_PATTERNS.some((pattern) => msg.includes(pattern)),
  );

  // Assert no real application errors
  expect(filteredErrors).toEqual([]);
});

test('Booking Wizard E2E: submit to mock server', async ({ page }) => {
  test.setTimeout(60000);
  // Mock Telegram API to prevent real network calls
  await page.route('https://api.telegram.org/**', async (route) => {
    await route.fulfill({ status: 200, json: { ok: true, result: { message_id: 123 } } });
  });

  // Mock API endpoints
  await page.route('https://api.ecypro.com/**', async (route) => {
    await route.fulfill({ status: 200, json: {} });
  });

  // Mock local /api/bookings POST
  await page.route('**/api/bookings', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, json: { id: 'mock-1', status: 'pending' } });
    } else {
      await route.continue();
    }
  });

  // Go to the services page where BookingWizard is located
  await page.goto('http://localhost:4173/services', {
    waitUntil: 'domcontentloaded',
    timeout: 50000,
  });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

  // Scroll to booking wizard to ensure it's in view
  await page
    .locator('#booking-wizard')
    .scrollIntoViewIfNeeded()
    .catch(() => null);

  // Fill step 1 of the wizard
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="company"]', 'Test Company');

  // Click next
  await page.click('button:has-text("Next Step")', { timeout: 10000 });

  // Wait for step 2 by expecting the primary goal label
  await expect(page.locator('text=Primary Goal')).toBeVisible({ timeout: 12000 });

  // Click on a service option
  await page.click('button:has-text("Strategy")');

  // Submit the form
  await page.click('button:has-text("Submit Request")');

  // Verify successful submission message
  await expect(page.locator('text=Request Received!')).toBeVisible({ timeout: 15000 });
});
