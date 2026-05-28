import { Router } from 'express';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import {
  CreatePostSchema,
  UpdatePostSchema,
  TransitionPostSchema,
  PostListQuerySchema,
  CreateTagSchema,
  UpdateTagSchema,
  CreateSeriesSchema,
  UpdateSeriesSchema,
  CreateAuthorSchema,
  UpdateAuthorSchema,
  CreateEditorCommentSchema,
  isValidTransition,
} from '../schemas/insights.zod';

export const adminInsightsRouter = Router();

// ─── RBAC ────────────────────────────────────────────────────────────────────
// VIEWER  → GET only
// EDITOR  → GET + POST + PATCH (no delete, no legal/seo approve)
// ADMIN   → full

const INSIGHTS_EDITOR_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR, UserRole.BLOG_AUTHOR];
const INSIGHTS_ADMIN_ROLES: UserRole[] = [UserRole.ADMIN];

function requireInsightsRead(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const allowed: UserRole[] = [
    UserRole.ADMIN,
    UserRole.EDITOR,
    UserRole.BLOG_AUTHOR,
    UserRole.VIEWER,
  ];
  if (!allowed.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Read access required' });
    return;
  }
  next();
}

function requireInsightsWrite(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!INSIGHTS_EDITOR_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Editor access required' });
    return;
  }
  next();
}

function requireInsightsAdmin(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!INSIGHTS_ADMIN_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

adminInsightsRouter.use(authenticate);

// ─── POSTS ───────────────────────────────────────────────────────────────────

// GET /api/v1/admin/insights/posts
adminInsightsRouter.get(
  '/posts',
  requireInsightsRead,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const query = PostListQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: 'Invalid query', details: query.error.flatten() });
      return;
    }
    const { domain, status, authorId, seriesId, q, page, limit, sortBy, sortOrder } = query.data;

    const where = {
      ...(domain && { primaryDomain: domain }),
      ...(status && { status }),
      ...(authorId && { authorId }),
      ...(seriesId && { seriesId }),
      ...(q && {
        OR: [
          { titleTr: { contains: q, mode: 'insensitive' as const } },
          { excerptTr: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { author: { select: { displayName: true, slug: true } }, tags: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({ data: posts, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  },
);

// POST /api/v1/admin/insights/posts
adminInsightsRouter.post(
  '/posts',
  requireInsightsWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { tagIds, guestAuthorIds, ...data } = parsed.data;

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        ...(tagIds?.length && { tags: { connect: tagIds.map((id) => ({ id })) } }),
        ...(guestAuthorIds?.length && {
          guestAuthors: { connect: guestAuthorIds.map((id) => ({ id })) },
        }),
      },
      include: { author: { select: { displayName: true } }, tags: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'INSIGHTS_POST_CREATE',
        targetType: 'BlogPost',
        targetId: post.id,
        newValue: { slug: post.slug, status: post.status } as never,
        ip: req.ip,
      },
    });

    logger.info('Blog post created', { postId: post.id, slug: post.slug });
    res.status(201).json({ data: post });
  },
);

// PATCH /api/v1/admin/insights/posts/:id
adminInsightsRouter.patch(
  '/posts/:id',
  requireInsightsWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const parsed = UpdatePostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Post bulunamadı' });
      return;
    }

    const { tagIds, guestAuthorIds, ...data } = parsed.data as typeof parsed.data & {
      tagIds?: string[];
      guestAuthorIds?: string[];
    };

    // Save revision before update
    await prisma.draftRevision.create({
      data: {
        post: { connect: { id } },
        bodyMdxSnapshot: existing.bodyTrMdx,
        authorId: req.user!.id,
        message: 'Auto-save before edit',
      },
    });

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        ...(tagIds && { tags: { set: tagIds.map((tid) => ({ id: tid })) } }),
        ...(guestAuthorIds && {
          guestAuthors: { set: guestAuthorIds.map((aid) => ({ id: aid })) },
        }),
      },
      include: { author: { select: { displayName: true } }, tags: true },
    });

    res.json({ data: post });
  },
);

