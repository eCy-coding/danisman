/**
 * Admin webhooks route tests
 *
 * Cases:
 *   1. No auth → 401 (real authenticate middleware rejects)
 *   2. GET  /api/admin/webhooks               → 200 list (own where for USER)
 *   3. POST /api/admin/webhooks               → 201 created + secret returned once
 *   4. POST invalid url                       → 400
 *   5. POST invalid events                    → 400
 *   6. GET  /:id/deliveries non-owner USER    → 403 forbidden
 *   7. GET  /:id/deliveries missing sub       → 404 not_found
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    webhookSubscription: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    webhookDelivery: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Bypass Redis dependency
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

// Bypass jwt blacklist lookup used inside authenticate()
vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
}));

// enqueue() is exercised by the retry route; stub a deterministic mode
vi.mock('../queues', () => ({
  enqueue: vi.fn().mockResolvedValue({ mode: 'inline' }),
}));

import webhookRoutes from './admin-webhooks';
import { errorHandler } from '../middleware/error';

// ── Test utilities ────────────────────────────────────────────────────────────

// Mirrors the JWT_SECRET injected globally by vitest.server.config.ts — read,
// don't re-assign process.env (avoid any cross-file global mutation).
const JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';

function makeToken(userId: string, role = 'USER') {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/webhooks', webhookRoutes);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-test-1234';

const fakeSub = {
  id: 'sub-id-1',
  userId: USER_ID,
  url: 'https://example.com/hook',
  events: ['booking.created'],
  active: true,
  failureCount: 0,
  lastSuccess: null,
  lastFailure: null,
  createdAt: new Date(),
};

// ── 1. No auth → 401 ───────────────────────────────────────────────────────────

describe('Auth guard', () => {
  it('rejects requests without an Authorization header', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/admin/webhooks');
    expect(res.status).toBe(401);
  });
});

// ── 2. GET /api/admin/webhooks → list ─────────────────────────────────────────

describe('GET /api/admin/webhooks', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with subscriptions scoped to the requesting USER', async () => {
    prismaMock.webhookSubscription.findMany.mockResolvedValue([fakeSub]);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .get('/api/admin/webhooks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.subscriptions[0].id).toBe('sub-id-1');
    expect(prismaMock.webhookSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });
});

// ── 3 & 4 & 5. POST /api/admin/webhooks ───────────────────────────────────────

describe('POST /api/admin/webhooks', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('creates a subscription, returns 201 and the secret exactly once', async () => {
    prismaMock.webhookSubscription.create.mockResolvedValue(fakeSub);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/api/admin/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/hook', events: ['booking.created'] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.subscription.id).toBe('sub-id-1');
    expect(typeof res.body.secret).toBe('string');
    expect(prismaMock.webhookSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, active: true }),
      }),
    );
  });

  it('returns 400 for an invalid url', async () => {
    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/api/admin/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'ftp://nope', events: ['booking.created'] });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(prismaMock.webhookSubscription.create).not.toHaveBeenCalled();
  });

  it('returns 400 when events is not a string[]', async () => {
    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/api/admin/webhooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/hook', events: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});

// ── 6 & 7. GET /:id/deliveries — RBAC + 404 ───────────────────────────────────

describe('GET /api/admin/webhooks/:id/deliveries', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 403 when a non-owner USER requests another user subscription', async () => {
    prismaMock.webhookSubscription.findUnique.mockResolvedValue({ userId: 'someone-else' });

    const token = makeToken(USER_ID);
    const res = await request(app)
      .get('/api/admin/webhooks/sub-id-1/deliveries')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('forbidden');
    expect(prismaMock.webhookDelivery.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 when the subscription does not exist', async () => {
    prismaMock.webhookSubscription.findUnique.mockResolvedValue(null);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .get('/api/admin/webhooks/missing-id/deliveries')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('not_found');
  });
});
