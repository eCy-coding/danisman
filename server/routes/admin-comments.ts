// Register: app.use('/api/v1/admin', adminCommentsRouter)
// PATCH /api/v1/admin/insights/comments/:id   (EDITOR|ADMIN)
// GET   /api/v1/admin/insights/comments       (EDITOR|ADMIN)
// DELETE /api/v1/admin/insights/comments/:id  (ADMIN only)

import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/require-permission';
import { moderateCommentSchema } from '../schemas/comments.zod';

const router = Router();

router.use(authenticate);

// ─── GET moderation queue ─────────────────────────────────────────────────────

router.get(
  '/insights/comments',
  requirePermission('insights.comments.moderate'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const status = (req.query.status as string) ?? 'PENDING';
    const comments = await prisma.comment.findMany({
      where: { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        authorName: true,
        bodyMd: true,
        status: true,
        createdAt: true,
        post: { select: { id: true, slug: true, titleTr: true } },
      },
    });
    res.json({ status: 'ok', data: comments });
  },
);

// ─── PATCH — moderate comment ────────────────────────────────────────────────

router.patch(
  '/insights/comments/:id',
  requirePermission('insights.comments.moderate'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const parsed = moderateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ status: 'error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.comment.findUnique({ where: { id }, select: { status: true } });
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Yorum bulunamadı' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    logger.info('[admin-comments] Comment moderated', {
      id,
      from: existing.status,
      to: parsed.data.status,
      by: req.user?.id,
    });

    res.json({ status: 'ok', data: updated });
  },
);

// ─── DELETE — hard delete (ADMIN only, GDPR) ─────────────────────────────────

router.delete(
  '/insights/comments/:id',
  requirePermission('insights.comments.delete'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const { id } = _req.params;

    const existing = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Yorum bulunamadı' });
      return;
    }

    await prisma.comment.delete({ where: { id } });
    res.json({ status: 'ok', data: { deleted: 1 } });
  },
);

export default router;
