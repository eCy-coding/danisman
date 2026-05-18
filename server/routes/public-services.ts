/**
 * P63.B — Public service override fetcher (no auth).
 *
 * GET /api/public/services/:slug
 *
 * Admin tarafı `PATCH /api/admin/content/service/:slug` ile Redis hash'ine
 * override yazıyor. Bu public endpoint, ServiceDetailLayout için aynı Redis
 * verisini okur ve frontend'in build-time static `service-content.ts` ile
 * merge etmesini sağlar.
 *
 * Cache: Redis read very fast; Cache-Control 30 saniye public.
 * Auth: yok (public).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

const router = Router();
const SLUG_REGEX = /^[a-z0-9-]+$/;
const KEY = (slug: string) => `content:service:${slug}`;

router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug ?? '';
    if (!SLUG_REGEX.test(slug) || slug.length > 80) {
      res.status(400).json({ status: 'error', message: 'invalid slug' });
      return;
    }
    const raw = await redis.get(KEY(slug));
    const override = raw ? JSON.parse(raw) : null;
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({ status: 'ok', data: { slug, override } });
  } catch (err) {
    next(err);
  }
});

export default router;
