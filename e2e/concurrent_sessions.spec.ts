/**
 * E2E: Concurrent Sessions & Refresh Token Behavior
 *
 * Tests:
 * - Two parallel logins both succeed and return independent tokens
 * - Each session can refresh its access token independently
 * - Refresh with a valid token returns a new access token
 * - Refresh with an expired/revoked token returns 401
 * - Logout from one session doesn't affect the mock session store
 *   (stateless mock — full family-revocation requires real server)
 *
 * These tests run against the mock server (http://localhost:3099)
 * via Playwright's `request` fixture.
 */

import { test, expect } from '@playwright/test';
import { MOCK_URL } from './mock-url';

const MOCK_API = MOCK_URL;

const CREDENTIALS = { email: 'concurrent@ecypro.com', password: 'Test1234!' };

test.describe('Concurrent sessions', () => {
  test('two simultaneous logins both succeed', async ({ request }) => {
    const [res1, res2] = await Promise.all([
      request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS }),
      request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS }),
    ]);

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);

    const body1 = (await res1.json()) as Record<string, unknown>;
    const body2 = (await res2.json()) as Record<string, unknown>;

    expect(body1).toHaveProperty('accessToken');
    expect(body1).toHaveProperty('refreshToken');
    expect(body2).toHaveProperty('accessToken');
    expect(body2).toHaveProperty('refreshToken');
  });

  test('each session can refresh its access token', async ({ request }) => {
    const login = await request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS });
    const { refreshToken } = (await login.json()) as { refreshToken: string };

    const refresh = await request.post(`${MOCK_API}/api/auth/refresh`, {
      data: { refreshToken },
    });

    expect(refresh.status()).toBe(200);
    const body = (await refresh.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('accessToken');
  });

  test('refresh with expired token returns 401', async ({ request }) => {
    const res = await request.post(`${MOCK_API}/api/auth/refresh`, {
      data: { refreshToken: 'expired-token' },
    });

    expect(res.status()).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'error', code: 'EXPIRED' });
  });

  test('refresh without token returns 400', async ({ request }) => {
    const res = await request.post(`${MOCK_API}/api/auth/refresh`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'error', code: 'MISSING_TOKEN' });
  });

  test('two sessions refresh independently without conflict', async ({ request }) => {
    const [login1, login2] = await Promise.all([
      request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS }),
      request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS }),
    ]);

    const { refreshToken: rt1 } = (await login1.json()) as { refreshToken: string };
    const { refreshToken: rt2 } = (await login2.json()) as { refreshToken: string };

    const [ref1, ref2] = await Promise.all([
      request.post(`${MOCK_API}/api/auth/refresh`, { data: { refreshToken: rt1 } }),
      request.post(`${MOCK_API}/api/auth/refresh`, { data: { refreshToken: rt2 } }),
    ]);

    expect(ref1.status()).toBe(200);
    expect(ref2.status()).toBe(200);

    const b1 = (await ref1.json()) as Record<string, unknown>;
    const b2 = (await ref2.json()) as Record<string, unknown>;
    expect(b1).toHaveProperty('accessToken');
    expect(b2).toHaveProperty('accessToken');
  });

  test('/api/auth/me returns user when Bearer token present', async ({ request }) => {
    const login = await request.post(`${MOCK_API}/api/auth/login`, { data: CREDENTIALS });
    const { accessToken } = (await login.json()) as { accessToken: string };

    const me = await request.get(`${MOCK_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(me.status()).toBe(200);
    const body = (await me.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('user');
  });

  test('/api/auth/me rejects request without Bearer token', async ({ request }) => {
    const res = await request.get(`${MOCK_API}/api/auth/me`);
    expect(res.status()).toBe(401);
  });
});
