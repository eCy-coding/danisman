/**
 * Phase 36 — Admin API Routes
 *
 * All routes require ADMIN role via authenticate + requireRole('ADMIN').
 * Covers: contacts, newsletter subscribers, site settings (key-value store),
 *         blog post management (filesystem MDX CRUD), analytics SSE stream.
 */

import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { logger } from '../config/logger';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

// ─── Contact Submissions ──────────────────────────────────────────────────────

router.get(
  '/contacts',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

      const where = isRead !== undefined ? { isRead } : {};
      const [total, items] = await Promise.all([
        prisma.contactSubmission.count({ where }),
        prisma.contactSubmission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.json({ status: 'success', data: { items, total, page, limit } });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/contacts/:id/read',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await prisma.contactSubmission.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      res.json({ status: 'success', data: item });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

router.get(
  '/newsletter',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
      const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

      const where = active !== undefined ? { unsubscribedAt: active ? null : { not: null } } : {};
      const [total, items] = await Promise.all([
        prisma.newsletterSubscriber.count({ where }),
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: { subscribedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            consent: true,
            source: true,
            subscribedAt: true,
            unsubscribedAt: true,
          },
        }),
      ]);

      res.json({ status: 'success', data: { items, total, page, limit } });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/newsletter/:id',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.newsletterSubscriber.update({
        where: { id: req.params.id },
        data: { unsubscribedAt: new Date() },
      });
      res.json({ status: 'success', message: 'Subscriber removed' });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Analytics Summary ────────────────────────────────────────────────────────

