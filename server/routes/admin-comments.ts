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
import { hashIp } from '../lib/crypto/hashIp';

const router = Router();

router.use(authenticate);

// Moderation + hard-delete of user-submitted comments (personal data:
// authorName + bodyMd). Fire-and-forget: an audit-write hiccup must never
// turn an already-successful mutation into a 500.
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
          targetType: 'Comment',
          targetId,
          newValue: data as never,
        },
      })
      .catch((err: unknown) => {
        logger.error('[admin-comments] audit write failed', { action, targetId, err });
      });
  } catch (syncErr: unknown) {
    logger.error('[admin-comments] audit write threw synchronously', {
      action,
      err: syncErr,
    });
  }
}

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
    writeAudit(req, 'COMMENT_MODERATED', id!, { from: existing.status, to: parsed.data.status });

    res.json({ status: 'ok', data: updated });
  },
);

// ─── DELETE — hard delete (ADMIN only, GDPR) ─────────────────────────────────

router.delete(
  '/insights/comments/:id',
  requirePermission('insights.comments.delete'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const existing = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Yorum bulunamadı' });
      return;
    }

    await prisma.comment.delete({ where: { id } });
    writeAudit(req, 'COMMENT_DELETED', id!);
    res.json({ status: 'ok', data: { deleted: 1 } });
  },
);

export default router;
