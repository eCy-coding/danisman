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
import { authenticate, requireRole } from '../middleware/auth';
import { redis } from '../config/redis';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

const KEY = (id: string) => `lead:notes:${id}`;

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

router.post('/:id/notes', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
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
    res.status(201).json({ status: 'ok', data: note });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:id/notes/:noteId',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
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
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
