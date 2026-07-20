// Register: app.use('/api/v1', dsarCommentsRouter)
// KVKK Madde 11 — Veri sahibi hakları (SAR/DSAR)
// GET    /api/v1/dsar/comments?email=...   (auth: self or admin)
// DELETE /api/v1/dsar/comments?email=...   (auth: self or admin — right to erasure)

import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { authenticate, AuthRequest } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { adminMutationLimiter, ADMIN_MUTATION_LIMITS } from '../middleware/rate-limit-tier';

const router = Router();

router.use(authenticate);

// Security hardening — this router is mounted at `/dsar/comments`, outside
// the `/admin` prefix that carries the global CSRF check (see
// server/routes/index.ts), so it needs its own. Only the DELETE handler is
// a mutation; csrfProtection() no-ops on GET.
const csrf = csrfProtection();
const bulkDeleteLimiter = adminMutationLimiter(
  'admin:bulk-delete:dsar-comments',
  ADMIN_MUTATION_LIMITS.BULK_DELETE,
);

router.get('/dsar/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ status: 'error', message: 'E-posta parametresi gereklidir' });
    return;
  }

  const isAdmin = req.user?.role === 'ADMIN';
  const isSelf = req.user?.id !== undefined;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ status: 'error', message: 'Yetkisiz erişim' });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { authorEmail: email },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bodyMd: true,
      status: true,
      createdAt: true,
      post: { select: { slug: true, titleTr: true } },
    },
  });

  res.json({ status: 'ok', data: { email, comments, count: comments.length } });
});

router.delete(
  '/dsar/comments',
  csrf,
  bulkDeleteLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ status: 'error', message: 'E-posta parametresi gereklidir' });
      return;
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin) {
      res
        .status(403)
        .json({ status: 'error', message: 'Sadece yöneticiler silme işlemi yapabilir' });
      return;
    }

    const { count } = await prisma.comment.deleteMany({ where: { authorEmail: email } });

    logger.info('[dsar-comments] Comments erased via DSAR', { email, count, by: req.user?.id });

    res.json({ status: 'ok', data: { deleted: count } });
  },
);

export default router;
