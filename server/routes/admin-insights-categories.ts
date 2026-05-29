import { Router } from 'express';
import type { Response, RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategorySchema,
  CategoryListQuerySchema,
} from '../schemas/insights-categories.zod';

export const adminInsightsCategoriesRouter = Router();

// ─── RBAC ────────────────────────────────────────────────────────────────────
// VIEWER  → GET only
// EDITOR + BLOG_AUTHOR → GET + POST + PATCH
// ADMIN   → full (incl. DELETE/archive)

const READ_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.BLOG_AUTHOR,
  UserRole.VIEWER,
];
const WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.EDITOR, UserRole.BLOG_AUTHOR];
const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN];

function requireRead(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!READ_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Read access required' });
    return;
  }
  next();
}

function requireWrite(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!WRITE_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Editor access required' });
    return;
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: () => void): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (!ADMIN_ROLES.includes(user.role as UserRole)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

adminInsightsCategoriesRouter.use(authenticate);

// ─── Slug auto-generator ─────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 150);
}

// ─── GET / — list with pagination + filter ───────────────────────────────────

adminInsightsCategoriesRouter.get(
  '/',
  requireRead as RequestHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const query = CategoryListQuerySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: 'Invalid query', details: query.error.flatten() });
      return;
    }
    const { domain, status, parentId, search, page, limit } = query.data;

    const where: Record<string, unknown> = {};
    if (domain) where.domain = domain;
    if (status) where.status = status;
    if (parentId === 'null') where.parentId = null;
    else if (parentId) where.parentId = parentId;
    if (search) {
      where.OR = [
        { nameTr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [items, total] = await Promise.all([
        prisma.insightCategory.findMany({
          where,
          include: {
            parent: { select: { id: true, nameTr: true, slug: true } },
            _count: { select: { posts: true } },
          },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.insightCategory.count({ where }),
      ]);

      res.json({
        status: 'ok',
        data: { items, total, page, limit, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      logger.error('category list error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── GET /tree — hierarchical tree (L1 + children) ──────────────────────────

adminInsightsCategoriesRouter.get(
  '/tree',
  requireRead as RequestHandler,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const roots = await prisma.insightCategory.findMany({
        where: { parentId: null, status: 'ACTIVE' },
        include: {
          children: {
            where: { status: 'ACTIVE' },
            include: { _count: { select: { posts: true } } },
            orderBy: { displayOrder: 'asc' },
          },
          _count: { select: { posts: true } },
        },
        orderBy: { displayOrder: 'asc' },
      });
      res.json({ status: 'ok', data: roots });
    } catch (err) {
      logger.error('category tree error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── POST / — create ─────────────────────────────────────────────────────────

adminInsightsCategoriesRouter.post(
  '/',
  requireWrite as RequestHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const body = CreateCategorySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Validation failed', details: body.error.flatten() });
      return;
    }

    const data = body.data;
    const slug = data.slug ?? toSlug(data.nameTr);

    const existing = await prisma.insightCategory.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: 'Slug already exists', slug });
      return;
    }

    try {
      const category = await prisma.insightCategory.create({
        data: {
          ...data,
          slug,
          createdBy: req.user?.id as string,
        },
        include: { _count: { select: { posts: true } } },
      });

      await prisma.auditLog.create({
        data: {
          adminId: req.user?.id as string,
          action: 'CATEGORY_CREATE',
          targetType: 'InsightCategory',
          targetId: category.id,
          newValue: { slug: category.slug, domain: category.domain },
        },
      });

      logger.info('category created', { id: category.id, slug: category.slug });
      res.status(201).json({ status: 'ok', data: category });
    } catch (err) {
      logger.error('category create error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── PATCH /reorder — bulk display order update ──────────────────────────────

adminInsightsCategoriesRouter.patch(
  '/reorder',
  requireWrite as RequestHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const body = ReorderCategorySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Validation failed', details: body.error.flatten() });
      return;
    }

    try {
      await Promise.all(
        body.data.items.map(({ id, displayOrder }) =>
          prisma.insightCategory.update({ where: { id }, data: { displayOrder } }),
        ),
      );

      res.json({ status: 'ok', updated: body.data.items.length });
    } catch (err) {
      logger.error('category reorder error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── PATCH /:id — update ─────────────────────────────────────────────────────

adminInsightsCategoriesRouter.patch(
  '/:id',
  requireWrite as RequestHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params['id'] as string;

    const existing = await prisma.insightCategory.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const body = UpdateCategorySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: 'Validation failed', details: body.error.flatten() });
      return;
    }

    try {
      const updated = await prisma.insightCategory.update({
        where: { id },
        data: body.data,
        include: { _count: { select: { posts: true } } },
      });

      await prisma.auditLog.create({
        data: {
          adminId: req.user?.id as string,
          action: 'CATEGORY_UPDATE',
          targetType: 'InsightCategory',
          targetId: id,
          newValue: JSON.parse(JSON.stringify(body.data)),
        },
      });

      res.json({ status: 'ok', data: updated });
    } catch (err) {
      logger.error('category update error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ─── DELETE /:id — soft archive ──────────────────────────────────────────────

adminInsightsCategoriesRouter.delete(
  '/:id',
  requireAdmin as RequestHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params['id'] as string;

    const existing = await prisma.insightCategory.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    try {
      const archived = await prisma.insightCategory.update({
        where: { id },
        data: { status: 'ARCHIVED' },
        include: { _count: { select: { posts: true } } },
      });

      await prisma.auditLog.create({
        data: {
          adminId: req.user?.id as string,
          action: 'CATEGORY_ARCHIVE',
          targetType: 'InsightCategory',
          targetId: id,
          newValue: { archived: true },
        },
      });

      logger.info('category archived', { id });
      res.json({ status: 'ok', data: archived });
    } catch (err) {
      logger.error('category archive error', { err });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);
