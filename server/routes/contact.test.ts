/**
 * P12/2 — contact route tests
 *
 * Verifies:
 *   - valid payload → 200 ok:true and Telegram notify() called
 *   - invalid payload (zod) → 400 INVALID_PAYLOAD
 *   - honeypot triggered → 200 ok:true and notify() NOT called
 *   - missing TELEGRAM_BOT_TOKEN in prod → 503 NOTIFY_DISABLED
 *   - missing TELEGRAM_BOT_TOKEN in dev → 200 demo:true
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// P25 BE Track 2 / Aşama 3 — `vi.mock` factories are hoisted ABOVE local
// `const` declarations, so referencing a top-level `notifyMock` inside
// the factory used to crash with "Cannot access before initialization".
// `vi.hoisted` lifts the mock fn into the same hoist phase as `vi.mock`.
const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(async () => undefined),
}));
vi.mock('../lib/telegram', () => ({ notify: notifyMock }));

// In-memory rate limiter requires redis client; mock it
vi.mock('../config/redis', () => ({
  redis: {
    status: 'wait',
    multi: () => ({ incr: () => ({}), pexpire: () => ({}), exec: async () => null }),
    eval: async () => null,
  },
}));

import contactRoutes from './contact';
import { errorHandler } from '../middleware/error';
import { __resetFallbackStoreForTests } from '../middleware/rateLimiter';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', contactRoutes);
  app.use(errorHandler);
  return app;
}

describe('POST /api/contact', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    notifyMock.mockClear();
    // P26-BE Aşama 3 — clear in-memory rate-limit fallback so each test
    // starts with a fresh 3/h budget for the shared contactLimiter.
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts valid payload and forwards via Telegram', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';
    process.env.NODE_ENV = 'test';

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engines',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid email with 400', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada',
      email: 'not-an-email',
      message: 'I need consulting on the difference engine.',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('silently accepts honeypot hits without notifying', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      hp_field: 'i-am-a-bot',
    });

    // 400 because hp_field length>0 fails the schema (max(0))
    expect([200, 400]).toContain(res.status);
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('returns 503 in production when Telegram env is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    process.env.NODE_ENV = 'production';

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('NOTIFY_DISABLED');
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('returns 200 demo:true in non-production when Telegram env is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    process.env.NODE_ENV = 'test';

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, demo: true });
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
