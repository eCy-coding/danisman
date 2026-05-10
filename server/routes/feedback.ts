/**
 * P37-T10: Post-Booking NPS Feedback Routes
 *
 * Public routes (token-gated, no login required):
 *   GET  /api/feedback/:bookingId        → verify token, return booking info
 *   POST /api/feedback/:bookingId        → submit NPS score + comment
 *
 * Admin routes:
 *   GET  /api/feedback/nps-summary       → NPS aggregate (promoters/passives/detractors)
 *   GET  /api/feedback                   → paginated feedback list
 *
 * NPS Math:
 *   Promoters  = score ∈ {9, 10}
 *   Passives   = score ∈ {7, 8}
 *   Detractors = score ∈ {0, 1, 2, 3, 4, 5, 6}
 *   NPS = (Promoters/Total × 100) - (Detractors/Total × 100) ∈ [-100, 100]
 *
 * Token:
 *   HMAC-SHA256(bookingId + '|feedback|' + expiresAt, BOOKING_HMAC_SECRET)
 *   TTL = 7 days; single-use (tokenUsed flag)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma as _prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { verifyManageToken } from '../lib/hmac';
import { logger } from '../config/logger';
import { feedbackLimiter } from '../middleware/rateLimiter';

// Prisma extended with BookingFeedback model (available after `prisma generate`)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

const router = Router();

// ─── Token validator ──────────────────────────────────────

const tokenQuerySchema = z.object({
  token: z.string().min(10),
});

// ─── GET /api/feedback/:bookingId — check token validity ──

router.get(
  '/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const { token } = tokenQuerySchema.parse(req.query);

      // Verify HMAC token (reuse manage token logic — same secret)
      const { valid } = verifyManageToken(token);
      if (!valid) throw new HttpError(401, 'INVALID_TOKEN', 'Feedback token is invalid or expired');

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          scheduledAt: true,
          durationMin: true,
          user: { select: { name: true } },
          feedback: { select: { tokenUsed: true, score: true } },
        },
      });

      if (!booking) throw new HttpError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.feedback?.tokenUsed) {
        res.json({ status: 'already_submitted', data: { score: booking.feedback.score } });
        return;
      }

      res.json({
        status: 'success',
        data: {
          bookingId: booking.id,
          scheduledAt: booking.scheduledAt,
          userName: booking.user.name,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/feedback/:bookingId — submit NPS ───────────

const feedbackSchema = z.object({
  token: z.string().min(10),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(1000).optional(),
});

router.post(
  '/:bookingId',
  feedbackLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const { token, score, comment } = feedbackSchema.parse(req.body);

      const { valid } = verifyManageToken(token);
      if (!valid) throw new HttpError(401, 'INVALID_TOKEN', 'Feedback token is invalid or expired');

      // Check booking exists and has no feedback yet
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { feedback: true },
      });
      if (!booking) throw new HttpError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.feedback?.tokenUsed) {
        throw new HttpError(
          409,
          'ALREADY_SUBMITTED',
          'Feedback already submitted for this booking',
        );
      }

      // Upsert feedback (create on first submit, mark tokenUsed)
      await prisma.bookingFeedback.upsert({
        where: { bookingId },
        create: { bookingId, score, comment, token, tokenUsed: true },
        update: { score, comment, tokenUsed: true, submittedAt: new Date() },
      });

      logger.info('[Feedback] NPS submitted', { bookingId, score });
      res.json({ status: 'success', data: { message: 'Değerlendirmeniz için teşekkürler!' } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/feedback/nps-summary — admin NPS aggregate ──

router.get(
  '/nps-summary',
  authenticate,
  requireRole('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allFeedback = await prisma.bookingFeedback.findMany({
        where: { tokenUsed: true },
        select: { score: true, submittedAt: true },
      });

      const total = allFeedback.length;
      if (total === 0) {
        res.json({
          status: 'success',
          data: { nps: null, total: 0, promoters: 0, passives: 0, detractors: 0 },
        });
        return;
      }

      type FeedbackRow = { score: number; submittedAt: Date };
      const promoters = (allFeedback as FeedbackRow[]).filter((f) => f.score >= 9).length;
      const passives = (allFeedback as FeedbackRow[]).filter(
        (f) => f.score === 7 || f.score === 8,
      ).length;
      const detractors = (allFeedback as FeedbackRow[]).filter((f) => f.score <= 6).length;

      // NPS formula: (Promoters/Total - Detractors/Total) × 100
      const nps = Math.round(((promoters - detractors) / total) * 100);

      // Average score (arithmetic mean)
      const avgScore =
        (allFeedback as FeedbackRow[]).reduce((sum: number, f: FeedbackRow) => sum + f.score, 0) /
        total;

      // Last 30 days trend
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recent = (allFeedback as FeedbackRow[]).filter((f) => f.submittedAt >= thirtyDaysAgo);
      const recentNps =
        recent.length > 0
          ? Math.round(
              ((recent.filter((f) => f.score >= 9).length -
                recent.filter((f) => f.score <= 6).length) /
                recent.length) *
                100,
            )
          : null;

      res.json({
        status: 'success',
        data: {
          nps,
          recentNps,
          avgScore: Math.round(avgScore * 10) / 10,
          total,
          promoters,
          passives,
          detractors,
          promoterPct: Math.round((promoters / total) * 100),
          detractorPct: Math.round((detractors / total) * 100),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/feedback — admin paginated list ─────────────

router.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
      const limit = Math.min(50, parseInt(String(req.query.limit ?? '20')));

      const [feedbacks, count] = await Promise.all([
        prisma.bookingFeedback.findMany({
          where: { tokenUsed: true },
          orderBy: { submittedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            booking: {
              select: { scheduledAt: true, user: { select: { name: true, email: true } } },
            },
          },
        }),
        prisma.bookingFeedback.count({ where: { tokenUsed: true } }),
      ]);

      res.json({
        status: 'success',
        data: feedbacks,
        meta: { page, limit, total: count, pages: Math.ceil(count / limit) },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
