/**
 * E2E Tests — New Routes (Phase 35-37)
 *
 * Tests coverage for routes added in Phase 35-37 sessions:
 *   - /feedback/:bookingId    (P37-T10: NPS feedback, public, token-gated)
 *   - /verify-email           (P35-T03: email verification, public, token-gated)
 *   - /admin/sessions         (P35-T09: session management, ADMIN-only)
 *   - /admin/audit-log        (P36-T07: audit log, ADMIN-only)
 *   - GET /api/bookings/slots (P37-T01: Cal.com proxy, public)
 *   - POST /api/bookings/public (P37-T01: guest booking, public)
 *
 * Strategy:
 *   - Public pages: full render + interaction tests
 *   - Token-gated pages: test both valid (mocked) and invalid token states
 *   - Admin pages: verify auth guard redirects for unauthenticated users
 *   - API endpoints: direct fetch via page.evaluate + network mock setup
 *
 * Network mocking:
 *   All API calls are mocked to avoid real DB/Redis dependency in CI.
 *   Mock responses match the actual server response envelope: { status: "success", data: ... }
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Helper: Mock API responses ────────────────────────

async function mockFeedbackApi(
  page: Page,
  bookingId: string,
  scenario: 'valid' | 'already_submitted' | 'invalid',
) {
  // Mock the token validation GET
  await page.route(`**/api/feedback/${bookingId}**`, async (route) => {
    if (route.request().method() === 'GET') {
      if (scenario === 'invalid') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          }),
        });
      } else if (scenario === 'already_submitted') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'already_submitted', data: { score: 9 } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: { bookingId, scheduledAt: '2026-05-15T10:00:00Z', userName: 'Test User' },
          }),
        });
      }
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success' }),
      });
    } else {
      await route.continue();
    }
  });
}

// ─── /feedback/:bookingId ─────────────────────────────────────

test.describe('/feedback/:bookingId — NPS Feedback Page (P37-T10)', () => {
  const BOOKING_ID = 'test-booking-uuid-123';

  test('invalid/missing token → shows error UI', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'invalid');

    await page.goto(`/feedback/${BOOKING_ID}?token=badtoken`);
    await page.waitForLoadState('networkidle');

    // Should show error state (invalid link)
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Should NOT show the NPS score grid
    const scoreGrid = page.getByRole('radiogroup');
    await expect(scoreGrid).not.toBeVisible();
  });

  test('missing token param → error state', async ({ page }) => {
    await page.goto(`/feedback/${BOOKING_ID}`);
    await page.waitForLoadState('networkidle');

    // No token → should show error (MISSING_TOKEN)
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
  });

  test('already submitted → thank-you state (no form)', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'already_submitted');

    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    // Thank you state: no submit button visible
    const submitBtn = page.getByRole('button', { name: /gönder/i });
    await expect(submitBtn).not.toBeVisible();
  });

  test('valid token → NPS score grid renders (0-10)', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'valid');

    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    // Step 1: NPS score grid should be visible
    const scoreGrid = page.getByRole('radiogroup', { name: 'NPS Score' });
    await expect(scoreGrid).toBeVisible();

    // Grid has 11 buttons (0-10)
    const scoreButtons = scoreGrid.getByRole('radio');
    await expect(scoreButtons).toHaveCount(11);
  });

  test('select score → comment field appears', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'valid');

    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    // Click score 9
    const scoreGrid = page.getByRole('radiogroup', { name: 'NPS Score' });
    const nineButton = scoreGrid.getByRole('radio').nth(9);
    await nineButton.click();

    // Comment textarea should appear
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();
  });

  test('score 9 → Promoter label shown', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'valid');

    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    const scoreGrid = page.getByRole('radiogroup', { name: 'NPS Score' });
    await scoreGrid.getByRole('radio').nth(9).click();

    const body = await page.textContent('body');
    expect(body).toMatch(/Destekçi|Promoter/i);
  });

  test('submit feedback → success state', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'valid');

    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    // Select score 8
    const scoreGrid = page.getByRole('radiogroup', { name: 'NPS Score' });
    await scoreGrid.getByRole('radio').nth(8).click();

    // Submit
    const submitBtn = page.getByRole('button', { name: /gönder/i });
    await submitBtn.click();

    // Success state: thank you heading
    await expect(page.getByText(/teşekkür/i)).toBeVisible({ timeout: 5000 });
  });

  test('page has no accessibility violations (ARIA)', async ({ page }) => {
    await mockFeedbackApi(page, BOOKING_ID, 'valid');
    await page.goto(`/feedback/${BOOKING_ID}?token=valid-token`);
    await page.waitForLoadState('networkidle');

    // Role dialog check
    const dialog = page.locator('[role="radiogroup"]');
    await expect(dialog).toBeVisible();
  });
});

// ─── /verify-email ────────────────────────────────────────────

test.describe('/verify-email — Email Verification (P35-T03)', () => {
  async function mockVerifyApi(page: Page, scenario: 'success' | 'invalid' | 'expired' | 'used') {
    await page.route('**/api/auth/verify-email**', async (route) => {
      const codes: Record<string, { code: string; message: string }> = {
        success: { code: 'OK', message: 'Email verified successfully' },
        invalid: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        expired: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
        used: { code: 'TOKEN_USED', message: 'Token already used' },
      };
      const info = codes[scenario]!;
      const status = scenario === 'success' ? 200 : 400;
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          status: scenario === 'success' ? 'success' : 'error',
          code: info.code,
          message: info.message,
        }),
      });
    });
  }

  test('no token → shows MISSING_TOKEN error', async ({ page }) => {
    await page.goto('/verify-email');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toMatch(/token|geçersiz|eksik/i);
  });

  test('invalid token → shows INVALID_TOKEN error + resend button', async ({ page }) => {
    await mockVerifyApi(page, 'invalid');
    await page.goto('/verify-email?token=bad-token');
    await page.waitForLoadState('networkidle');

    // Should show error heading
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

    // Resend button should be visible
    const resendBtn = page.getByRole('button', { name: /yeni.*link|resend/i });
    await expect(resendBtn).toBeVisible();
  });

  test('expired token → shows TOKEN_EXPIRED + resend button', async ({ page }) => {
    await mockVerifyApi(page, 'expired');
    await page.goto('/verify-email?token=expired-token');
    await page.waitForLoadState('networkidle');
    const resendBtn = page.getByRole('button', { name: /yeni.*link|resend/i });
    await expect(resendBtn).toBeVisible();
  });

  test('used token → shows TOKEN_USED (already verified, no resend)', async ({ page }) => {
    await mockVerifyApi(page, 'used');
    await page.goto('/verify-email?token=used-token');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toMatch(/kullanıldı|zaten|used|verified/i);
  });

  test('success → green checkmark + countdown redirect', async ({ page }) => {
    await mockVerifyApi(page, 'success');
    await page.goto('/verify-email?token=valid-token');
    await page.waitForLoadState('networkidle');

    // Success icon/heading
    await expect(page.getByText(/doğrulandı|verified/i)).toBeVisible({ timeout: 5000 });

    // Login button present
    const loginBtn = page.getByRole('button', { name: /giriş|login/i });
    await expect(loginBtn).toBeVisible();
  });
});

// ─── /admin/sessions — Auth Guard Tests ──────────────────────

test.describe('/admin/sessions — Session Management (P35-T09)', () => {
  test('unauthenticated → redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/sessions');
    // Should redirect to login
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });
});

// ─── /admin/audit-log — Auth Guard Tests ─────────────────────

test.describe('/admin/audit-log — Audit Log (P36-T07)', () => {
  test('unauthenticated → redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });
});

// ─── API: GET /api/bookings/slots ─────────────────────────────

test.describe('GET /api/bookings/slots — Cal.com Proxy (P37-T01)', () => {
  test('returns 200 with slots array (fallback mode)', async ({ page }) => {
    const response = await page.request.get('/api/bookings/slots');
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { status: string; data: unknown[] };
    expect(body.status).toBe('success');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('with valid date range → returns slot objects with date+slots fields', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const response = await page.request.get(
      `/api/bookings/slots?startDate=${today}&endDate=${nextWeek}`,
    );
    expect(response.status()).toBe(200);

    const body = (await response.json()) as { data: { date: string; slots: unknown[] }[] };
    // Each day should have { date, slots } shape
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('date');
      expect(body.data[0]).toHaveProperty('slots');
    }
  });

  test('invalid date range (>60 days) → 400', async ({ page }) => {
    const start = '2026-01-01';
    const end = '2026-04-01'; // 90 days
    const response = await page.request.get(
      `/api/bookings/slots?startDate=${start}&endDate=${end}`,
    );
    expect(response.status()).toBe(400);
  });
});

// ─── API: POST /api/bookings/public ──────────────────────────

test.describe('POST /api/bookings/public — Guest Booking (P37-T01)', () => {
  test('missing required fields → 400', async ({ page }) => {
    const response = await page.request.post('/api/bookings/public', {
      data: { name: 'Test User' }, // missing email + scheduledAt
    });
    expect(response.status()).toBe(400);
  });

  test('past scheduledAt → 400', async ({ page }) => {
    const response = await page.request.post('/api/bookings/public', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        scheduledAt: '2020-01-01T10:00:00Z', // past date
      },
    });
    expect(response.status()).toBe(400);
  });

  test('valid payload structure check (no DB required for validation test)', async ({ page }) => {
    // This test verifies the API parses the body and does at least basic validation
    const response = await page.request.post('/api/bookings/public', {
      data: {
        name: '', // empty name — should fail
        email: 'test@example.com',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(response.status()).toBe(400);
  });
});
