/**
 * P15-BE Aşama 6: verify-webhook middleware tests.
 *
 * Focus areas:
 *   - Constant-time signature verification matches the contract
 *   - Raw-body capture honours byte-perfect fidelity
 *   - Missing-secret behaviour differs by NODE_ENV
 *   - Each provider's parseSignature hook accepts its real-world format
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../config/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { captureRawBody, verifyWebhook } from './verify-webhook';

function mockReq(headers: Record<string, string>, rawBody?: Buffer): Request {
  return {
    headers,
    rawBody,
  } as unknown as Request;
}

function mockRes(): Response & { _status?: number; _json?: unknown } {
  const res: Response & { _status?: number; _json?: unknown } = {} as never;
  res.status = vi.fn((s: number) => {
    res._status = s;
    return res;
  }) as never;
  res.json = vi.fn((b: unknown) => {
    res._json = b;
    return res;
  }) as never;
  return res;
}

function signHex(secret: string, body: Buffer): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.CAL_COM_WEBHOOK_SECRET;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.GITHUB_WEBHOOK_SECRET;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('verifyWebhook — Cal.com', () => {
  it('accepts a request signed against the raw body bytes', () => {
    const secret = 'cal-test-secret';
    process.env.CAL_COM_WEBHOOK_SECRET = secret;
    process.env.NODE_ENV = 'production';

    const raw = Buffer.from('{"triggerEvent":"BOOKING_CREATED","payload":{}}');
    const sig = signHex(secret, raw);

    const req = mockReq({ 'x-cal-signature-256': sig }, raw);
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeUndefined();
  });

  it('REGRESSION: a re-serialised body (legacy bug) fails verification', () => {
    const secret = 'cal-test-secret';
    process.env.CAL_COM_WEBHOOK_SECRET = secret;
    process.env.NODE_ENV = 'production';

    // The provider signs the bytes "{\"a\":1,\"b\":2}" exactly. The
    // legacy code re-serialised the parsed object and could produce
    // "{\"b\":2,\"a\":1}" — different bytes, different HMAC.
    const upstreamBytes = Buffer.from('{"a":1,"b":2}');
    const legacyReserialised = Buffer.from('{"b":2,"a":1}');
    const sig = signHex(secret, upstreamBytes);

    // Middleware sees the WRONG rawBody (simulating the legacy bug).
    const req = mockReq({ 'x-cal-signature-256': sig }, legacyReserialised);
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('rejects a tampered signature', () => {
    process.env.CAL_COM_WEBHOOK_SECRET = 'cal-test-secret';
    process.env.NODE_ENV = 'production';

    const raw = Buffer.from('{}');
    const req = mockReq({ 'x-cal-signature-256': 'deadbeef' }, raw);
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._json).toMatchObject({ code: 'INVALID_SIGNATURE' });
  });

  it('rejects a missing signature header', () => {
    process.env.CAL_COM_WEBHOOK_SECRET = 'cal-test-secret';
    process.env.NODE_ENV = 'production';

    const req = mockReq({}, Buffer.from('{}'));
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when rawBody capture is missing (server bug)', () => {
    process.env.CAL_COM_WEBHOOK_SECRET = 'cal-test-secret';
    process.env.NODE_ENV = 'production';

    const sig = signHex('cal-test-secret', Buffer.from('{}'));
    const req = mockReq({ 'x-cal-signature-256': sig }, undefined);
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({ code: 'RAW_BODY_UNAVAILABLE' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 in production when the secret is unset', () => {
    process.env.NODE_ENV = 'production';
    const req = mockReq({ 'x-cal-signature-256': 'anything' }, Buffer.from('{}'));
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(res._status).toBe(503);
    expect(res._json).toMatchObject({ code: 'WEBHOOK_MISCONFIGURED' });
    expect(next).not.toHaveBeenCalled();
  });

  it('falls through in non-production when the secret is unset (dev ergonomics)', () => {
    process.env.NODE_ENV = 'development';
    const req = mockReq({}, Buffer.from('{}'));
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('calcom')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res._status).toBeUndefined();
  });
});

describe('verifyWebhook — Stripe parseSignature', () => {
  it('extracts v1 from a Stripe-formatted header', () => {
    const secret = 'stripe-test';
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    process.env.NODE_ENV = 'production';

    const raw = Buffer.from('{"id":"evt_1"}');
    const sig = signHex(secret, raw);
    const stripeHeader = `t=1700000000,v1=${sig},v0=ignored`;

    const req = mockReq({ 'stripe-signature': stripeHeader }, raw);
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('stripe')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects a Stripe header without a v1 chunk', () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'stripe-test';
    process.env.NODE_ENV = 'production';

    const req = mockReq({ 'stripe-signature': 't=1700000000,v0=abc' }, Buffer.from('{}'));
    const res = mockRes();
    const next: NextFunction = vi.fn();

    verifyWebhook('stripe')(req, res, next);

    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('captureRawBody', () => {
  it('stores the captured buffer on req.rawBody', () => {
    const req = {} as Request & { rawBody?: Buffer };
    const res = {} as Response;
    const buf = Buffer.from('hello');
    captureRawBody(req, res, buf);
    expect(req.rawBody?.equals(buf)).toBe(true);
  });

  it('is a no-op for empty bodies', () => {
    const req = {} as Request & { rawBody?: Buffer };
    captureRawBody(req, {} as Response, Buffer.alloc(0));
    expect(req.rawBody).toBeUndefined();
  });
});