// POST /api/v1/admin/insights/posts/:id/transition
adminInsightsRouter.post(
  '/posts/:id/transition',
  requireInsightsWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const parsed = TransitionPostSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { toStatus, comment } = parsed.data;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Post bulunamadı' });
      return;
    }

    if (!isValidTransition(existing.status, toStatus)) {
      res.status(422).json({
        error: `Geçersiz durum geçişi: ${existing.status} → ${toStatus}`,
      });
      return;
    }

    // EDITOR cannot transition to PUBLISHED / LEGAL_REVIEW / ARCHIVED without ADMIN
    const adminOnlyTransitions = ['PUBLISHED', 'ARCHIVED'];
    if (
      adminOnlyTransitions.includes(toStatus) &&
      !INSIGHTS_ADMIN_ROLES.includes(req.user!.role as UserRole)
    ) {
      res.status(403).json({ error: 'Bu geçiş için Admin yetkisi gerekli' });
      return;
    }

    const publishData =
      toStatus === 'PUBLISHED' ? { publishedAt: new Date(), publishedBy: req.user!.id } : {};

    const post = await prisma.blogPost.update({
      where: { id },
      data: { status: toStatus, ...publishData },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.user!.id,
        action: 'INSIGHTS_STATUS_TRANSITION',
        targetType: 'BlogPost',
        targetId: id,
        oldValue: { status: existing.status } as never,
        newValue: { status: toStatus, comment } as never,
        ip: req.ip,
      },
    });

    logger.info('Post status transition', { postId: id, from: existing.status, to: toStatus });
    res.json({ data: post });
  },
);

// DELETE /api/v1/admin/insights/posts/:id
adminInsightsRouter.delete(
  '/posts/:id',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { hard } = req.query as { hard?: string };

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Post bulunamadı' });
      return;
    }

    if (hard === 'true') {
      // Hard delete — admin only
      await prisma.blogPost.delete({ where: { id } });
      logger.info('Blog post hard deleted', { postId: id });
      res.status(204).send();
    } else {
      // Soft archive
      await prisma.blogPost.update({ where: { id }, data: { status: 'ARCHIVED' } });
      res.json({ data: { archived: true } });
    }
  },
);

// GET /api/v1/admin/insights/posts/:id/revisions
adminInsightsRouter.get(
  '/posts/:id/revisions',
  requireInsightsRead,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const revisions = await prisma.draftRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: revisions });
  },
);

// POST /api/v1/admin/insights/posts/:id/comments
adminInsightsRouter.post(
  '/posts/:id/comments',
  requireInsightsWrite,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const parsed = CreateEditorCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ error: 'Post bulunamadı' });
      return;
    }

    const comment = await prisma.editorComment.create({
      data: { post: { connect: { id } }, authorId: req.user!.id, contentMd: parsed.data.contentMd },
    });

    res.status(201).json({ data: comment });
  },
);

// ─── TAGS ─────────────────────────────────────────────────────────────────────

adminInsightsRouter.get(
  '/tags',
  requireInsightsRead,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const tags = await prisma.tag.findMany({ orderBy: [{ axis: 'asc' }, { slug: 'asc' }] });
    res.json({ data: tags });
  },
);

adminInsightsRouter.post(
  '/tags',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateTagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const tag = await prisma.tag.create({ data: parsed.data });
    res.status(201).json({ data: tag });
  },
);

adminInsightsRouter.patch(
  '/tags/:id',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = UpdateTagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const tag = await prisma.tag.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ data: tag });
  },
);

adminInsightsRouter.delete(
  '/tags/:id',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.status(204).send();
  },
);

// ─── SERIES ───────────────────────────────────────────────────────────────────

adminInsightsRouter.get(
  '/series',
  requireInsightsRead,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const series = await prisma.series.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: series });
  },
);

adminInsightsRouter.post(
  '/series',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateSeriesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const series = await prisma.series.create({ data: parsed.data });
    res.status(201).json({ data: series });
  },
);

adminInsightsRouter.patch(
  '/series/:id',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = UpdateSeriesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const series = await prisma.series.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ data: series });
  },
);

// ─── AUTHORS ──────────────────────────────────────────────────────────────────

adminInsightsRouter.get(
  '/authors',
  requireInsightsRead,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const authors = await prisma.author.findMany({ orderBy: { displayName: 'asc' } });
    res.json({ data: authors });
  },
);

adminInsightsRouter.post(
  '/authors',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = CreateAuthorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const author = await prisma.author.create({ data: parsed.data });
    res.status(201).json({ data: author });
  },
);

adminInsightsRouter.patch(
  '/authors/:id',
  requireInsightsAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = UpdateAuthorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const author = await prisma.author.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ data: author });
  },
);
