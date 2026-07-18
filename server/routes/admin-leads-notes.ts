/**
 * P57.6 — Lead notes (Redis-backed).
 *
 * Routes (mounted at /api/admin/leads):
 *   GET  /:id/notes      — list (chronological)
 *   POST /:id/notes      — add (text)
 *   DELETE /:id/notes/:noteId
 *
 * Storage: list `lead:notes:<contactId>`, each entry JSON.
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

const KEY = (id: string) => `lead:notes:${id}`;

// KVKK m.10/12 accountability — lead notes are freeform personal-data
// commentary about a prospect. Fire-and-forget: an audit-write hiccup must
// never turn an already-successful mutation into a 500 for the operator.
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
          targetType: 'Lead',
          targetId,
          newValue: data as never,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-leads-notes] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-leads-notes] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

interface NoteRecord {
  id: string;
  text: string;
  createdAt: number;
  author: string;
}

router.get('/:id/notes', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
    const raw = await redis.lrange(KEY(id), 0, 99);
    const notes = raw
      .map((s) => {
        try {
          return JSON.parse(s) as NoteRecord;
        } catch {
          return null;
        }
      })
      .filter((x): x is NoteRecord => x !== null);
    res.json({ status: 'ok', data: notes });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/notes',
  ...adminOnly,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ status: 'error', message: 'id required' });
      const text = String((req.body as { text?: string }).text ?? '').trim();
      if (!text) return res.status(400).json({ status: 'error', message: 'text required' });
      const authReq = req as Request & { user?: { email?: string } };
      const note: NoteRecord = {
        id: crypto.randomUUID(),
        text,
        createdAt: Date.now(),
        author: authReq.user?.email ?? 'admin',
      };
      await redis.lpush(KEY(id), JSON.stringify(note));
      await redis.ltrim(KEY(id), 0, 99);
      writeAudit(req, 'LEAD_NOTE_ADDED', id, { noteId: note.id });
      res.status(201).json({ status: 'ok', data: note });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id/notes/:noteId',
  ...adminOnly,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const noteId = req.params.noteId;
      if (!id || !noteId) return res.status(400).json({ status: 'error', message: 'invalid' });
      const raw = await redis.lrange(KEY(id), 0, 99);
      for (const entry of raw) {
        try {
          const parsed = JSON.parse(entry) as NoteRecord;
          if (parsed.id === noteId) {
            await redis.lrem(KEY(id), 1, entry);
            break;
          }
        } catch {
          /* skip */
        }
      }
      writeAudit(req, 'LEAD_NOTE_DELETED', id, { noteId });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
