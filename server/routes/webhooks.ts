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
import { logger } from '../config/logger';
import { verifyWebhook } from '../middleware/verify-webhook';
import { recordAndCheck, markProcessed, markFailed } from '../lib/webhook-idempotency';

const router = Router();

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

// P15-BE Aşama 6: HMAC verification now runs as middleware against the
// RAW request bytes (captured in server/index.ts via express.json({ verify })),
// not a re-serialised req.body — which previously corrupted key order
// and silently broke verification for valid Cal.com payloads.
router.post('/cal', verifyWebhook('calcom'), async (req: Request, res: Response): Promise<void> => {
  const { triggerEvent, payload } = req.body as CalWebhookPayload;

  // P17 BE Track 2 / Aşama 5 — persisted idempotency. Cal.com delivers
  // each event with `payload.uid` as the deterministic external ID. If
  // the upstream queue replays after a successful handler run, we short-
  // circuit with 200 OK and zero DB mutation so the booking row isn't
  // mutated twice. Missing uid degrades to "best effort" (treat as new
  // event); shouldn't happen in production.
  const externalId = payload.uid ?? `${triggerEvent}:${payload.startTime ?? Date.now()}`;
  const signature =
    typeof req.headers['x-cal-signature-256'] === 'string'
      ? (req.headers['x-cal-signature-256'] as string)
      : undefined;

  let eventId: string;
  try {
    const check = await recordAndCheck({
      source: 'calcom',
      externalId,
      signature,
      payload: req.body,
    });
    if (check.alreadyProcessed) {
      logger.info('[CalWebhook] duplicate delivery — skip', { externalId, eventId: check.eventId });
      res.json({ ok: true, replay: true });
      return;
    }
    eventId = check.eventId;
  } catch (err) {
    logger.warn('[CalWebhook] idempotency record failed — proceeding best-effort', {
      message: (err as Error).message,
    });
    eventId = '';
  }

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

    if (eventId) await markProcessed(eventId);
    res.json({ ok: true });
  } catch (err) {
    logger.error('[CalWebhook] DB error', { message: (err as Error).message });
    if (eventId) await markFailed(eventId, err as Error);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
