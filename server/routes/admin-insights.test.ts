import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { UserRole, ArticleType, Domain, Language, PostStatus, TagAxis } from '@prisma/client';

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    series: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    author: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    draftRevision: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    editorComment: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (
    req: express.Request & { user?: Record<string, unknown> },
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    req.user =
      ((req as unknown as Record<string, unknown>).__mockUser as Record<string, unknown>) ?? null;
    next();
  },
}));

import { adminInsightsRouter } from './admin-insights';
import { prisma } from '../config/db';

// ─── Test App Factory ─────────────────────────────────────────────────────────

function makeApp(role: UserRole = UserRole.ADMIN) {
  const app = express();
  app.use(express.json());
  // Inject mock user via custom header trick
  app.use((req: express.Request & { user?: unknown; __mockUser?: unknown }, _res, next) => {
    req.__mockUser = { id: 'user-1', role };
    next();
  });
  app.use('/api/v1/admin/insights', adminInsightsRouter);
  return app;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPost = {
  id: 'post-1',
  slug: 'ma-dd-checklist',
  slugEn: null,
  type: ArticleType.CHECKLIST,
  status: PostStatus.DRAFT,
  language: Language.TR_ONLY,
  titleTr: 'M&A Due Diligence Checklist',
  titleEn: null,
  excerptTr: 'Özet',
  excerptEn: null,
  bodyTrMdx: '## İçerik\n\nİçerik.',
  bodyEnMdx: null,
  primaryDomain: Domain.M_A,
  subDomain: 'due-diligence',
  topic: null,
  seriesId: null,
  seriesOrder: null,
  authorId: 'author-1',
  coverImageUrl: 'https://example.com/cover.jpg',
  coverImageAlt: 'Cover',
  ogImageUrl: null,
  videoEmbedUrl: null,
  metaTitleTr: null,
  metaTitleEn: null,
  metaDescTr: null,
  metaDescEn: null,
  canonicalUrl: null,
  noindex: false,
  readingTimeMin: 5,
  viewCount: 0,
  uniqueViewCount: 0,
  shareCount: 0,
  bookmarkCount: 0,
  commentCount: 0,
  avgScrollDepth: null,
  newsletterSignupsFromPost: 0,
  discoveryClicksFromPost: 0,
  publishedAt: null,
  scheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  copyEditedBy: null,
  seoApprovedBy: null,
  legalApprovedBy: null,
  publishedBy: null,
  isFeatured: false,
  isEditorsPick: false,
  featureOrder: null,
  feedPinned: false,
  author: { displayName: 'Emre Can Yalçın', slug: 'emre-can-yalcin' },
  tags: [],
};

const validCreateBody = {
  slug: 'ma-dd-checklist',
  type: 'CHECKLIST',
  titleTr: 'M&A Due Diligence Checklist',
  excerptTr: 'Türkiye orta piyasa M&A checklist özeti buraya gelir.',
  bodyTrMdx: '## İçerik\n\n'.padEnd(150, 'x'),
  primaryDomain: 'M_A',
  subDomain: 'due-diligence',
  authorId: 'clabcdefg1234567890abcdef',
  coverImageUrl: 'https://example.com/cover.jpg',
  coverImageAlt: 'M&A Cover Alt',
  readingTimeMin: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
});

// ─── GET /posts ───────────────────────────────────────────────────────────────

describe('GET /api/v1/admin/insights/posts', () => {
  it('ADMIN can list posts', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([mockPost] as never);
    vi.mocked(prisma.blogPost.count).mockResolvedValue(1);

    const response = await request(makeApp(UserRole.ADMIN))
      .get('/api/v1/admin/insights/posts')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('VIEWER can list posts (read-only access)', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([]);
    vi.mocked(prisma.blogPost.count).mockResolvedValue(0);

    const res = await request(makeApp(UserRole.VIEWER))
      .get('/api/v1/admin/insights/posts')
      .expect(200);

    expect(res.body.data).toHaveLength(0);
  });

  it('USER cannot list posts (403)', async () => {
    await request(makeApp(UserRole.USER)).get('/api/v1/admin/insights/posts').expect(403);
  });

  it('invalid query returns 400', async () => {
    const res = await request(makeApp(UserRole.ADMIN))
      .get('/api/v1/admin/insights/posts?limit=9999')
      .expect(400);

    expect(res.body.error).toBe('Invalid query');
  });

  it('filter by domain works', async () => {
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue([mockPost] as never);
    vi.mocked(prisma.blogPost.count).mockResolvedValue(1);

    await request(makeApp(UserRole.ADMIN))
      .get('/api/v1/admin/insights/posts?domain=M_A')
      .expect(200);

    expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ primaryDomain: 'M_A' }),
      }),
    );
  });
});

