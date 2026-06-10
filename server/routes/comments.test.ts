/**
 * Public blog/insight comments route tests
 *
 * Verifies:
 *   - GET  list → 200 ok, prisma filtered by status=APPROVED + parentId=null
 *   - POST submit → 201 ok, comment.create called with PENDING status
 *   - POST submit spam body → 201 ok, status SPAM (no commentCount increment)
 *   - POST invalid/missing fields → 400 error
 *   - POST unknown/unpublished post → 404
 *   - POST rate-limit exceeded → 429 (rateLimitComments middleware)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

const { isSpamMock } = vi.hoisted(() => ({
  isSpamMock: vi.fn((_text: string) => false),
}));

vi.mock('../services/spamFilter', () => ({
  isSpam: isSpamMock,
}));

vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    blogPost: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    comment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { prisma: prismaMock };
});

// In-memory rate limiter requires a redis client; mock incr/expire/ttl so the
// middleware lets requests through (count <= MAX_COMMENTS_PER_HOUR).
const { redisIncrMock, redisTtlMock } = vi.hoisted(() => ({
  redisIncrMock: vi.fn().mockResolvedValue(1),
  redisTtlMock: vi.fn().mockResolvedValue(3600),
}));

vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    incr: redisIncrMock,
    expire: vi.fn().mockResolvedValue(1),
    ttl: redisTtlMock,
  },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import commentsRoutes from './comments';
import { errorHandler } from '../middleware/error';
import { prisma } from '../config/db';

// ── Test utilities ────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', commentsRoutes);
  app.use(errorHandler);
  return app;
}

const POST_ID = 'post-uuid-test-1234';

const VALID_PAYLOAD = {
  authorName: 'Ada Lovelace',
  authorEmail: 'ada@example.com',
  bodyMd: 'This is a perfectly reasonable comment about the article.',
  kvkkConsent: true,
};

// ── GET — list approved comments ───────────────────────────────────────────────

describe('GET /api/v1/insights/posts/:postId/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSpamMock.mockReturnValue(false);
    redisIncrMock.mockResolvedValue(1);
  });

  it('returns 200 and only APPROVED top-level comments', async () => {
    vi.mocked(prisma.comment.count).mockResolvedValue(1 as never);
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: 'c1',
        authorName: 'Ada',
        bodyMd: 'Great post!',
        createdAt: new Date(),
        replies: [],
      },
    ] as never);

    const res = await request(makeApp()).get(`/api/v1/insights/posts/${POST_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.comments).toHaveLength(1);

    // Asserts the status/parentId filter the route applies to the listing.
    expect(vi.mocked(prisma.comment.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postId: POST_ID, status: 'APPROVED', parentId: null },
      }),
    );
  });
});

// ── POST — submit comment ───────────────────────────────────────────────────────

describe('POST /api/v1/insights/posts/:postId/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSpamMock.mockReturnValue(false);
    redisIncrMock.mockResolvedValue(1);
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({ id: POST_ID } as never);
  });

  it('creates a comment with PENDING status and returns 201', async () => {
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: 'new-comment-id',
      status: 'PENDING',
      createdAt: new Date(),
    } as never);

    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.status).toBe('PENDING');

    expect(vi.mocked(prisma.comment.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: POST_ID, status: 'PENDING' }),
      }),
    );
    // PENDING comments increment the post's comment counter.
    expect(vi.mocked(prisma.blogPost.update)).toHaveBeenCalledTimes(1);
  });

  it('flags spam content with SPAM status and skips commentCount increment', async () => {
    isSpamMock.mockReturnValue(true);
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: 'spam-comment-id',
      status: 'SPAM',
      createdAt: new Date(),
    } as never);

    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(vi.mocked(prisma.comment.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SPAM' }),
      }),
    );
    expect(vi.mocked(prisma.blogPost.update)).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send({ authorName: 'Ada' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(vi.mocked(prisma.comment.create)).not.toHaveBeenCalled();
  });

  it('returns 400 when KVKK consent is not granted', async () => {
    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send({ ...VALID_PAYLOAD, kvkkConsent: false });

    expect(res.status).toBe(400);
    expect(vi.mocked(prisma.comment.create)).not.toHaveBeenCalled();
  });

  it('returns 404 when the post is not published / does not exist', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(404);
    expect(vi.mocked(prisma.comment.create)).not.toHaveBeenCalled();
  });

  it('returns 429 when the per-IP rate limit is exceeded', async () => {
    // 6th submission in the hour window → count > MAX_COMMENTS_PER_HOUR (5).
    redisIncrMock.mockResolvedValue(6);

    const res = await request(makeApp())
      .post(`/api/v1/insights/posts/${POST_ID}/comments`)
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(429);
    expect(res.body.status).toBe('error');
    expect(vi.mocked(prisma.comment.create)).not.toHaveBeenCalled();
  });
});
