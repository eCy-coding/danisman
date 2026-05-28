/**
 * L1-3 — Discovery form backend route tests
 *
 * Verifies:
 *   - valid payload + KVKK consent → 200, ConsentRecord created
 *   - missing KVKK consent → 400 KVKK_REQUIRED
 *   - invalid email → 400 INVALID_PAYLOAD
 *   - missing required fields → 400 INVALID_PAYLOAD
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(async () => undefined),
}));
vi.mock('../lib/telegram', () => ({ notify: notifyMock }));

vi.mock('../config/redis', () => ({
  redis: {
    status: 'wait',
    multi: () => ({ incr: () => ({}), pexpire: () => ({}), exec: async () => null }),
    eval: async () => null,
  },
}));

const { prismaCreateMock } = vi.hoisted(() => ({
  prismaCreateMock: vi.fn(async () => ({ id: 'cr_test' })),
}));
vi.mock('../config/db', () => ({
  prisma: {
    consentRecord: {
      create: prismaCreateMock,
    },
  },
}));

vi.mock('../services/notion', () => ({
  upsertProspect: vi.fn(async () => ({ id: 'notion_test' })),
}));

vi.mock('../services/contact-ack', () => ({
  sendContactAck: vi.fn(async () => undefined),
  isResendConfigured: vi.fn(() => false),
}));

vi.mock('../lib/posthog-server', () => ({
  capture: vi.fn(async () => undefined),
}));

vi.mock('../lib/outbox', () => ({
  withOutboxRecord: vi.fn(async (_meta: unknown, fn: () => Promise<unknown>) => fn()),
}));

import discoveryRoutes from './discovery';
import { errorHandler } from '../middleware/error';
import { __resetFallbackStoreForTests } from '../middleware/rateLimiter';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/discovery', discoveryRoutes);
  app.use(errorHandler);
  return app;
}

const VALID_PAYLOAD = {
  name: 'Ahmet Yılmaz',
  email: 'ahmet@sirket.com',
  company: 'Yılmaz Holding',
  kvkkConsent: true,
};

describe('POST /api/v1/discovery', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    notifyMock.mockClear();
    prismaCreateMock.mockClear();
    __resetFallbackStoreForTests();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts valid payload with KVKK consent → 200', async () => {
    const res = await request(makeApp()).post('/api/v1/discovery').send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });

  it('creates ConsentRecord for SAT-01 on valid submission', async () => {
    await request(makeApp()).post('/api/v1/discovery').send(VALID_PAYLOAD);

    expect(prismaCreateMock).toHaveBeenCalledOnce();
    const callArg = prismaCreateMock.mock.calls[0][0];
    expect(callArg.data.consentType).toBe('KVKK_DISCOVERY_FORM');
  });

  it('rejects missing KVKK consent → 400 KVKK_REQUIRED', async () => {
    const res = await request(makeApp())
      .post('/api/v1/discovery')
      .send({ ...VALID_PAYLOAD, kvkkConsent: false });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('KVKK_REQUIRED');
  });

  it('rejects invalid email → 400 INVALID_PAYLOAD', async () => {
    const res = await request(makeApp())
      .post('/api/v1/discovery')
      .send({ ...VALID_PAYLOAD, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  it('rejects missing name → 400 INVALID_PAYLOAD', async () => {
    const res = await request(makeApp())
      .post('/api/v1/discovery')
      .send({ email: 'a@b.com', company: 'Test', kvkkConsent: true });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  it('accepts optional fields (sector, headcount, description)', async () => {
    const res = await request(makeApp())
      .post('/api/v1/discovery')
      .send({
        ...VALID_PAYLOAD,
        sector: 'Finans & Bankacılık',
        headcount: '51–250',
        description: 'M&A sürecinde stratejik danışmanlık arıyoruz.',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});
