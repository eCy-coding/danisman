/**
 * P57.5 — Generic CRUD for collection-type content.
 *
 * Tek API, çoklu koleksiyon: testimonials, team, case-studies, pillars,
 * industry-reports, annual-reports, faq-items. Redis-backed (hash):
 * `coll:<type>:items` (list of JSON strings keyed by id).
 *
 * Routes (mounted at /api/admin/collections):
 *   GET    /:type           — list
 *   POST   /:type           — create
 *   GET    /:type/:id       — read
 *   PATCH  /:type/:id       — update
 *   DELETE /:type/:id       — remove
 */

import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const ALLOWED = new Set([
  'testimonials',
  'team',
  'case-studies',
  'pillars',
  'industry-reports',
  'annual-reports',
  'faq-items',
]);

const KEY = (type: string) => `coll:${type}:items`;

router.get('/:type', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type;
    if (!type || !ALLOWED.has(type)) return res.status(400).json({ status: 'error', message: 'unknown collection' });
    const map = await redis.hgetall(KEY(type));
    const items = Object.values(map).map((s) => {
      try { return JSON.parse(s) as Record<string, unknown>; } catch { return null; }
    }).filter((x): x is Record<string, unknown> => x !== null);
    res.json({ status: 'ok', data: { items, total: items.length } });
  } catch (err) {
    next(err);
  }
});

router.post('/:type', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type;
    if (!type || !ALLOWED.has(type)) return res.status(400).json({ status: 'error', message: 'unknown collection' });
    const id = crypto.randomUUID();
    const item = { id, createdAt: Date.now(), ...(req.body as Record<string, unknown>) };
    await redis.hset(KEY(type), id, JSON.stringify(item));
    res.status(201).json({ status: 'ok', data: item });
  } catch (err) {
    next(err);
  }
});

router.get('/:type/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type;
    const id = req.params.id;
    if (!type || !id || !ALLOWED.has(type)) return res.status(400).json({ status: 'error', message: 'invalid request' });
    const raw = await redis.hget(KEY(type), id);
    if (!raw) return res.status(404).json({ status: 'error', message: 'not_found' });
    res.json({ status: 'ok', data: JSON.parse(raw) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:type/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type;
    const id = req.params.id;
    if (!type || !id || !ALLOWED.has(type)) return res.status(400).json({ status: 'error', message: 'invalid request' });
    const raw = await redis.hget(KEY(type), id);
    if (!raw) return res.status(404).json({ status: 'error', message: 'not_found' });
    const merged = { ...JSON.parse(raw), ...(req.body as Record<string, unknown>), id, updatedAt: Date.now() };
    await redis.hset(KEY(type), id, JSON.stringify(merged));
    res.json({ status: 'ok', data: merged });
  } catch (err) {
    next(err);
  }
});

router.delete('/:type/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type;
    const id = req.params.id;
    if (!type || !id || !ALLOWED.has(type)) return res.status(400).json({ status: 'error', message: 'invalid request' });
    await redis.hdel(KEY(type), id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
