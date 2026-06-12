/**
 * P82 Research Bridge — route tests.
 *
 * Covers: RBAC planes (JWT admin vs ApiKey bridge), payload validation,
 * atomic claim (race → single winner), stage PATCH, DONE → BlogPost(DRAFT)
 * materialisation incl. slug collision retry, and terminal-state guards.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks (hoisted before route import) ─────────────────────────────────────

const db = vi.hoisted(() => ({
  researchJob: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
  author: { findFirst: vi.fn() },
  blogPost: { create: vi.fn() },
}));

vi.mock('../config/db', () => ({ prisma: db }));
vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// JWT plane: header-driven user injection so the same app serves
// unauthenticated (401), wrong-role (403) and happy paths.
vi.mock('../middleware/auth', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction) => {
    const role = req.headers['x-test-role'];
    if (typeof role === 'string' && role.length > 0) {
      (req as Request & { user?: unknown }).user = { id: 'user-1', role };
    }
    next();
  },
}));

// Bridge plane: header-driven ApiKey context (scope checks happen inside the
// real middleware; here we simulate its two outcomes).
vi.mock('../middleware/api-key-auth', () => ({
  apiKeyAuth: () => (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-test-bridge'] === 'ok') {
      (req as Request & { apiKey?: unknown }).apiKey = {
        id: 'key-1',
        name: 'bridge',
        scopes: ['research:bridge'],
        userId: null,
        expiresAt: null,
      };
      return next();
    }
    res.status(401).json({ status: 'error', code: 'API_KEY_MISSING' });
  },
}));

import { adminResearchRouter, researchSlug } from './admin-research';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin/research', adminResearchRouter);
  return app;
}

const JOB = {
  id: 'job-1',
  status: 'QUEUED',
  topic: 'Türkiye fintech regülasyonu 2026',
  lang: 'tr',
  mode: 'fast',
  contentType: 'blog',
  primaryDomain: 'FINTECH',
  stageDetail: null,
  notebookId: null,
  sourceCount: null,
  reportTitle: null,
  postId: null,
  error: null,
  requestedById: 'user-1',
  claimedAt: null,
  finishedAt: null,
  createdAt: new Date('2026-06-12T10:00:00Z'),
  updatedAt: new Date('2026-06-12T10:00:00Z'),
};

const DRAFT = {
  titleTr: 'Fintech Regülasyonunda 2026 Görünümü',
  excerptTr: 'NotebookLM derin araştırmasından derlenen regülasyon özeti ve etki analizi.',
  bodyTrMdx: 'x'.repeat(150),
  sources: [{ title: 'BDDK raporu', url: 'https://example.com/bddk' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  db.auditLog.create.mockResolvedValue({ id: 'audit-1' });
});

// ─── JWT plane ────────────────────────────────────────────────────────────────

describe('POST /jobs (admin plane)', () => {
  it('401 without user', async () => {
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs')
      .send({ topic: 'valid topic here' });
    expect(res.status).toBe(401);
  });

  it('403 for VIEWER', async () => {
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs')
      .set('x-test-role', 'VIEWER')
      .send({ topic: 'valid topic here' });
    expect(res.status).toBe(403);
  });

  it('400 on short topic', async () => {
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs')
      .set('x-test-role', 'EDITOR')
      .send({ topic: 'kısa' });
    expect(res.status).toBe(400);
  });

  it('201 creates job with requester id + audit log', async () => {
    db.researchJob.create.mockResolvedValue(JOB);
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs')
      .set('x-test-role', 'ADMIN')
      .send({ topic: JOB.topic, mode: 'fast', primaryDomain: 'FINTECH' });
    expect(res.status).toBe(201);
    expect(db.researchJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ topic: JOB.topic, requestedById: 'user-1' }),
    });
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });
});

describe('GET /jobs', () => {
  it('returns items + bridgeAlive=true when a non-queued job was touched recently', async () => {
    db.researchJob.findMany.mockResolvedValue([JOB]);
    db.researchJob.count.mockResolvedValue(1);
    db.researchJob.findFirst.mockResolvedValue({ updatedAt: new Date() });
    const res = await request(makeApp())
      .get('/api/v1/admin/research/jobs')
      .set('x-test-role', 'EDITOR');
    expect(res.status).toBe(200);
    expect(res.body.data.bridgeAlive).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('bridgeAlive=false when last touch is stale', async () => {
    db.researchJob.findMany.mockResolvedValue([]);
    db.researchJob.count.mockResolvedValue(0);
    db.researchJob.findFirst.mockResolvedValue({
      updatedAt: new Date(Date.now() - 10 * 60_000),
    });
    const res = await request(makeApp())
      .get('/api/v1/admin/research/jobs')
      .set('x-test-role', 'ADMIN');
    expect(res.body.data.bridgeAlive).toBe(false);
  });
});

describe('POST /jobs/:id/cancel', () => {
  it('409 when job is not QUEUED anymore', async () => {
    db.researchJob.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs/job-1/cancel')
      .set('x-test-role', 'ADMIN');
    expect(res.status).toBe(409);
  });

  it('200 cancels a queued job', async () => {
    db.researchJob.updateMany.mockResolvedValue({ count: 1 });
    const res = await request(makeApp())
      .post('/api/v1/admin/research/jobs/job-1/cancel')
      .set('x-test-role', 'EDITOR');
    expect(res.status).toBe(200);
  });
});

// ─── Bridge plane ─────────────────────────────────────────────────────────────

describe('POST /bridge/claim', () => {
  it('401 without bridge key', async () => {
    const res = await request(makeApp()).post('/api/v1/admin/research/bridge/claim');
    expect(res.status).toBe(401);
  });

  it('204 when queue empty', async () => {
    db.researchJob.findFirst.mockResolvedValue(null);
    const res = await request(makeApp())
      .post('/api/v1/admin/research/bridge/claim')
      .set('x-test-bridge', 'ok');
    expect(res.status).toBe(204);
  });

  it('claims oldest queued job atomically', async () => {
    db.researchJob.findFirst.mockResolvedValue(JOB);
    db.researchJob.updateMany.mockResolvedValue({ count: 1 });
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'CLAIMED' });
    const res = await request(makeApp())
      .post('/api/v1/admin/research/bridge/claim')
      .set('x-test-bridge', 'ok');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CLAIMED');
    expect(db.researchJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'QUEUED' },
      data: expect.objectContaining({ status: 'CLAIMED' }),
    });
  });

  it('204 when the optimistic update loses the race', async () => {
    db.researchJob.findFirst.mockResolvedValue(JOB);
    db.researchJob.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(makeApp())
      .post('/api/v1/admin/research/bridge/claim')
      .set('x-test-bridge', 'ok');
    expect(res.status).toBe(204);
  });
});

describe('PATCH /bridge/jobs/:id', () => {
  it('409 on terminal job', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'DONE' });
    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ stageDetail: 'late update' });
    expect(res.status).toBe(409);
  });

  it('updates stage fields in flight', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'CLAIMED' });
    db.researchJob.update.mockResolvedValue({ ...JOB, status: 'RESEARCHING' });
    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ status: 'RESEARCHING', stageDetail: 'Deep research running', sourceCount: 12 });
    expect(res.status).toBe(200);
    expect(db.researchJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RESEARCHING', sourceCount: 12 }),
      }),
    );
  });

  it('DONE without draft → 400', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'DRAFTING' });
    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ status: 'DONE' });
    expect(res.status).toBe(400);
  });

  it('DONE materialises BlogPost(DRAFT) and links postId', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'DRAFTING' });
    db.author.findFirst.mockResolvedValueOnce({ id: 'author-1' });
    db.blogPost.create.mockResolvedValue({ id: 'post-1' });
    db.researchJob.update.mockResolvedValue({ ...JOB, status: 'DONE', postId: 'post-1' });

    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ status: 'DONE', sourceCount: 9, reportTitle: 'Rapor', draft: DRAFT });

    expect(res.status).toBe(200);
    const createArg = db.blogPost.create.mock.calls[0][0];
    expect(createArg.data).toMatchObject({
      titleTr: DRAFT.titleTr,
      primaryDomain: 'FINTECH',
      subDomain: 'notebooklm-research',
      authorId: 'author-1',
    });
    expect(createArg.data.bodyTrMdx).toContain('## Kaynaklar');
    expect(createArg.data.bodyTrMdx).toContain('[BDDK raporu](https://example.com/bddk)');
    expect(db.researchJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: 'post-1', status: 'DONE' }),
      }),
    );
    expect(db.auditLog.create).toHaveBeenCalled();
  });

  it('DONE retries slug on P2002 collision', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'DRAFTING' });
    db.author.findFirst.mockResolvedValueOnce({ id: 'author-1' });
    const { Prisma } = await import('@prisma/client');
    const collision = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'test',
    });
    db.blogPost.create.mockRejectedValueOnce(collision).mockResolvedValueOnce({ id: 'post-2' });
    db.researchJob.update.mockResolvedValue({ ...JOB, status: 'DONE', postId: 'post-2' });

    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ status: 'DONE', draft: DRAFT });

    expect(res.status).toBe(200);
    expect(db.blogPost.create).toHaveBeenCalledTimes(2);
    const secondSlug = db.blogPost.create.mock.calls[1][0].data.slug;
    expect(secondSlug).toMatch(/^fintech-regulasyonunda-2026-gorunumu-/);
  });

  it('DONE with no Author rows → 422', async () => {
    db.researchJob.findUnique.mockResolvedValue({ ...JOB, status: 'DRAFTING' });
    db.author.findFirst.mockResolvedValue(null);
    const res = await request(makeApp())
      .patch('/api/v1/admin/research/bridge/jobs/job-1')
      .set('x-test-bridge', 'ok')
      .send({ status: 'DONE', draft: DRAFT });
    expect(res.status).toBe(422);
  });
});

// ─── Unit: slug folding ──────────────────────────────────────────────────────

describe('researchSlug', () => {
  it('folds Turkish characters and trims', () => {
    expect(researchSlug('Yapay Zekâ & Şirket Dönüşümü: Öncü Çağ!')).toBe(
      'yapay-zeka-sirket-donusumu-oncu-cag',
    );
  });
});
