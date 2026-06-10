import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

// R12-P6 — the router reads published BlogPosts via `prisma.blogPost`
// (findMany / findFirst) and fires a non-blocking `update` view counter.
// Without a db mock the handler hits a real Neon connection in CI → throws.
// `update` returns a resolved promise so the fire-and-forget `.catch()` is a
// no-op and never crashes the response.
vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    blogPost: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return { prisma: prismaMock };
});

// The :slug handler logs view-counter failures via the winston logger. Stub it
// so the test doesn't emit log noise (the success path never calls it).
vi.mock('../config/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { publicInsightsPostsRouter } from './public-insights-posts';
import { prisma } from '../config/db';

// ── Test utilities ────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/insights/posts', publicInsightsPostsRouter);
  return app;
}

const FAKE_POST = {
  id: 'post-uuid-test-1234',
  slug: 'kvkk-uyum-rehberi',
  title: 'KVKK Uyum Rehberi',
  status: 'PUBLISHED',
  publishedAt: new Date('2026-01-01').toISOString(),
  viewCount: 7,
  author: { displayName: 'Test Yazar', slug: 'test-yazar', avatarUrl: null },
  tags: [],
};

// ── GET /api/v1/insights/posts (list) ──────────────────────────────────────────

describe('GET /api/v1/insights/posts', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with the published list and a count meta', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([FAKE_POST] as never);

    const res = await request(app).get('/api/v1/insights/posts');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('kvkk-uyum-rehberi');
    expect(res.body.meta.count).toBe(1);
  });

  it('queries only PUBLISHED posts, newest first, capped at the limit', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([] as never);

    await request(app).get('/api/v1/insights/posts');

    const arg = vi.mocked(prisma.blogPost.findMany).mock.calls[0][0];
    expect(arg).toMatchObject({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  });

  it('clamps an oversized limit query param to 50', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([] as never);

    await request(app).get('/api/v1/insights/posts?limit=9999');

    const arg = vi.mocked(prisma.blogPost.findMany).mock.calls[0][0];
    expect(arg).toMatchObject({ take: 50 });
  });

  it('returns an empty list (count 0) when nothing is published', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([] as never);

    const res = await request(app).get('/api/v1/insights/posts');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.count).toBe(0);
  });
});

// ── GET /api/v1/insights/posts/:slug (single) ───────────────────────────────────

describe('GET /api/v1/insights/posts/:slug', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with the article for a published slug', async () => {
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(FAKE_POST as never);

    const res = await request(app).get('/api/v1/insights/posts/kvkk-uyum-rehberi');

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('kvkk-uyum-rehberi');
  });

  it('filters by slug AND status=PUBLISHED', async () => {
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(FAKE_POST as never);

    await request(app).get('/api/v1/insights/posts/kvkk-uyum-rehberi');

    const arg = vi.mocked(prisma.blogPost.findFirst).mock.calls[0][0];
    expect(arg).toMatchObject({
      where: { slug: 'kvkk-uyum-rehberi', status: 'PUBLISHED' },
    });
  });

  it('increments the view counter for the fetched post', async () => {
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(FAKE_POST as never);

    await request(app).get('/api/v1/insights/posts/kvkk-uyum-rehberi');

    expect(prisma.blogPost.update).toHaveBeenCalledWith({
      where: { id: FAKE_POST.id },
      data: { viewCount: { increment: 1 } },
    });
  });

  it('returns 404 when no published post matches the slug', async () => {
    vi.mocked(prisma.blogPost.findFirst).mockResolvedValue(null as never);

    const res = await request(app).get('/api/v1/insights/posts/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.slug).toBe('does-not-exist');
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
  });
});
