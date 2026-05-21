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
import { cacheStats, invalidateCache, getCacheStore } from '../middleware/cache';
import {
  clampAuditLimit,
  decodeAuditCursor,
  encodeAuditCursor,
  parseAuditFilters,
} from '../lib/audit-cursor';
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

// P58 — Single contact detail (used by AdminLeadDetailPage)
router.get(
  '/contacts/:id',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await prisma.contactSubmission.findUnique({
        where: { id: req.params.id },
      });
      if (!item) {
        res.status(404).json({ status: 'error', message: 'Not found' });
        return;
      }
      res.json({ status: 'success', data: item });
    } catch (err) {
      next(err);
    }
  },
);

// P58 — Generic contact PATCH (isRead toggle + future field updates)
router.patch(
  '/contacts/:id',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { isRead?: boolean };
      const data: { isRead?: boolean } = {};
      if (typeof body.isRead === 'boolean') data.isRead = body.isRead;
      if (Object.keys(data).length === 0) {
        res.status(400).json({ status: 'error', message: 'No updatable fields' });
        return;
      }
      const item = await prisma.contactSubmission.update({
        where: { id: req.params.id },
        data,
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
  { key: 'email.from', value: 'eCyPro <noreply@ecypro.com>', type: 'string', label: 'Email From' },
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
// P16 BE Track 2 / Aşama 3 — cursor-based query API with filters.
//
// Why cursor (not skip-based pagination)?
//   - Skip-based degrades O(n) on large tables: `OFFSET 50000` makes Postgres
//     materialise + discard 50k rows. AuditLog grows monotonically (one row per
//     admin action) — by month 6 we'd be paying that cost on every drill-down.
//   - Cursor (createdAt, id) tuple uses the @@index([adminId, createdAt]) and
//     @@index([createdAt]) composite indexes added in P14-BE Track 2; pagination
//     is O(log n) regardless of depth.
//
// Filters: adminId, action, targetType, targetId, startDate, endDate.
// All filters AND'd together. Cursor is opaque (base64url(createdAt|id)).
// Cursor codec + filter parsing live in `server/lib/audit-cursor.ts` so they
// can be unit-tested without spinning up a Prisma instance.

router.get(
  '/audit-log',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = clampAuditLimit(req.query.limit);

      const parsed = parseAuditFilters(req.query as Record<string, unknown>);
      if (parsed.error) {
        res.status(400).json({ status: 'error', ...parsed.error });
        return;
      }
      const filters = parsed.filters;

      const cursorParam = typeof req.query.cursor === 'string' ? req.query.cursor : null;
      const decoded = cursorParam ? decodeAuditCursor(cursorParam) : null;
      if (cursorParam && !decoded) {
        res.status(400).json({
          status: 'error',
          code: 'INVALID_CURSOR',
          message: 'cursor is not a valid pagination token.',
        });
        return;
      }

      // Prisma cursor semantics: pass `cursor: { id }` + skip 1 to start AFTER
      // that row. orderBy mirrors the index direction (createdAt DESC, id DESC)
      // so tied timestamps tie-break deterministically.
      const findArgs = {
        where: filters,
        orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
        take: limit + 1, // +1 to detect hasMore without a second count() call
        ...(decoded ? { cursor: { id: decoded.id }, skip: 1 } : {}),
      };

      const items = await prisma.auditLog.findMany(findArgs);
      const hasMore = items.length > limit;
      const page = hasMore ? items.slice(0, limit) : items;
      const tail = page[page.length - 1];
      const nextCursor =
        hasMore && tail
          ? encodeAuditCursor({
              createdAt: tail.createdAt.toISOString(),
              id: tail.id,
            })
          : null;

      res.json({
        status: 'success',
        data: {
          items: page,
          pagination: {
            limit,
            hasMore,
            nextCursor,
          },
          filters: {
            adminId: filters.adminId ?? null,
            action: filters.action ?? null,
            targetType: filters.targetType ?? null,
            targetId: filters.targetId ?? null,
            startDate: filters.createdAt?.gte?.toISOString() ?? null,
            endDate: filters.createdAt?.lte?.toISOString() ?? null,
          },
        },
      });
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
          author: meta.author ?? 'eCyPro Consulting',
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
author: "eCyPro Consulting"
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

// ─── P16 BE Track 2 / Aşama 1 — Cache observability ─────────────────────────
// Admin-only counters so we can verify hit rate target post-deploy.
router.get('/cache/stats', ...adminOnly, (_req: Request, res: Response): void => {
  res.json({ status: 'success', data: cacheStats() });
});

router.post('/cache/invalidate', ...adminOnly, (req: Request, res: Response): void => {
  const prefix = typeof req.body?.prefix === 'string' ? req.body.prefix : '';
  if (!prefix || prefix.length < 2) {
    res.status(400).json({ status: 'error', message: 'prefix is required (min 2 chars)' });
    return;
  }
  const purged = invalidateCache(prefix);
  res.json({ status: 'success', data: { prefix, purged } });
});

router.delete('/cache', ...adminOnly, (_req: Request, res: Response): void => {
  const store = getCacheStore();
  const before = store.stats().size;
  store.clear();
  logger.info('[Admin] cache cleared', { before });
  res.json({ status: 'success', data: { cleared: before } });
});

// ─── P20 BE Aşama 4 — Cache warm-up (post-deploy hook) ──────────────────────
//
// Two auth modes:
//   1. CACHE_WARMUP_TOKEN bearer (preferred — runnable from Render's
//      postDeployCommand which doesn't have an admin JWT).
//   2. Admin JWT fallback (manual operator trigger).
//
// Endpoint list is curated in `server/workers/cache-warmup-worker.ts`.
// Sequential 200 ms-spaced fetches — internal hop bypasses anonymous rate
// budget via `x-cache-warmup` header marker.
router.post(
  '/cache/warmup',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expectedToken = process.env.CACHE_WARMUP_TOKEN?.trim();
      const auth = req.headers.authorization ?? '';
      const presented = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      const tokenMatch =
        expectedToken && presented && expectedToken.length >= 16 && presented === expectedToken;

      if (!tokenMatch) {
        // Fall back to admin JWT path.
        // Re-run authenticate+requireRole manually so token failure surfaces
        // as 401 token error before role check.
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
        });
        await new Promise<void>((resolve, reject) => {
          requireRole('ADMIN')(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
        });
      }

      const { warmupCache } = await import('../workers/cache-warmup-worker');
      const baseUrl =
        process.env.CACHE_WARMUP_BASE_URL?.trim() ||
        `${req.protocol}://${req.get('host') ?? 'localhost'}`;
      const summary = await warmupCache({ baseUrl });
      res.json({ status: 'success', data: summary });
    } catch (err) {
      logger.error('[Admin] cache warmup failed', { message: (err as Error).message });
      next(err);
    }
  },
);

// ─── P17 BE Track 2 / Aşama 4 — API key admin CRUD ─────────────────────────
//
// POST   /api/admin/api-keys           create  → returns raw key ONCE
// GET    /api/admin/api-keys           list owned + platform keys
// DELETE /api/admin/api-keys/:id       revoke (soft, sets revokedAt)
//
// Security model:
//   - Only ADMIN can mint / revoke keys.
//   - Raw key is generated with crypto.randomBytes(32).toString('base64url')
//     (256 bits of entropy; URL-safe; ~43 chars). Returned exactly once
//     in the create response; we never log it.
//   - The DB stores SHA-256(raw) so a DB leak doesn't grant API access.
//
// Audit: revocation lands in audit_logs (P14-BE table). Creation
// intentionally omits the raw value from the audit row.

import { randomBytes } from 'node:crypto';
import { hashApiKey, invalidateCachedKey } from '../middleware/api-key-auth';

router.post(
  '/api-keys',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const scopes = Array.isArray(req.body?.scopes)
        ? req.body.scopes.filter((s: unknown): s is string => typeof s === 'string')
        : [];
      const expiresAt =
        typeof req.body?.expiresAt === 'string' ? new Date(req.body.expiresAt) : null;
      const userId = typeof req.body?.userId === 'string' ? req.body.userId : null;

      if (name.length === 0 || name.length > 120) {
        res.status(400).json({
          status: 'error',
          code: 'API_KEY_NAME_REQUIRED',
          message: 'name is required (1–120 chars)',
        });
        return;
      }
      if (scopes.length === 0) {
        res.status(400).json({
          status: 'error',
          code: 'API_KEY_SCOPES_REQUIRED',
          message: 'at least one scope tag is required',
        });
        return;
      }
      if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        res.status(400).json({
          status: 'error',
          code: 'API_KEY_EXPIRES_AT_INVALID',
          message: 'expiresAt must be a valid ISO 8601 timestamp',
        });
        return;
      }

      const raw = `ecy_${randomBytes(32).toString('base64url')}`;
      const hashedKey = hashApiKey(raw);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (prisma as any).apiKey.create({
        data: {
          hashedKey,
          name,
          scopes,
          userId,
          expiresAt,
        },
      });

      logger.info('[Admin/API-Keys] minted', {
        keyId: row.id,
        name,
        scopes,
        userId,
      });

      // ⚠️ Return the raw key ONCE. Never logged. Never recoverable.
      res.status(201).json({
        status: 'success',
        data: {
          id: row.id,
          rawKey: raw,
          name: row.name,
          scopes: row.scopes,
          userId: row.userId,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/api-keys',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeRevoked = req.query.includeRevoked === 'true';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await (prisma as any).apiKey.findMany({
        where: includeRevoked ? {} : { revokedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          scopes: true,
          userId: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
        },
      });
      res.json({ status: 'success', data: rows });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/api-keys/:id',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (prisma as any).apiKey.findUnique({ where: { id } });
      if (!row) {
        res.status(404).json({
          status: 'error',
          code: 'API_KEY_NOT_FOUND',
          message: 'API key not found',
        });
        return;
      }
      if (row.revokedAt) {
        res.json({
          status: 'success',
          data: { id, revokedAt: row.revokedAt, alreadyRevoked: true },
        });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (prisma as any).apiKey.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
      // Eagerly flush the auth cache so a request mid-flight can't replay.
      invalidateCachedKey(row.hashedKey);

      logger.info('[Admin/API-Keys] revoked', { keyId: id, name: row.name });
      res.json({
        status: 'success',
        data: { id, revokedAt: updated.revokedAt, alreadyRevoked: false },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
