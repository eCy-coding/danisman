import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { contactLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  consent: z.boolean().refine((v) => v === true, { message: 'Consent is required' }),
  source: z.string().max(64).optional(),
});

/**
 * POST /api/newsletter/subscribe
 *
 * Idempotent subscription:
 * - first time → 201 SUBSCRIBED
 * - same email twice (still subscribed) → 200 ALREADY_SUBSCRIBED
 * - previously unsubscribed → re-subscribed (clear unsubscribedAt) → 200 RESUBSCRIBED
 *
 * Errors flow through the global error handler so the response respects the
 * Phase 19 ApiErrorEnvelope (status, code, message, requestId, eventId, issues).
 */
router.post('/subscribe', contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, consent, source } = subscribeSchema.parse(req.body);
    const key = email.toLowerCase();
    const ip = req.ip ?? null;
    const userAgent = (req.headers['user-agent'] ?? null) as string | null;

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: key } });

    if (existing && existing.unsubscribedAt === null) {
      return res.status(200).json({
        status: 'ok',
        code: 'ALREADY_SUBSCRIBED',
        message: 'Email already subscribed',
      });
    }

    if (existing && existing.unsubscribedAt !== null) {
      await prisma.newsletterSubscriber.update({
        where: { email: key },
        data: { unsubscribedAt: null, consent, source: source ?? existing.source, ip, userAgent },
      });
      logger.info('[newsletter] re-subscribed', { email: key, source });
      return res.status(200).json({
        status: 'ok',
        code: 'RESUBSCRIBED',
        message: 'Welcome back — subscription re-activated',
      });
    }

    await prisma.newsletterSubscriber.create({
      data: { email: key, consent, source: source ?? null, ip, userAgent },
    });
    logger.info('[newsletter] new subscriber', { email: key, source });

    // P62.C — admin SSE channel
    try {
      const { adminEventBus } = await import('../lib/event-bus');
      adminEventBus.publish('newsletter.subscribed', {
        email: key,
        source: source ?? null,
      });
    } catch {
      /* never block subscribe */
    }

    return res.status(201).json({
      status: 'ok',
      code: 'SUBSCRIBED',
      message: 'Subscription confirmed',
    });
  } catch (err) {
    // Race-condition fallback: a parallel request may have inserted the same
    // email between our findUnique and create. Treat as already-subscribed.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(200).json({
        status: 'ok',
        code: 'ALREADY_SUBSCRIBED',
        message: 'Email already subscribed',
      });
    }
    next(err);
  }
});

/**
 * GET /api/newsletter/stats
 * Public aggregate count only — no email leakage.
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const total = await prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: null },
    });
    res.json({ status: 'ok', total });
  } catch (err) {
    next(err);
  }
});

export default router;
