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
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const KEY = 'media:items';

// Media library changes an admin makes — accountability trail for who
// added/removed what, when. Fire-and-forget: an audit-write hiccup must
// never turn an already-successful mutation into a 500.
function writeAudit(
  req: AuthRequest,
  action: string,
  targetId: string,
  data?: Record<string, unknown>,
): void {
  try {
    prisma.auditLog
      .create({
        data: {
          adminId: req.user?.id ?? 'system',
          actorRole: req.user?.role ?? 'ANONYMOUS',
          actorIpHash: hashIp(req.ip),
          action,
          targetType: 'Media',
          targetId,
          newValue: data as never,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-media] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-media] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

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

router.get('/', ...adminOnly, async (_req: Request, res: Response, _next: NextFunction) => {
  // S14 R16 — Redis "status=end" senaryosunda admin paneli media listesi
  // 500 alıyordu (global error handler aşağı geçti). Production /readyz
  // redis.ok=false zaten degraded mode'da olduğumuzu gösteriyor; UI'nin
  // burada tamamen 500'le crash etmesi yerine boş listeyi degraded bayrağı
  // ile döndür. Redis geri gelince transparent şekilde dolacak.
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
    // Redis down → 200 with empty + degraded flag (admin UI render-safe).
    res.json({
      status: 'ok',
      data: { items: [], total: 0 },
      degraded: 'redis_unavailable',
      detail: err instanceof Error ? err.message.slice(0, 80) : String(err).slice(0, 80),
    });
  }
});

router.post(
  '/upload',
  ...adminOnly,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      writeAudit(req, 'MEDIA_UPLOADED', record.id, { filename: record.filename });
      res.status(201).json({ status: 'ok', data: record });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', ...adminOnly, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    await redis.hdel(KEY, id);
    writeAudit(req, 'MEDIA_DELETED', id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
