/**
 * P55.A2 — Newsletter lifecycle (confirm + unsubscribe + feedback).
 *
 * Complements existing /api/newsletter/subscribe route by adding:
 *   - GET  /api/newsletter/confirm/:token     — double-opt-in confirmation
 *   - GET  /api/newsletter/unsubscribe/:token — one-click unsubscribe
 *   - POST /api/newsletter/feedback           — post-unsubscribe reason
 *
 * Token strategy: HMAC(email|action|expiry) signed with NEWSLETTER_HMAC_SECRET.
 * No DB schema migration needed — token state is self-contained.
 *
 * Mount in server/routes/index.ts:
 *   import lifecycleRouter from './newsletter-lifecycle';
 *   router.use('/newsletter', lifecycleRouter);
 *
 * (Existing /newsletter/subscribe route remains in newsletter.ts; this file
 * adds NEW paths only — no conflicts.)
 */

import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { contactLimiter } from '../middleware/rateLimiter';
import { enrollSubscriber } from '../jobs/drip-campaign';

const router = Router();

const HMAC_SECRET = process.env.NEWSLETTER_HMAC_SECRET ?? '';
const TOKEN_TTL_DAYS = 30;
const APP_URL = process.env.APP_URL ?? 'https://www.ecypro.com';

interface TokenPayload {
  email: string;
  action: 'confirm' | 'unsubscribe';
  expiresAt: number;
}

function sign(payload: TokenPayload): string {
  if (!HMAC_SECRET) return '';
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function verify(token: string): TokenPayload | null {
  if (!HMAC_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(body)
    .digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateConfirmToken(email: string): string {
  return sign({
    email: email.toLowerCase(),
    action: 'confirm',
    expiresAt: Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function generateUnsubscribeToken(email: string): string {
  return sign({
    email: email.toLowerCase(),
    action: 'unsubscribe',
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  });
}

// ── GET /confirm/:token ────────────────────────────────────────────────────

router.get('/confirm/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    if (!token) return res.redirect(302, `${APP_URL}/newsletter/invalid-token`);
    const payload = verify(token);
    if (!payload || payload.action !== 'confirm') {
      return res.redirect(302, `${APP_URL}/newsletter/invalid-token`);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: payload.email },
    });

    if (!subscriber) {
      return res.redirect(302, `${APP_URL}/newsletter/not-found`);
    }

    // Mark consent confirmed (re-use `consent` flag; semantically post-confirm)
    if (!subscriber.consent) {
      await prisma.newsletterSubscriber.update({
        where: { email: payload.email },
        data: { consent: true, unsubscribedAt: null },
      });
    }
    logger.info('[newsletter-lifecycle] confirmed', { email: payload.email });

    // Enroll in welcome drip sequence (no-op when DRIP_CAMPAIGN_ENABLED!=1)
    const firstName = subscriber.email.split('@')[0] ?? 'orada';
    await enrollSubscriber({
      subscriberId: subscriber.id,
      email: subscriber.email,
      firstName,
      sequenceKey: 'newsletter-welcome-tr',
    });

    return res.redirect(302, `${APP_URL}/newsletter/confirmed`);
  } catch (err) {
    next(err);
  }
});

// ── GET /unsubscribe/:token ────────────────────────────────────────────────

router.get('/unsubscribe/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    if (!token) return res.redirect(302, `${APP_URL}/newsletter/invalid-token`);
    const payload = verify(token);
    if (!payload || payload.action !== 'unsubscribe') {
      return res.redirect(302, `${APP_URL}/newsletter/invalid-token`);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: payload.email },
    });
    if (subscriber && subscriber.unsubscribedAt === null) {
      await prisma.newsletterSubscriber.update({
        where: { email: payload.email },
        data: { unsubscribedAt: new Date() },
      });
      logger.info('[newsletter-lifecycle] unsubscribed', { email: payload.email });
    }
    return res.redirect(302, `${APP_URL}/newsletter/unsubscribed?reason=optional`);
  } catch (err) {
    next(err);
  }
});

// ── POST /feedback ─────────────────────────────────────────────────────────

const feedbackSchema = z.object({
  email: z.string().email().max(254),
  reason: z.string().max(500).optional(),
  category: z
    .enum(['too-frequent', 'not-relevant', 'never-subscribed', 'tone-too-salesy', 'other'])
    .optional(),
});

router.post('/feedback', contactLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = feedbackSchema.parse(req.body);
    logger.info('[newsletter-lifecycle] unsubscribe feedback', {
      email: data.email.toLowerCase(),
      category: data.category ?? 'none',
      reasonLen: data.reason?.length ?? 0,
    });
    // We intentionally do NOT store reason content in DB to respect privacy —
    // category + counter aggregation only.
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
