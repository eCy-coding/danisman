/**
 * P57.4 — Admin content overrides (services + static pages).
 *
 * Redis-backed override layer; build-time data file değişmez, admin canlı
 * field'ları geçici override eder. ServiceDetailLayout opsiyonel fetcher
 * P57.10+ rollout (P57.4'te yalnızca CRUD).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const SERVICE_KEY = (slug: string) => `content:service:${slug}`;
const PAGE_KEY = (pageId: string) => `content:page:${pageId}`;

router.get(
  '/service/:slug',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      if (!slug) return res.status(400).json({ status: 'error', message: 'slug required' });
      const raw = await redis.get(SERVICE_KEY(slug));
      const data = raw ? JSON.parse(raw) : {};
      res.json({ status: 'ok', data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/service/:slug',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      if (!slug) return res.status(400).json({ status: 'error', message: 'slug required' });
      const payload = req.body as Record<string, unknown>;
      await redis.set(SERVICE_KEY(slug), JSON.stringify(payload));
      res.json({ status: 'ok', data: payload });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/page/:pageId',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageId = req.params.pageId;
      if (!pageId) return res.status(400).json({ status: 'error', message: 'pageId required' });
      const raw = await redis.get(PAGE_KEY(pageId));
      const data = raw ? JSON.parse(raw) : {};
      res.json({ status: 'ok', data });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/page/:pageId',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageId = req.params.pageId;
      if (!pageId) return res.status(400).json({ status: 'error', message: 'pageId required' });
      const payload = req.body as Record<string, unknown>;
      await redis.set(PAGE_KEY(pageId), JSON.stringify(payload));
      res.json({ status: 'ok', data: payload });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