router.get(
  '/stats',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [contacts, subscribers, bookings, interactions] = await Promise.all([
        prisma.contactSubmission.count(),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.interaction.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
        }),
      ]);

      res.json({
        status: 'success',
        data: {
          unreadContacts: await prisma.contactSubmission.count({ where: { isRead: false } }),
          totalContacts: contacts,
          activeSubscribers: subscribers,
          pendingBookings: bookings,
          weeklyInteractions: interactions,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Users (RBAC management) ──────────────────────────────────────────────────

router.get(
  '/users',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const search = (req.query.search as string) ?? '';
      const where = search
        ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
        : {};

      const [total, items] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            _count: { select: { bookings: true } },
          },
        }),
      ]);

      res.json({ status: 'success', data: { items, total, page, limit } });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/users/:id/role',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.body as { role: string };
      const validRoles = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ status: 'error', message: 'Invalid role' });
        return;
      }

      const before = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { role: true },
      });
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: role as never },
      });

      await prisma.auditLog.create({
        data: {
          adminId: (req as Request & { user?: { id: string } }).user?.id ?? 'unknown',
          action: 'USER_ROLE_CHANGE',
          targetType: 'User',
          targetId: req.params.id,
          oldValue: { role: before?.role },
          newValue: { role },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/users/:id/active',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive } = req.body as { isActive: boolean };
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive },
      });

      await prisma.auditLog.create({
        data: {
          adminId: (req as Request & { user?: { id: string } }).user?.id ?? 'unknown',
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          targetType: 'User',
          targetId: req.params.id,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Site Settings (key-value store) ─────────────────────────────────────────

const DEFAULT_CONFIGS = [
  { key: 'site.maintenance', value: 'false', type: 'boolean', label: 'Bakım Modu' },
  { key: 'seo.og_image', value: '/og-image.jpg', type: 'string', label: 'OG Image URL' },
  { key: 'analytics.ga4_id', value: '', type: 'string', label: 'GA4 Measurement ID' },
  { key: 'email.from', value: 'EcyPro <noreply@ecypro.com>', type: 'string', label: 'Email From' },
  {
    key: 'booking.duration_min',
    value: '30',
    type: 'number',
    label: 'Default Meeting Duration (min)',
  },
  { key: 'signup.enabled', value: 'true', type: 'boolean', label: 'Yeni Kayıt Açık' },
];

router.get(
  '/settings',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stored = await prisma.siteConfig.findMany({ orderBy: { key: 'asc' } });
      const storedMap = new Map(stored.map((s) => [s.key, s]));

      const merged = DEFAULT_CONFIGS.map(
        (d) => storedMap.get(d.key) ?? { ...d, id: '', updatedAt: new Date(), updatedBy: null },
      );
      res.json({ status: 'success', data: merged });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/settings',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updates = req.body as Array<{
        key: string;
        value: string;
        type?: string;
        label?: string;
      }>;
      const adminId = (req as Request & { user?: { id: string } }).user?.id ?? 'unknown';

      for (const update of updates) {
        await prisma.siteConfig.upsert({
          where: { key: update.key },
          update: { value: update.value, updatedBy: adminId },
          create: {
            key: update.key,
            value: update.value,
            type: update.type ?? 'string',
            label: update.label,
            updatedBy: adminId,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'SETTING_UPDATE',
          newValue: Object.fromEntries(updates.map((u) => [u.key, u.value])) as never,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({ status: 'success', message: `${updates.length} setting(s) updated` });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Audit Log ───────────────────────────────────────────────────────────────

router.get(
  '/audit-log',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const action = req.query.action as string | undefined;

      const where = action ? { action } : {};
      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.json({ status: 'success', data: { items, total, page, limit } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Blog Post Management (P36-T01) ──────────────────────────────────────────

const BLOG_DIR = path.resolve(process.cwd(), 'src/content/blog');

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match || !match[1]) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return meta;
}

router.get(
  '/blog',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!fs.existsSync(BLOG_DIR)) {
        res.json({ status: 'success', data: { items: [], total: 0 } });
        return;
      }

      const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
      const items = files.map((file) => {
        const slug = file.replace(/\.(mdx|md)$/, '');
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const meta = parseFrontmatter(content);
        const stat = fs.statSync(filePath);
        return {
          slug,
          title: meta.title ?? slug,
          date: meta.date ?? stat.mtime.toISOString().slice(0, 10),
          category: meta.category ?? 'General',
          readTime: meta.readTime ?? '5 min',
          excerpt: meta.excerpt ?? '',
          author: meta.author ?? 'EcyPro Consulting',
          lang: meta.lang ?? 'tr',
          status: meta.status ?? 'published',
          sizeBytes: stat.size,
        };
      });

      items.sort((a, b) => b.date.localeCompare(a.date));
      res.json({ status: 'success', data: { items, total: items.length } });
    } catch (err) {
      logger.error('[AdminBlog] list error', { message: (err as Error).message });
      next(err);
    }
  },
);

router.get(
  '/blog/:slug',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const candidates = [path.join(BLOG_DIR, `${slug}.mdx`), path.join(BLOG_DIR, `${slug}.md`)];
      const filePath = candidates.find((c) => fs.existsSync(c));
      if (!filePath) {
        res.status(404).json({ status: 'error', message: 'Post not found' });
        return;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = parseFrontmatter(content);
      res.json({ status: 'success', data: { slug, meta, content } });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/blog',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug, content, title } = req.body as {
        slug: string;
        content?: string;
        title?: string;
      };
      if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        res.status(400).json({ status: 'error', message: 'slug must be lowercase-kebab-case' });
        return;
      }

      const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
      if (fs.existsSync(filePath)) {
        res.status(409).json({ status: 'error', message: 'Post already exists' });
        return;
      }

      if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

      const today = new Date().toISOString().slice(0, 10);
      const mdxContent =
        content ??
        `---
title: "${title ?? slug}"
date: "${today}"
category: "Strategy"
readTime: "5 min"
excerpt: ""
author: "EcyPro Consulting"
lang: "tr"
status: "draft"
---

# ${title ?? slug}

`;

      fs.writeFileSync(filePath, mdxContent, 'utf-8');
      logger.info('[AdminBlog] created', { slug });

      res
        .status(201)
        .json({ status: 'success', data: { slug, filePath: `src/content/blog/${slug}.mdx` } });
    } catch (err) {
      logger.error('[AdminBlog] create error', { message: (err as Error).message });
      next(err);
    }
  },
);

router.patch(
  '/blog/:slug',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const { content } = req.body as { content: string };
      if (!content || typeof content !== 'string') {
        res.status(400).json({ status: 'error', message: 'content is required' });
        return;
      }

      const candidates = [path.join(BLOG_DIR, `${slug}.mdx`), path.join(BLOG_DIR, `${slug}.md`)];
      const filePath = candidates.find((c) => fs.existsSync(c));
      if (!filePath) {
        res.status(404).json({ status: 'error', message: 'Post not found' });
        return;
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      logger.info('[AdminBlog] updated', { slug });
      res.json({ status: 'success', message: 'Post updated' });
    } catch (err) {
      logger.error('[AdminBlog] update error', { message: (err as Error).message });
      next(err);
    }
  },
);

router.delete(
  '/blog/:slug',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const candidates = [path.join(BLOG_DIR, `${slug}.mdx`), path.join(BLOG_DIR, `${slug}.md`)];
      const filePath = candidates.find((c) => fs.existsSync(c));
      if (!filePath) {
        res.status(404).json({ status: 'error', message: 'Post not found' });
        return;
      }

      fs.unlinkSync(filePath);
      logger.info('[AdminBlog] deleted', { slug });
      res.json({ status: 'success', message: 'Post deleted' });
    } catch (err) {
      logger.error('[AdminBlog] delete error', { message: (err as Error).message });
      next(err);
    }
  },
);

export default router;
