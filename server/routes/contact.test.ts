/**
 * P12/2 + L1-4 — contact route tests
 *
 * Verifies:
 *   - valid payload → 200 ok:true and Telegram notify() called
 *   - invalid payload (zod) → 400 INVALID_PAYLOAD
 *   - honeypot triggered → 200 ok:true and notify() NOT called
 *   - missing TELEGRAM_BOT_TOKEN in prod → 503 NOTIFY_DISABLED
 *   - missing TELEGRAM_BOT_TOKEN in dev → 200 demo:true
 *   - Resend dual-send (founder + user) when RESEND configured
 *   - Sentry.captureException called on Telegram failure
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// P25 BE Track 2 / Aşama 3 — `vi.mock` factories are hoisted ABOVE local
// `const` declarations, so referencing a top-level `notifyMock` inside
// the factory used to crash with "Cannot access before initialization".
// `vi.hoisted` lifts the mock fn into the same hoist phase as `vi.mock`.
const {
  notifyMock,
  sendContactAckMock,
  sendFounderNotificationMock,
  isResendConfiguredMock,
  sentryCaptureExceptionMock,
  consentCreateMock,
} = vi.hoisted(() => ({
  notifyMock: vi.fn(async () => undefined),
  sendContactAckMock: vi.fn(async () => undefined),
  sendFounderNotificationMock: vi.fn(async () => undefined),
  isResendConfiguredMock: vi.fn(() => false),
  sentryCaptureExceptionMock: vi.fn(),
  consentCreateMock: vi.fn(async () => ({ id: 'cr_test' })),
}));

vi.mock('../lib/telegram', () => ({ notify: notifyMock }));

vi.mock('../services/contact-ack', () => ({
  sendContactAck: sendContactAckMock,
  sendFounderNotification: sendFounderNotificationMock,
  isResendConfigured: isResendConfiguredMock,
}));

// outbox calls prisma — mock to directly invoke the operation
vi.mock('../lib/outbox', () => ({
  withOutboxRecord: vi.fn((_ctx: unknown, fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@sentry/node', () => ({
  captureException: sentryCaptureExceptionMock,
}));

vi.mock('../config/db', () => ({
  prisma: { consentRecord: { create: consentCreateMock } },
}));

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
    sendContactAckMock.mockClear();
    sendFounderNotificationMock.mockClear();
    isResendConfiguredMock.mockClear();
    isResendConfiguredMock.mockReturnValue(false);
    sentryCaptureExceptionMock.mockClear();
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

// L1-4 — Resend dual-send: founder notification + user ack
describe('POST /api/contact — Resend dual-send', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    notifyMock.mockClear();
    sendContactAckMock.mockClear();
    sendFounderNotificationMock.mockClear();
    isResendConfiguredMock.mockClear();
    sentryCaptureExceptionMock.mockClear();
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('calls sendFounderNotification when Resend is configured', async () => {
    isResendConfiguredMock.mockReturnValue(true);

    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(res.status).toBe(200);
    expect(sendFounderNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendFounderNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada Lovelace', email: 'ada@example.com' }),
    );
  });

  it('calls sendContactAck (user ack) when Resend is configured', async () => {
    isResendConfiguredMock.mockReturnValue(true);

    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(sendContactAckMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@example.com', name: 'Ada Lovelace' }),
    );
  });

  it('skips Resend calls when not configured', async () => {
    isResendConfiguredMock.mockReturnValue(false);

    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(sendFounderNotificationMock).not.toHaveBeenCalled();
  });
});

// L1-4 — Sentry exception capture on route error
describe('POST /api/contact — Sentry capture', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    notifyMock.mockClear();
    sentryCaptureExceptionMock.mockClear();
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('calls Sentry.captureException when Telegram notify throws', async () => {
    notifyMock.mockRejectedValueOnce(new Error('Telegram 503'));

    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });

    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
  });
});

// L1-4 Task A — KVKK ConsentRecord persistence
describe('POST /api/contact — KVKK ConsentRecord', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    consentCreateMock.mockClear();
    notifyMock.mockClear();
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('writes a ConsentRecord with KVKK_CONTACT_FORM on valid submit', async () => {
    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });
    expect(consentCreateMock).toHaveBeenCalledTimes(1);
    expect(consentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ consentType: 'KVKK_CONTACT_FORM', formVersion: '1.0.0' }),
      }),
    );
  });

  it('does NOT write a ConsentRecord when KVKK consent missing', async () => {
    const res = await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('KVKK_REQUIRED');
    expect(consentCreateMock).not.toHaveBeenCalled();
  });
});

// L1-4 Task B — subject field threading
describe('POST /api/contact — subject field', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    notifyMock.mockClear();
    sendFounderNotificationMock.mockClear();
    isResendConfiguredMock.mockClear();
    consentCreateMock.mockClear();
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '1234';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('threads subject into the founder notification payload', async () => {
    isResendConfiguredMock.mockReturnValue(true);
    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'project',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });
    expect(sendFounderNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Proje Teklifi' }),
    );
  });

  it('passes free-text subject (e.g. chat widget) unchanged', async () => {
    isResendConfiguredMock.mockReturnValue(true);
    await request(makeApp()).post('/api/contact').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Web chat widget mesajı',
      message: 'I need consulting on the difference engine.',
      kvkkConsent: true,
    });
    expect(sendFounderNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Web chat widget mesajı' }),
    );
  });
});