// ─── POST /posts ──────────────────────────────────────────────────────────────

describe('POST /api/v1/admin/insights/posts', () => {
  it('ADMIN can create post', async () => {
    vi.mocked(prisma.blogPost.create).mockResolvedValue(mockPost as never);

    const res = await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts')
      .send(validCreateBody)
      .expect(201);

    expect(res.body.data.slug).toBe('ma-dd-checklist');
  });

  it('EDITOR can create post', async () => {
    vi.mocked(prisma.blogPost.create).mockResolvedValue(mockPost as never);

    await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts')
      .send(validCreateBody)
      .expect(201);
  });

  it('VIEWER cannot create post (403)', async () => {
    await request(makeApp(UserRole.VIEWER))
      .post('/api/v1/admin/insights/posts')
      .send(validCreateBody)
      .expect(403);
  });

  it('Zod validation rejects missing required fields', async () => {
    const res = await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts')
      .send({ slug: 'only-slug' })
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });

  it('Zod validation rejects invalid slug (uppercase)', async () => {
    const res = await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts')
      .send({ ...validCreateBody, slug: 'UPPER_CASE' })
      .expect(400);

    expect(res.body.details).toBeDefined();
  });

  it('create logs audit trail', async () => {
    vi.mocked(prisma.blogPost.create).mockResolvedValue(mockPost as never);

    await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts')
      .send(validCreateBody)
      .expect(201);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'INSIGHTS_POST_CREATE',
          targetType: 'BlogPost',
        }),
      }),
    );
  });
});

// ─── Status Transition ────────────────────────────────────────────────────────

describe('POST /api/v1/admin/insights/posts/:id/transition', () => {
  it('valid DRAFT → IN_REVIEW transition succeeds', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);
    vi.mocked(prisma.blogPost.update).mockResolvedValue({
      ...mockPost,
      status: PostStatus.IN_REVIEW,
    } as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts/post-1/transition')
      .send({ toStatus: 'IN_REVIEW' })
      .expect(200);

    expect(res.body.data.status).toBe('IN_REVIEW');
  });

  it('invalid transition (DRAFT → PUBLISHED) returns 422', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);

    const res = await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts/post-1/transition')
      .send({ toStatus: 'PUBLISHED' })
      .expect(422);

    expect(res.body.error).toContain('Geçersiz durum geçişi');
  });

  it('EDITOR cannot publish (PUBLISHED needs ADMIN)', async () => {
    const scheduledPost = { ...mockPost, status: PostStatus.SCHEDULED };
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(scheduledPost as never);

    await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts/post-1/transition')
      .send({ toStatus: 'PUBLISHED' })
      .expect(403);
  });

  it('transition logs audit entry', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);
    vi.mocked(prisma.blogPost.update).mockResolvedValue({
      ...mockPost,
      status: PostStatus.IN_REVIEW,
    } as never);

    await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts/post-1/transition')
      .send({ toStatus: 'IN_REVIEW' })
      .expect(200);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'INSIGHTS_STATUS_TRANSITION' }),
      }),
    );
  });

  it('post not found returns 404', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

    await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/posts/nonexistent/transition')
      .send({ toStatus: 'IN_REVIEW' })
      .expect(404);
  });
});

// ─── DELETE /posts/:id ────────────────────────────────────────────────────────

describe('DELETE /api/v1/admin/insights/posts/:id', () => {
  it('ADMIN soft-archives post', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);
    vi.mocked(prisma.blogPost.update).mockResolvedValue({
      ...mockPost,
      status: PostStatus.ARCHIVED,
    } as never);

    const res = await request(makeApp(UserRole.ADMIN))
      .delete('/api/v1/admin/insights/posts/post-1')
      .expect(200);

    expect(res.body.data.archived).toBe(true);
  });

  it('EDITOR cannot delete (403)', async () => {
    await request(makeApp(UserRole.EDITOR))
      .delete('/api/v1/admin/insights/posts/post-1')
      .expect(403);
  });

  it('ADMIN hard deletes with hard=true', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);
    vi.mocked(prisma.blogPost.delete).mockResolvedValue(mockPost as never);

    await request(makeApp(UserRole.ADMIN))
      .delete('/api/v1/admin/insights/posts/post-1?hard=true')
      .expect(204);

    expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
  });
});

