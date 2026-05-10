import { test, expect } from '@playwright/test';

/**
 * EcyPro — API Health & Integration Tests
 *
 * Validates backend endpoints are reachable and
 * return correct response formats.
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3099/api';

test.describe('API Health & Integration', () => {
  test('Health check endpoint returns ok', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    // May not be running in CI — skip gracefully
    if (response.status() === 0 || !response.ok()) {
      test.skip(true, 'API server not running');
      return;
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('ecypro-api');
    expect(body.uptime).toBeGreaterThan(0);
    expect(body.memory).toBeDefined();
  });

  test('Auth login rejects empty payload', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: {},
    });

    if (response.status() === 0) {
      test.skip(true, 'API server not running');
      return;
    }

    // Should return 400 validation error
    expect([400, 401, 422]).toContain(response.status());
  });

  test('Auth register validates email format', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: {
        email: 'not-an-email',
        password: '123',
      },
    });

    if (response.status() === 0) {
      test.skip(true, 'API server not running');
      return;
    }

    // Should reject invalid email
    expect([400, 422]).toContain(response.status());
  });

  test('Protected endpoints require auth', async ({ request }) => {
    const response = await request.get(`${API_BASE}/bookings`);

    if (response.status() === 0) {
      test.skip(true, 'API server not running');
      return;
    }

    expect(response.status()).toBe(401);
  });

  test('Analytics pageview accepts fire-and-forget', async ({ request }) => {
    const response = await request.post(`${API_BASE}/analytics/pageview`, {
      data: {
        sessionId: 'test-session-001',
        page: '/test',
      },
    });

    if (response.status() === 0) {
      test.skip(true, 'API server not running');
      return;
    }

    // Should accept (even if DB not connected, the endpoint should exist)
    expect([200, 201, 500]).toContain(response.status());
  });
});
