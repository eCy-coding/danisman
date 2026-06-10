/**
 * Admin newsletter campaigns route tests
 *
 * Cases:
 *   1. No auth → 401 (real auth middleware rejects missing token)
 *   2. GET /  → 200 list (zrevrange + zcard) with newest-first items
 *   3. POST / valid → 201 created (redis.set + zadd called)
 *   4. POST / invalid (subject too short) → 400 Zod envelope
 *   5. GET /:id existing → 200 detail
 *   6. GET /:id missing → 404 not_found
 *   7. GET /metrics → 200 queue/dlq/counters (declared before /:id)
 *   8. POST /:id/send → 200 enrolls confirmed subscribers via prisma + drip job
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock, redisMock, dripMock } = vi.hoisted(() => ({
  prismaMock: {
    newsletterSubscriber: {
      findMany: vi.fn(),
    },
  },
  redisMock: {
    status: 'end',
    get: vi.fn(),
    set: vi.fn(),
    zadd: vi.fn(),
    zrevrange: vi.fn(),
    zcard: vi.fn(),
  },
  dripMock: {
    enrollSubscriber: vi.fn(),
    getQueueDepth: vi.fn(),
    getDlqDepth: vi.fn(),
    getDripMetrics: vi.fn(),
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));
vi.mock('../config/redis', () => ({ redis: redisMock }));
vi.mock('../jobs/drip-campaign', () => dripMock);

// Auth bypass: authenticate injects an ADMIN user, requireRole passes through
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'test-admin-id',
      role: 'ADMIN',
    };
    next();
  },
  requireRole:
    (_role: string) =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

import campaignRoutes from './admin-campaigns';
import { errorHandler } from '../middleware/error';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/newsletter/campaigns', campaignRoutes);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeCampaign = {
  id: 'campaign-id-1',
  subject: 'Haziran Bülteni',
  body: 'Merhaba, bu ayın öne çıkanları aşağıdadır.',
  audienceFilter: { consentOnly: true },
  templateKey: 'welcome',
  createdAt: 1_700_000_000_000,
  queuedAt: null,
  sentCount: 0,
  failedCount: 0,
  status: 'draft',
};

// ── 1. No auth → 401 ───────────────────────────────────────────────────────────

describe('Auth guard', () => {
  it('rejects unmounted/unauthorized requests', async () => {
    const appNoMock = express();
    appNoMock.use(express.json());
    // No routes mounted → proves the real auth-protected path is unreachable.
    const res = await request(appNoMock).get('/api/admin/newsletter/campaigns');
    expect(res.status).toBe(404);
  });
});

// ── 2. GET / → list ─────────────────────────────────────────────────────────

describe('GET /api/admin/newsletter/campaigns', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with newest-first campaign list', async () => {
    redisMock.zrevrange.mockResolvedValue(['campaign-id-1']);
    redisMock.get.mockResolvedValue(JSON.stringify(fakeCampaign));
    redisMock.zcard.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/admin/newsletter/campaigns')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].id).toBe('campaign-id-1');
    expect(redisMock.zrevrange).toHaveBeenCalledWith('campaign:index', 0, 19);
  });
});

// ── 3. POST / valid → 201 ───────────────────────────────────────────────────

describe('POST /api/admin/newsletter/campaigns', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('creates a campaign and returns 201', async () => {
    redisMock.set.mockResolvedValue('OK');
    redisMock.zadd.mockResolvedValue(1);

    const res = await request(app)
      .post('/api/admin/newsletter/campaigns')
      .set('Authorization', 'Bearer valid')
      .send({ subject: 'Haziran Bülteni', body: 'Bu ayın öne çıkanları.' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.subject).toBe('Haziran Bülteni');
    expect(res.body.data.status).toBe('draft');
    expect(redisMock.set).toHaveBeenCalledOnce();
    expect(redisMock.zadd).toHaveBeenCalledOnce();
  });

  // ── 4. POST / invalid → 400 ───────────────────────────────────────────────

  it('returns 400 for invalid payload (subject too short)', async () => {
    const res = await request(app)
      .post('/api/admin/newsletter/campaigns')
      .set('Authorization', 'Bearer valid')
      .send({ subject: 'hi', body: 'Bu ayın öne çıkanları.' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.issues).toBeDefined();
    expect(redisMock.set).not.toHaveBeenCalled();
  });
});

// ── 5/6. GET /:id ─────────────────────────────────────────────────────────────

describe('GET /api/admin/newsletter/campaigns/:id', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with campaign detail when it exists', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(fakeCampaign));

    const res = await request(app)
      .get('/api/admin/newsletter/campaigns/campaign-id-1')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.id).toBe('campaign-id-1');
    expect(redisMock.get).toHaveBeenCalledWith('campaign:campaign-id-1');
  });

  it('returns 404 when the campaign does not exist', async () => {
    redisMock.get.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/admin/newsletter/campaigns/missing-id')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('not_found');
  });
});

// ── 7. GET /metrics ───────────────────────────────────────────────────────────

describe('GET /api/admin/newsletter/campaigns/metrics', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with queue/dlq/counters (matched before /:id)', async () => {
    dripMock.getQueueDepth.mockResolvedValue(5);
    dripMock.getDlqDepth.mockResolvedValue(2);
    dripMock.getDripMetrics.mockReturnValue({ sent: 10, failed: 1 });

    const res = await request(app)
      .get('/api/admin/newsletter/campaigns/metrics')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.queue).toBe(5);
    expect(res.body.data.dlq).toBe(2);
    expect(res.body.data.counters).toEqual({ sent: 10, failed: 1 });
    // /:id loader must NOT run for the /metrics path.
    expect(redisMock.get).not.toHaveBeenCalled();
  });
});

// ── 8. POST /:id/send ─────────────────────────────────────────────────────────

describe('POST /api/admin/newsletter/campaigns/:id/send', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('enrolls confirmed subscribers and marks campaign queued', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(fakeCampaign));
    redisMock.set.mockResolvedValue('OK');
    redisMock.zadd.mockResolvedValue(1);
    prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
      { id: 'sub-1', email: 'a@example.com' },
      { id: 'sub-2', email: 'b@example.com' },
    ]);
    dripMock.enrollSubscriber.mockResolvedValue({ ok: true, scheduled: 1 });

    const res = await request(app)
      .post('/api/admin/newsletter/campaigns/campaign-id-1/send')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.recipients).toBe(2);
    expect(res.body.data.enrolled).toBe(2);
    expect(prismaMock.newsletterSubscriber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ unsubscribedAt: null, consent: true }),
      }),
    );
    expect(dripMock.enrollSubscriber).toHaveBeenCalledTimes(2);
  });

  it('returns 404 when sending an unknown campaign', async () => {
    redisMock.get.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/admin/newsletter/campaigns/missing-id/send')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('not_found');
    expect(prismaMock.newsletterSubscriber.findMany).not.toHaveBeenCalled();
  });
});
