import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

vi.mock('../config/redis', () => ({
  redis: { status: 'end' },
}));

vi.mock('../config/db', () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Bypass rate limiting — rate limit behavior is tested in rateLimiter.test.ts.
vi.mock('../middleware/rateLimiter', () => ({
  contactLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  createRateLimiter: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { errorHandler } from '../middleware/error';
import newsletterRoutes from './newsletter';
import { prisma } from '../config/db';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/newsletter', newsletterRoutes);
  app.use(errorHandler);
  return app;
}

// ── POST /newsletter/subscribe ────────────────────────────────────────────────

describe('POST /newsletter/subscribe', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 201 SUBSCRIBED for a new email', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue({} as never);

    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'new@example.com', consent: true });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('SUBSCRIBED');
  });

  it('returns 200 ALREADY_SUBSCRIBED for an existing active subscription', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      unsubscribedAt: null,
      consent: true,
      source: null,
      ip: null,
      userAgent: null,
      createdAt: new Date(),
    } as never);

    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'existing@example.com', consent: true });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('ALREADY_SUBSCRIBED');
  });

  it('returns 200 RESUBSCRIBED for a previously unsubscribed email', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
      id: '2',
      email: 'returning@example.com',
      unsubscribedAt: new Date('2024-01-01'),
      consent: true,
      source: null,
      ip: null,
      userAgent: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValue({} as never);

    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'returning@example.com', consent: true });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('RESUBSCRIBED');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/newsletter/subscribe').send({ consent: true });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'not-an-email', consent: true });

    expect(res.status).toBe(400);
  });

  it('returns 400 when consent is false', async () => {
    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'test@example.com', consent: false });

    expect(res.status).toBe(400);
  });

  it('returns 400 when consent is missing', async () => {
    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });

  it('stores email in lowercase', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue({} as never);

    await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'UPPER@EXAMPLE.COM', consent: true });

    expect(prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'upper@example.com' } }),
    );
  });

  it('passes optional source field through', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue({} as never);

    const res = await request(app)
      .post('/newsletter/subscribe')
      .send({ email: 'new@example.com', consent: true, source: 'hero-cta' });

    expect(res.status).toBe(201);
    expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'hero-cta' }),
      }),
    );
  });
});

// ── GET /newsletter/stats ─────────────────────────────────────────────────────

describe('GET /newsletter/stats', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with total count', async () => {
    vi.mocked(prisma.newsletterSubscriber.count).mockResolvedValue(42);

    const res = await request(app).get('/newsletter/stats');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.total).toBe(42);
  });

  it('counts only active (non-unsubscribed) subscribers', async () => {
    vi.mocked(prisma.newsletterSubscriber.count).mockResolvedValue(10);

    await request(app).get('/newsletter/stats');

    expect(prisma.newsletterSubscriber.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { unsubscribedAt: null },
      }),
    );
  });
});
