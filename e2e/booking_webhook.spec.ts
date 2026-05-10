/**
 * E2E: Cal.com Booking Webhook — HMAC Signature Verification
 *
 * Tests POST /api/webhooks/cal against the mock server.
 * The mock server is started with MOCK_CAL_SECRET=e2e-test-webhook-secret
 * (see playwright.config.ts webServer command), so it enforces HMAC-SHA256
 * signature verification matching the real server behavior.
 *
 * Signature format: HMAC-SHA256(JSON.stringify(body), secret) — hex string
 * Header: X-Cal-Signature-256
 *
 * Test matrix:
 *   ✓ Valid HMAC signature   → 200 { status: 'ok', received: true }
 *   ✓ Invalid signature      → 401 INVALID_SIGNATURE
 *   ✓ Missing signature      → 401 MISSING_SIGNATURE
 *   ✓ Unknown triggerEvent   → 200 (accepted, not an error)
 *   ✓ BOOKING_CREATED event  → 200
 *   ✓ BOOKING_CANCELLED      → 200
 *   ✓ BOOKING_RESCHEDULED    → 200
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const MOCK_API = 'http://localhost:3099';
const WEBHOOK_SECRET = 'e2e-test-webhook-secret';

function signPayload(body: unknown): string {
  const raw = JSON.stringify(body);
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
}

const BOOKING_CREATED_PAYLOAD = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    uid: 'cal-uid-001',
    title: 'Strategy Consultation',
    startTime: '2026-06-01T10:00:00.000Z',
    endTime: '2026-06-01T11:00:00.000Z',
    attendees: [{ email: 'client@example.com', name: 'Test Client' }],
    metadata: { ecyproBookingId: 'mock-booking-uuid' },
  },
};

test.describe('Cal.com webhook — HMAC signature verification', () => {
  test('valid HMAC signature → 200 accepted', async ({ request }) => {
    const body = BOOKING_CREATED_PAYLOAD;
    const sig = signPayload(body);

    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: body,
      headers: { 'X-Cal-Signature-256': sig },
    });

    expect(res.status()).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toMatchObject({ status: 'ok', received: true });
  });

  test('invalid HMAC signature → 401', async ({ request }) => {
    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: BOOKING_CREATED_PAYLOAD,
      headers: { 'X-Cal-Signature-256': 'deadbeefdeadbeefdeadbeef' },
    });

    expect(res.status()).toBe(401);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toMatchObject({ status: 'error', code: 'INVALID_SIGNATURE' });
  });

  test('missing X-Cal-Signature-256 header → 401', async ({ request }) => {
    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: BOOKING_CREATED_PAYLOAD,
    });

    expect(res.status()).toBe(401);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toMatchObject({ status: 'error', code: 'MISSING_SIGNATURE' });
  });

  test('BOOKING_CANCELLED event with valid sig → 200', async ({ request }) => {
    const body = {
      triggerEvent: 'BOOKING_CANCELLED',
      payload: {
        uid: 'cal-uid-002',
        metadata: { ecyproBookingId: 'mock-booking-uuid' },
        cancellationReason: 'Client request',
      },
    };
    const sig = signPayload(body);

    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: body,
      headers: { 'X-Cal-Signature-256': sig },
    });

    expect(res.status()).toBe(200);
  });

  test('BOOKING_RESCHEDULED event with valid sig → 200', async ({ request }) => {
    const body = {
      triggerEvent: 'BOOKING_RESCHEDULED',
      payload: {
        uid: 'cal-uid-003',
        startTime: '2026-06-15T14:00:00.000Z',
        endTime: '2026-06-15T15:00:00.000Z',
        metadata: { ecyproBookingId: 'mock-booking-uuid' },
      },
    };
    const sig = signPayload(body);

    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: body,
      headers: { 'X-Cal-Signature-256': sig },
    });

    expect(res.status()).toBe(200);
  });

  test('unknown triggerEvent with valid sig → 200 accepted', async ({ request }) => {
    const body = {
      triggerEvent: 'BOOKING_UNKNOWN_FUTURE_EVENT',
      payload: { uid: 'cal-uid-999' },
    };
    const sig = signPayload(body);

    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: body,
      headers: { 'X-Cal-Signature-256': sig },
    });

    expect(res.status()).toBe(200);
  });

  test('signature with sha256= prefix is accepted', async ({ request }) => {
    const body = BOOKING_CREATED_PAYLOAD;
    const raw = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    const sig = `sha256=${raw}`;

    const res = await request.post(`${MOCK_API}/api/webhooks/cal`, {
      data: body,
      headers: { 'X-Cal-Signature-256': sig },
    });

    expect(res.status()).toBe(200);
  });
});
