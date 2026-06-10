/**
 * P55.A2 — newsletter-lifecycle route tests
 *
 * Verifies:
 *   - GET /confirm/:token valid → 302 /newsletter/confirmed + subscriber update + drip enroll
 *   - GET /confirm/:token already-confirmed → 302 /newsletter/confirmed, no update
 *   - GET /confirm/:token unknown email → 302 /newsletter/not-found
 *   - GET /confirm/:token invalid/expired/wrong-action token → 302 /newsletter/invalid-token
 *   - GET /unsubscribe/:token valid → 302 /newsletter/unsubscribed + update
 *   - GET /unsubscribe/:token invalid token → 302 /newsletter/invalid-token
 *   - POST /feedback valid → 204; invalid → 400
 *
 * The HMAC secret + APP_URL must exist BEFORE the route module loads (it
 * captures process.env.NEWSLETTER_HMAC_SECRET / APP_URL into module-level
 * constants at import time). Static ESM imports are hoisted above plain
 * statements, so we set them inside vi.hoisted() which runs first.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Set via vi.stubEnv so vi.unstubAllEnvs() restores the originals after this
// file — a bare `process.env.X = ...` bleeds into sibling suites in the same
// worker (e.g. APP_URL/HMAC) and flips unrelated tests in the full run.
vi.hoisted(() => {
  vi.stubEnv('NEWSLETTER_HMAC_SECRET', 'test-hmac-secret');
  vi.stubEnv('APP_URL', 'https://www.ecypro.com');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

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
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Bypass rate limiting — rate limit behavior is tested in rateLimiter.test.ts.
vi.mock('../middleware/rateLimiter', () => ({
  contactLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  createRateLimiter: vi.fn(),
}));

const { enrollSubscriberMock } = vi.hoisted(() => ({
  enrollSubscriberMock: vi.fn(async () => undefined),
}));

vi.mock('../jobs/drip-campaign', () => ({
  enrollSubscriber: enrollSubscriberMock,
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { errorHandler } from '../middleware/error';
import lifecycleRoutes, {
  generateConfirmToken,
  generateUnsubscribeToken,
} from './newsletter-lifecycle';
import { prisma } from '../config/db';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/newsletter', lifecycleRoutes);
  app.use(errorHandler);
  return app;
}

function subscriber(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_1',
    email: 'reader@example.com',
    unsubscribedAt: null,
    consent: false,
    source: null,
    ip: null,
    userAgent: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── GET /newsletter/confirm/:token ──────────────────────────────────────────────

describe('GET /newsletter/confirm/:token', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('confirms a valid token → 302 confirmed, updates consent + enrolls drip', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(
      subscriber({ consent: false }) as never,
    );
    vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValue({} as never);

    const token = generateConfirmToken('reader@example.com');
    const res = await request(app).get(`/newsletter/confirm/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/confirmed');
    expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'reader@example.com' },
        data: { consent: true, unsubscribedAt: null },
      }),
    );
    expect(enrollSubscriberMock).toHaveBeenCalledTimes(1);
  });

  it('skips update when subscriber is already confirmed', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(
      subscriber({ consent: true }) as never,
    );

    const token = generateConfirmToken('reader@example.com');
    const res = await request(app).get(`/newsletter/confirm/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/confirmed');
    expect(prisma.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it('redirects to not-found when subscriber does not exist', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

    const token = generateConfirmToken('ghost@example.com');
    const res = await request(app).get(`/newsletter/confirm/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/not-found');
    expect(prisma.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it('redirects to invalid-token for a malformed token', async () => {
    const res = await request(app).get('/newsletter/confirm/not.a.valid.token');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/invalid-token');
    expect(prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });

  it('redirects to invalid-token when an unsubscribe token is used on confirm', async () => {
    const token = generateUnsubscribeToken('reader@example.com');
    const res = await request(app).get(`/newsletter/confirm/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/invalid-token');
    expect(prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });
});

// ── GET /newsletter/unsubscribe/:token ──────────────────────────────────────────

describe('GET /newsletter/unsubscribe/:token', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('unsubscribes an active subscriber → 302 unsubscribed + update', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(
      subscriber({ unsubscribedAt: null }) as never,
    );
    vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValue({} as never);

    const token = generateUnsubscribeToken('reader@example.com');
    const res = await request(app).get(`/newsletter/unsubscribe/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      'https://www.ecypro.com/newsletter/unsubscribed?reason=optional',
    );
    expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'reader@example.com' },
        data: { unsubscribedAt: expect.any(Date) },
      }),
    );
  });

  it('is idempotent — skips update when already unsubscribed', async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(
      subscriber({ unsubscribedAt: new Date('2024-01-01') }) as never,
    );

    const token = generateUnsubscribeToken('reader@example.com');
    const res = await request(app).get(`/newsletter/unsubscribe/${token}`);

    expect(res.status).toBe(302);
    expect(prisma.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it('redirects to invalid-token for a tampered token', async () => {
    const token = generateUnsubscribeToken('reader@example.com');
    const tampered = `${token}tampered`;
    const res = await request(app).get(`/newsletter/unsubscribe/${tampered}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/invalid-token');
    expect(prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });

  it('redirects to invalid-token when a confirm token is used on unsubscribe', async () => {
    const token = generateConfirmToken('reader@example.com');
    const res = await request(app).get(`/newsletter/unsubscribe/${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://www.ecypro.com/newsletter/invalid-token');
    expect(prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });
});

// ── POST /newsletter/feedback ────────────────────────────────────────────────────

describe('POST /newsletter/feedback', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 204 for a valid feedback payload', async () => {
    const res = await request(app)
      .post('/newsletter/feedback')
      .send({ email: 'reader@example.com', category: 'too-frequent', reason: 'Too many emails' });

    expect(res.status).toBe(204);
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/newsletter/feedback')
      .send({ email: 'not-an-email', category: 'other' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown category', async () => {
    const res = await request(app)
      .post('/newsletter/feedback')
      .send({ email: 'reader@example.com', category: 'bogus-category' });

    expect(res.status).toBe(400);
  });
});
