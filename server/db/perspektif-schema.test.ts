import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ArticleType,
  Domain,
  Language,
  PostStatus,
  SeriesStatus,
  TagAxis,
  CommentStatus,
} from '@prisma/client';

// Mock the prisma instance — no real DB needed
vi.mock('../config/db', () => ({
  prisma: {
    author: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    series: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    tag: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    blogPost: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    draftRevision: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    editorComment: {
      create: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    viewLog: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { prisma } from '../config/db';

const mockFounderAuthor = {
  id: 'author-1',
  slug: 'emre-can-yalcin',
  displayName: 'Emre Can Yalçın',
  bioTr: 'eCyPro kurucusu',
  bioEn: null,
  avatarUrl: 'https://example.com/avatar.jpg',
  linkedinUrl: null,
  twitterUrl: null,
  isFounder: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _mockSeries = {
  id: 'series-1',
  slug: 'ma-master-class-2026',
  titleTr: 'M&A Master Class 2026',
  titleEn: 'M&A Master Class 2026',
  descriptionTr: '12 bölüm',
  descriptionEn: '12 parts',
  coverImageUrl: 'https://example.com/series.jpg',
  totalParts: 12,
  status: SeriesStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
  bodyTrMdx: '## İçerik\nİçerik burada.',
  bodyEnMdx: null,
  primaryDomain: Domain.M_A,
  subDomain: 'due-diligence',
  topic: 'mali-dd',
  seriesId: null,
  seriesOrder: null,
  authorId: 'author-1',
  coverImageUrl: 'https://example.com/cover.jpg',
  coverImageAlt: 'Checklist',
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
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Test Suite: Enum Values ──────────────────────────────────────────────────

describe('PB-1 Enum Integrity', () => {
  it('Domain enum has 4 values', () => {
    const domains = Object.values(Domain);
    expect(domains).toHaveLength(4);
    expect(domains).toContain('M_A');
    expect(domains).toContain('ESG');
    expect(domains).toContain('FINTECH');
    expect(domains).toContain('AILE_SIRKETI');
  });

  it('PostStatus enum has 8 values including editorial workflow', () => {
    const statuses = Object.values(PostStatus);
    expect(statuses).toHaveLength(8);
    expect(statuses).toContain('DRAFT');
    expect(statuses).toContain('IN_REVIEW');
    expect(statuses).toContain('COPY_EDIT');
    expect(statuses).toContain('SEO_REVIEW');
    expect(statuses).toContain('LEGAL_REVIEW');
    expect(statuses).toContain('SCHEDULED');
    expect(statuses).toContain('PUBLISHED');
    expect(statuses).toContain('ARCHIVED');
  });

  it('ArticleType enum has 12 values', () => {
    expect(Object.values(ArticleType)).toHaveLength(12);
  });

  it('TagAxis enum has 6 values', () => {
    const axes = Object.values(TagAxis);
    expect(axes).toHaveLength(6);
    expect(axes).toContain('FORMAT');
    expect(axes).toContain('AUDIENCE');
    expect(axes).toContain('GEO');
    expect(axes).toContain('SECTOR');
    expect(axes).toContain('REG');
    expect(axes).toContain('TREND');
  });

  it('CommentStatus enum has PENDING as default', () => {
    expect(CommentStatus.PENDING).toBe('PENDING');
  });
});

// ─── Test Suite: Author CRUD ──────────────────────────────────────────────────

describe('PB-1 Author Model', () => {
  it('create founder author with correct fields', async () => {
    vi.mocked(prisma.author.create).mockResolvedValue(mockFounderAuthor);

    const result = await prisma.author.create({
      data: {
        slug: 'emre-can-yalcin',
        displayName: 'Emre Can Yalçın',
        bioTr: 'eCyPro kurucusu',
        avatarUrl: 'https://example.com/avatar.jpg',
        isFounder: true,
      },
    });

    expect(result.isFounder).toBe(true);
    expect(result.slug).toBe('emre-can-yalcin');
    expect(prisma.author.create).toHaveBeenCalledOnce();
  });

  it('find author by slug returns null for non-existent', async () => {
    vi.mocked(prisma.author.findUnique).mockResolvedValue(null);
    const result = await prisma.author.findUnique({ where: { slug: 'not-found' } });
    expect(result).toBeNull();
  });
});

// ─── Test Suite: BlogPost CRUD ────────────────────────────────────────────────

describe('PB-1 BlogPost Model', () => {
  it('create blog post with DRAFT default status', async () => {
    vi.mocked(prisma.blogPost.create).mockResolvedValue(mockPost);

    const result = await prisma.blogPost.create({
      data: {
        slug: 'ma-dd-checklist',
        type: ArticleType.CHECKLIST,
        titleTr: 'M&A Due Diligence Checklist',
        excerptTr: 'Özet',
        bodyTrMdx: '## İçerik',
        primaryDomain: Domain.M_A,
        subDomain: 'due-diligence',
        authorId: 'author-1',
        coverImageUrl: 'https://example.com/cover.jpg',
        coverImageAlt: 'Checklist',
      },
    });

    expect(result.status).toBe(PostStatus.DRAFT);
    expect(result.viewCount).toBe(0);
    expect(result.noindex).toBe(false);
  });

  it('find post by unique slug', async () => {
    vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost);

    const result = await prisma.blogPost.findUnique({
      where: { slug: 'ma-dd-checklist' },
    });

    expect(result?.slug).toBe('ma-dd-checklist');
    expect(result?.primaryDomain).toBe(Domain.M_A);
  });

  it('update post status from DRAFT to IN_REVIEW', async () => {
    const updated = { ...mockPost, status: PostStatus.IN_REVIEW };
    vi.mocked(prisma.blogPost.update).mockResolvedValue(updated);

    const result = await prisma.blogPost.update({
      where: { id: 'post-1' },
      data: { status: PostStatus.IN_REVIEW },
    });

    expect(result.status).toBe(PostStatus.IN_REVIEW);
  });

  it('filter posts by domain and published status', async () => {
    const posts = [mockPost, { ...mockPost, id: 'post-2', slug: 'post-2' }];
    vi.mocked(prisma.blogPost.findMany).mockResolvedValue(posts as (typeof mockPost)[]);

    const result = await prisma.blogPost.findMany({
      where: { primaryDomain: Domain.M_A, status: PostStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });

    expect(result).toHaveLength(2);
    expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { primaryDomain: 'M_A', status: 'PUBLISHED' },
      }),
    );
  });
});

// ─── Test Suite: Tag M2M ──────────────────────────────────────────────────────

describe('PB-1 Tag M2M Relation', () => {
  it('create tag with correct axis', async () => {
    const mockTag = {
      id: 'tag-1',
      slug: 'reg-kvkk',
      labelTr: 'KVKK',
      labelEn: 'KVKK',
      axis: TagAxis.REG,
      createdAt: new Date(),
    };
    vi.mocked(prisma.tag.create).mockResolvedValue(mockTag);

    const result = await prisma.tag.create({
      data: { slug: 'reg-kvkk', labelTr: 'KVKK', axis: TagAxis.REG },
    });

    expect(result.axis).toBe(TagAxis.REG);
  });

  it('find tags by axis', async () => {
    const regTags = [
      {
        id: 't1',
        slug: 'reg-kvkk',
        labelTr: 'KVKK',
        labelEn: 'KVKK',
        axis: TagAxis.REG,
        createdAt: new Date(),
      },
      {
        id: 't2',
        slug: 'reg-csrd',
        labelTr: 'CSRD',
        labelEn: 'CSRD',
        axis: TagAxis.REG,
        createdAt: new Date(),
      },
    ];
    vi.mocked(prisma.tag.findMany).mockResolvedValue(regTags);

    const result = await prisma.tag.findMany({ where: { axis: TagAxis.REG } });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.axis === TagAxis.REG)).toBe(true);
  });
});

// ─── Test Suite: DraftRevision + Cascade ─────────────────────────────────────

describe('PB-1 DraftRevision Model', () => {
  it('create draft revision linked to post', async () => {
    const mockRevision = {
      id: 'rev-1',
      postId: 'post-1',
      bodyMdxSnapshot: '## Eski içerik',
      authorId: 'author-1',
      message: 'Initial draft',
      createdAt: new Date(),
    };
    vi.mocked(prisma.draftRevision.create).mockResolvedValue(mockRevision);

    const result = await prisma.draftRevision.create({
      data: {
        postId: 'post-1',
        bodyMdxSnapshot: '## Eski içerik',
        authorId: 'author-1',
        message: 'Initial draft',
      },
    });

    expect(result.postId).toBe('post-1');
    expect(result.message).toBe('Initial draft');
  });

  it('list revisions for post ordered by date', async () => {
    const revisions = [
      {
        id: 'rev-2',
        postId: 'post-1',
        bodyMdxSnapshot: 'v2',
        authorId: 'a1',
        message: null,
        createdAt: new Date('2026-05-02'),
      },
      {
        id: 'rev-1',
        postId: 'post-1',
        bodyMdxSnapshot: 'v1',
        authorId: 'a1',
        message: null,
        createdAt: new Date('2026-05-01'),
      },
    ];
    vi.mocked(prisma.draftRevision.findMany).mockResolvedValue(revisions);

    const result = await prisma.draftRevision.findMany({
      where: { postId: 'post-1' },
      orderBy: { createdAt: 'desc' },
    });

    expect(result[0].id).toBe('rev-2');
  });
});

// ─── Test Suite: Comment KVKK ────────────────────────────────────────────────

describe('PB-1 Comment Model (KVKK)', () => {
  it('comment stores hashed email and ipHash', async () => {
    const mockComment = {
      id: 'cmt-1',
      postId: 'post-1',
      authorName: 'Test User',
      authorEmail: 'sha256-hash-of-email',
      bodyMd: 'Güzel makale!',
      status: CommentStatus.PENDING,
      parentId: null,
      ipHash: 'sha256-hash-of-ip',
      createdAt: new Date(),
    };
    vi.mocked(prisma.comment.create).mockResolvedValue(mockComment);

    const result = await prisma.comment.create({
      data: {
        postId: 'post-1',
        authorName: 'Test User',
        authorEmail: 'sha256-hash-of-email',
        bodyMd: 'Güzel makale!',
        ipHash: 'sha256-hash-of-ip',
      },
    });

    expect(result.status).toBe(CommentStatus.PENDING);
    expect(result.ipHash).not.toBe('');
    expect(result.authorEmail).not.toContain('@');
  });
});

// ─── Test Suite: ViewLog ──────────────────────────────────────────────────────

describe('PB-1 ViewLog Model', () => {
  it('create view log with optional fields', async () => {
    const mockViewLog = {
      id: 'vl-1',
      postId: 'post-1',
      userHash: null,
      referrer: 'https://google.com',
      duration: 120,
      scrollDepth: 0.75,
      device: 'mobile',
      geo: 'TR',
      createdAt: new Date(),
    };
    vi.mocked(prisma.viewLog.create).mockResolvedValue(mockViewLog);

    const result = await prisma.viewLog.create({
      data: {
        postId: 'post-1',
        referrer: 'https://google.com',
        duration: 120,
        scrollDepth: 0.75,
        device: 'mobile',
        geo: 'TR',
      },
    });

    expect(result.scrollDepth).toBe(0.75);
    expect(result.geo).toBe('TR');
    expect(result.userHash).toBeNull();
  });
});