// ─── GET /posts/:id/revisions ─────────────────────────────────────────────────

describe('GET /api/v1/admin/insights/posts/:id/revisions', () => {
  it('returns revisions list', async () => {
    const revisions = [
      {
        id: 'rev-1',
        postId: 'post-1',
        bodyMdxSnapshot: 'old',
        authorId: 'a1',
        message: null,
        createdAt: new Date(),
      },
    ];
    vi.mocked(prisma.draftRevision.findMany).mockResolvedValue(revisions as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .get('/api/v1/admin/insights/posts/post-1/revisions')
      .expect(200);

    expect(res.body.data).toHaveLength(1);
  });
});

// ─── POST /posts/:id/comments ─────────────────────────────────────────────────

describe('POST /api/v1/admin/insights/posts/:id/comments', () => {
  it('EDITOR adds editor comment', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost as never);
    vi.mocked(prisma.editorComment.create).mockResolvedValue({
      id: 'ec-1',
      postId: 'post-1',
      authorId: 'user-1',
      contentMd: 'Paragraf eksik.',
      resolved: false,
      createdAt: new Date(),
    } as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts/post-1/comments')
      .send({ contentMd: 'Paragraf eksik.' })
      .expect(201);

    expect(res.body.data.contentMd).toBe('Paragraf eksik.');
  });

  it('empty contentMd returns 400', async () => {
    await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/posts/post-1/comments')
      .send({ contentMd: '' })
      .expect(400);
  });
});

// ─── TAGS CRUD ────────────────────────────────────────────────────────────────

describe('Tags CRUD', () => {
  it('GET /tags returns all tags', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([
      {
        id: 't1',
        slug: 'reg-kvkk',
        labelTr: 'KVKK',
        labelEn: 'KVKK',
        axis: TagAxis.REG,
        createdAt: new Date(),
      },
    ] as never);

    const res = await request(makeApp(UserRole.VIEWER))
      .get('/api/v1/admin/insights/tags')
      .expect(200);

    expect(res.body.data).toHaveLength(1);
  });

  it('ADMIN creates tag', async () => {
    vi.mocked(prisma.tag.create).mockResolvedValue({
      id: 't2',
      slug: 'geo-turkey',
      labelTr: 'Türkiye',
      labelEn: 'Turkey',
      axis: TagAxis.GEO,
      createdAt: new Date(),
    } as never);

    const res = await request(makeApp(UserRole.ADMIN))
      .post('/api/v1/admin/insights/tags')
      .send({ slug: 'geo-turkey', labelTr: 'Türkiye', labelEn: 'Turkey', axis: 'GEO' })
      .expect(201);

    expect(res.body.data.axis).toBe('GEO');
  });

  it('EDITOR cannot create tag (403)', async () => {
    await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/tags')
      .send({ slug: 'geo-turkey', labelTr: 'Türkiye', axis: 'GEO' })
      .expect(403);
  });
});

// ─── isValidTransition state machine ─────────────────────────────────────────

describe('isValidTransition (state machine)', () => {
  it('DRAFT → IN_REVIEW is valid', async () => {
    const { isValidTransition } = await import('../schemas/insights.zod');
    expect(isValidTransition('DRAFT', 'IN_REVIEW')).toBe(true);
  });

  it('DRAFT → PUBLISHED is invalid', async () => {
    const { isValidTransition } = await import('../schemas/insights.zod');
    expect(isValidTransition('DRAFT', 'PUBLISHED')).toBe(false);
  });

  it('PUBLISHED → ARCHIVED is valid', async () => {
    const { isValidTransition } = await import('../schemas/insights.zod');
    expect(isValidTransition('PUBLISHED', 'ARCHIVED')).toBe(true);
  });

  it('ARCHIVED → DRAFT is valid (reinstate)', async () => {
    const { isValidTransition } = await import('../schemas/insights.zod');
    expect(isValidTransition('ARCHIVED', 'DRAFT')).toBe(true);
  });

  it('PUBLISHED → DRAFT is invalid', async () => {
    const { isValidTransition } = await import('../schemas/insights.zod');
    expect(isValidTransition('PUBLISHED', 'DRAFT')).toBe(false);
  });
});
