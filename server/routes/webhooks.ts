/**
 * P37-T08: Cal.com Webhook Handler
 *
 * Receives Cal.com event notifications and syncs to the DB:
 *   - BOOKING_CREATED  → create/upsert Booking
 *   - BOOKING_RESCHEDULED → update scheduledAt
 *   - BOOKING_CANCELLED → update status to CANCELLED
 *
 * Security: HMAC-SHA256 signature verification (verifyCalWebhook).
 * Cal.com sends signature in: X-Cal-Signature-256 header.
 *
 * Setup:
 *   1. Cal.com dashboard → Webhooks → Add webhook
 *   2. URL: https://ecypro.com/api/webhooks/cal
 *   3. Events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
 *   4. Copy webhook secret → .env CAL_COM_WEBHOOK_SECRET
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { verifyCalWebhook } from '../lib/hmac';
import { logger } from '../config/logger';

const router = Router();

const CAL_WEBHOOK_SECRET = process.env.CAL_COM_WEBHOOK_SECRET ?? '';

interface CalWebhookPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CANCELLED';
  payload: {
    uid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    attendees?: Array<{ email: string; name: string }>;
    status?: string;
    cancellationReason?: string;
    metadata?: { ecyproBookingId?: string };
  };
}

router.post('/cal', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-cal-signature-256'] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify HMAC if secret is configured
  if (CAL_WEBHOOK_SECRET) {
    if (!signature || !verifyCalWebhook(rawBody, signature, CAL_WEBHOOK_SECRET)) {
      logger.warn('[CalWebhook] Invalid signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  const { triggerEvent, payload } = req.body as CalWebhookPayload;

  try {
    const ecyproId = payload.metadata?.ecyproBookingId;
    const startTime = payload.startTime ? new Date(payload.startTime) : null;

    switch (triggerEvent) {
      case 'BOOKING_CREATED':
        if (ecyproId && startTime) {
          await prisma.booking.update({
            where: { id: ecyproId },
            data: {
              status: 'CONFIRMED',
              scheduledAt: startTime,
            },
          });
          logger.info('[CalWebhook] Booking confirmed', { id: ecyproId });
        }
        break;

      case 'BOOKING_RESCHEDULED':
        if (ecyproId && startTime) {
          await prisma.booking.update({
            where: { id: ecyproId },
            data: { scheduledAt: startTime },
          });
          logger.info('[CalWebhook] Booking rescheduled', { id: ecyproId });
        }
        break;

      case 'BOOKING_CANCELLED':
        if (ecyproId) {
          await prisma.booking.update({
            where: { id: ecyproId },
            data: {
              status: 'CANCELLED',
              cancellationReason: payload.cancellationReason ?? 'Cancelled via Cal.com',
            },
          });
          logger.info('[CalWebhook] Booking cancelled', { id: ecyproId });
        }
        break;

      default:
        logger.info('[CalWebhook] Unhandled event', { triggerEvent });
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error('[CalWebhook] DB error', { message: (err as Error).message });
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
