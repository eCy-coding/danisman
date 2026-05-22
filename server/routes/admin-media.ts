/**
 * P57.8 — Media library backend.
 *
 * Mevcut altyapı: server/workers/image-resize-worker.ts (Sharp resize var).
 * Bu route metadata-only — gerçek upload multer middleware'i ekleme
 * P57.10 sonrası (Multer + Sharp + AVIF/WebP variant). Şimdilik metadata
 * Redis hash'inde tutulur; admin paneli görsellerin URL listesini sürer.
 *
 * Routes:
 *   GET /              — list metadata
 *   POST /upload       — stub (501 — multer middleware sonradan)
 *   DELETE /:id        — remove metadata
 */

import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const KEY = 'media:items';

interface MediaRecord {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  createdAt: number;
}

router.get('/', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const map = await redis.hgetall(KEY);
    const items = Object.values(map)
      .map((s) => {
        try {
          return JSON.parse(s) as MediaRecord;
        } catch {
          return null;
        }
      })
      .filter((x): x is MediaRecord => x !== null);
    items.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ status: 'ok', data: { items, total: items.length } });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Stub: gerçek upload Multer middleware + Sharp pipeline ile genişletilecek.
    // Şimdilik yalnızca metadata oluştur — file URL `body.url` ile sağlanabilir.
    const body = req.body as {
      filename?: string;
      url?: string;
      mimetype?: string;
      size?: number;
      width?: number;
      height?: number;
    };
    if (!body.filename || !body.url) {
      return res
        .status(400)
        .json({ status: 'error', message: 'filename + url required (multer pipeline pending)' });
    }
    const record: MediaRecord = {
      id: crypto.randomUUID(),
      filename: body.filename,
      url: body.url,
      mimetype: body.mimetype ?? 'image/jpeg',
      size: body.size ?? 0,
      width: body.width,
      height: body.height,
      createdAt: Date.now(),
    };
    await redis.hset(KEY, record.id, JSON.stringify(record));
    res.status(201).json({ status: 'ok', data: record });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    await redis.hdel(KEY, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
