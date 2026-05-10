/**
 * P35-T09: Session Management Routes
 *
 * GET  /api/sessions         → list own active sessions (non-revoked)
 * DELETE /api/sessions/:id   → revoke specific session (add to JWT blacklist)
 * DELETE /api/sessions/all   → revoke all sessions except current
 *
 * Admin routes (via admin.ts):
 * GET  /api/admin/sessions/:userId → see any user's sessions
 *
 * Lifecycle integration:
 *   - On login (authController): upsert Session with jti
 *   - On JWT verify (middleware/auth.ts): update lastSeenAt
 *   - On logout: mark revokedAt + add jti to blacklist
 */

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { blacklistToken } from '../lib/jwt-blacklist';

const router = Router();

// ─── GET own sessions ─────────────────────────────────────

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const sessions = await prisma.session.findMany({
        where: { userId, revokedAt: null },
        orderBy: { lastSeenAt: 'desc' },
        select: {
          id: true,
          jti: true,
          userAgent: true,
          ip: true,
          createdAt: true,
          lastSeenAt: true,
        },
      });

      const currentJti = req.user?.jti;
      const enriched = sessions.map((s) => ({
        ...s,
        isCurrent: s.jti === currentJti,
      }));

      res.json({ status: 'success', data: enriched });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Revoke specific session ──────────────────────────────

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const session = await prisma.session.findFirst({
        where: { id: req.params.id, userId, revokedAt: null },
      });
      if (!session) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session not found');

      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      // Add JTI to blacklist (so future requests with this token get 401)
      await blacklistToken(session.jti, 60 * 60 * 24 * 7); // 7d TTL

      res.json({ status: 'success', data: { message: 'Session revoked' } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Revoke all sessions except current ──────────────────

router.delete(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const currentJti = req.user?.jti;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const others = await prisma.session.findMany({
        where: { userId, revokedAt: null, jti: { not: currentJti } },
        select: { id: true, jti: true },
      });

      await Promise.all([
        prisma.session.updateMany({
          where: { userId, revokedAt: null, jti: { not: currentJti } },
          data: { revokedAt: new Date() },
        }),
        ...others.map((s) => blacklistToken(s.jti, 60 * 60 * 24 * 7)),
      ]);

      res.json({ status: 'success', data: { revoked: others.length } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
