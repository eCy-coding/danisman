import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import commentsRouter from '../routes/comments';
import adminCommentsRouter from '../routes/admin-comments';
import dsarRouter from '../routes/dsar-comments';
import { withCsrf } from '../test-utils/csrf';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../config/redis', () => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(3500),
  },
}));

vi.mock('../config/db', () => ({
  prisma: {
    blogPost: {
      findUnique: vi.fn().mockResolvedValue({ id: 'post-123' }),
      update: vi.fn().mockResolvedValue({}),
    },
    comment: {
      create: vi.fn().mockResolvedValue({ id: 'cmt-1', status: 'PENDING', createdAt: new Date() }),
      findUnique: vi.fn().mockResolvedValue({ id: 'cmt-1', status: 'PENDING', parentId: null }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({ id: 'cmt-1', status: 'APPROVED' }),
      delete: vi.fn().mockResolvedValue({ id: 'cmt-1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn(
    (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (_req as Record<string, unknown>).user = { id: 'admin-1', role: 'ADMIN' };
      next();
    },
  ),
}));

vi.mock('../middleware/require-permission', () => ({
  requirePermission:
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

// ── App setup ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.set('trust proxy', 1);
  app.use('/api/v1', commentsRouter);
  app.use('/api/v1/admin', adminCommentsRouter);
  app.use('/api/v1', dsarRouter);
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

import { prisma } from '../config/db';
import { redis } from '../config/redis';

describe('Comments API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: 'post-123' } as never);
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: 'cmt-1',
      status: 'PENDING',
      createdAt: new Date(),
    } as never);
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'cmt-1',
      status: 'PENDING',
      parentId: null,
    } as never);
    vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(redis.incr).mockResolvedValue(1);
    app = buildApp();
  });

  describe('POST /api/v1/insights/posts/:postId/comments', () => {
    const validBody = {
      authorName: 'Test Kullanıcı',
      authorEmail: 'test@example.com',
      bodyMd: 'Bu bir test yorumudur, en az 10 karakter.',
      kvkkConsent: true,
    };

    it('returns 201 on valid comment', async () => {
      const res = await request(app)
        .post('/api/v1/insights/posts/post-123/comments')
        .send(validBody);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ok');
    });

    it('returns 400 when kvkkConsent missing', async () => {
      const body = { ...validBody, kvkkConsent: undefined };
      const res = await request(app).post('/api/v1/insights/posts/post-123/comments').send(body);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('KVKK');
    });

    it('returns 400 when kvkkConsent is false', async () => {
      const body = { ...validBody, kvkkConsent: false };
      const res = await request(app).post('/api/v1/insights/posts/post-123/comments').send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when body is too short (< 10 chars)', async () => {
      const body = { ...validBody, bodyMd: 'kısa' };
      const res = await request(app).post('/api/v1/insights/posts/post-123/comments').send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const body = { ...validBody, authorEmail: 'not-an-email' };
      const res = await request(app).post('/api/v1/insights/posts/post-123/comments').send(body);
      expect(res.status).toBe(400);
    });

    it('creates comment with SPAM status when spam detected', async () => {
      const spamBody = {
        ...validBody,
        bodyMd: 'Buy casino poker slots jackpot free money earn $1000',
      };
      const res = await request(app)
        .post('/api/v1/insights/posts/post-123/comments')
        .send(spamBody);
      expect(res.status).toBe(201);
      expect(prisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SPAM' }) }),
      );
    });

    it('returns 429 when rate limit exceeded', async () => {
      vi.mocked(redis.incr).mockResolvedValue(6);
      const res = await request(app)
        .post('/api/v1/insights/posts/post-123/comments')
        .send(validBody);
      expect(res.status).toBe(429);
    });

    it('returns 404 when post not found', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null as never);
      const res = await request(app)
        .post('/api/v1/insights/posts/no-such-post/comments')
        .send(validBody);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/insights/posts/:postId/comments', () => {
    it('returns only APPROVED comments', async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([
        { id: 'c1', authorName: 'Ali', bodyMd: 'Harika!', createdAt: new Date(), replies: [] },
      ] as never);
      vi.mocked(prisma.comment.count).mockResolvedValue(1);
      const res = await request(app).get('/api/v1/insights/posts/post-123/comments');
      expect(res.status).toBe(200);
      expect(res.body.data.comments).toHaveLength(1);
    });

    it('does NOT return authorEmail in response', async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([
        { id: 'c1', authorName: 'Ali', bodyMd: 'Test', createdAt: new Date(), replies: [] },
      ] as never);
      const res = await request(app).get('/api/v1/insights/posts/post-123/comments');
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('authorEmail');
    });
  });

  describe('PATCH /api/v1/admin/insights/comments/:id', () => {
    it('returns 200 when moderating PENDING → APPROVED', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/insights/comments/cmt-1')
        .send({ status: 'APPROVED' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/insights/comments/cmt-1')
        .send({ status: 'INVALID_STATUS' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when comment not found', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null as never);
      const res = await request(app)
        .patch('/api/v1/admin/insights/comments/nonexistent')
        .send({ status: 'APPROVED' });
      expect(res.status).toBe(404);
    });
  });

  describe('DSAR endpoints', () => {
    it('GET /dsar/comments returns user comments by email', async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([
        {
          id: 'c1',
          bodyMd: 'My comment',
          status: 'APPROVED',
          createdAt: new Date(),
          post: { slug: 'test', titleTr: 'Test' },
        },
      ] as never);
      const res = await request(app).get('/api/v1/dsar/comments?email=test@example.com');
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });

    it('DELETE /dsar/comments erases all user comments', async () => {
      vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 3 } as never);
      const res = await withCsrf(
        request(app).delete('/api/v1/dsar/comments?email=test@example.com'),
      );
      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(3);
    });
  });
});
