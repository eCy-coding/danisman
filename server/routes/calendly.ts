/**
 * Track B — Calendly webhook receiver.
 *
 *   POST /api/v1/calendly
 *
 * Calendly signs every webhook with HMAC-SHA256 over the raw request body
 * using the subscription's signing key, returned in the `Calendly-Webhook-
 * Signature` header as `t=<unix-seconds>,v1=<hex>`. We verify with
 * `timingSafeEqual` before doing anything with the payload.
 *
 * Behavior:
 *   - `invitee.created`   → PostHog `discovery_booked` + Telegram heads-up.
 *   - `invitee.canceled`  → PostHog `discovery_canceled` + Telegram heads-up.
 *   - Any other event     → 204 No Content (we accept, but don't act).
 *
 * If CALENDLY_WEBHOOK_SIGNING_KEY is unset, we accept any payload in dev
 * (handy for local curl) but return 503 in production.
 */

import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import express from 'express';
import { logger } from '../config/logger';
import { notify } from '../lib/telegram';
import { capture as posthogCapture } from '../lib/posthog-server';

const router = Router();
const SIGNING_KEY = process.env.CALENDLY_WEBHOOK_SIGNING_KEY ?? '';
const MAX_SKEW_SEC = 5 * 60;

interface CalendlyInvitee {
  name?: string;
  email?: string;
  timezone?: string;
}
interface CalendlyEventResource {
  start_time?: string;
  end_time?: string;
  uri?: string;
}
interface CalendlyPayload {
  event?: 'invitee.created' | 'invitee.canceled' | string;
  payload?: {
    invitee?: CalendlyInvitee;
    event?: CalendlyEventResource;
    scheduled_event?: CalendlyEventResource;
    tracking?: Record<string, string>;
  };
}

function parseSignatureHeader(raw: string | undefined): { t?: number; v1?: string } {
  if (!raw) return {};
  const parts = raw.split(',').map((p) => p.trim());
  const out: { t?: number; v1?: string } = {};
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') out.t = Number(v);
    if (k === 'v1') out.v1 = v;
  }
  return out;
}

function verifySignature(raw: Buffer, header: string | undefined): boolean {
  if (!SIGNING_KEY) return process.env.NODE_ENV !== 'production';
  const { t, v1 } = parseSignatureHeader(header);
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > MAX_SKEW_SEC) return false;
  const signedPayload = `${t}.${raw.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', SIGNING_KEY).update(signedPayload).digest('hex');
  if (expected.length !== v1.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}

router.post(
  '/',
  // `express.raw` so we can recompute HMAC over the exact bytes Calendly
  // signed. The router-level JSON parser would re-encode the body.
  express.raw({ type: 'application/json', limit: '64kb' }),
  async (req: Request, res: Response): Promise<void> => {
    const raw = req.body as Buffer;
    const headerName = 'calendly-webhook-signature';
    const sigHeader = req.headers[headerName] as string | undefined;

    if (!SIGNING_KEY && process.env.NODE_ENV === 'production') {
      logger.error('[calendly] CALENDLY_WEBHOOK_SIGNING_KEY unset in production');
      res.status(503).json({ ok: false, code: 'SIGNING_KEY_MISSING' });
      return;
    }

    if (!verifySignature(raw, sigHeader)) {
      logger.warn('[calendly] signature verification failed', { ip: req.ip });
      res.status(401).json({ ok: false, code: 'INVALID_SIGNATURE' });
      return;
    }

    let body: CalendlyPayload;
    try {
      body = JSON.parse(raw.toString('utf8')) as CalendlyPayload;
    } catch {
      res.status(400).json({ ok: false, code: 'INVALID_JSON' });
      return;
    }

    const event = body.event ?? '';
    const invitee = body.payload?.invitee ?? {};
    const scheduled = body.payload?.scheduled_event ?? body.payload?.event ?? {};
    const distinctId = (invitee.email ?? 'unknown').toLowerCase();

    if (event === 'invitee.created') {
      void posthogCapture({
        event: 'discovery_booked',
        distinctId,
        properties: {
          name: invitee.name ?? null,
          timezone: invitee.timezone ?? null,
          startTime: scheduled.start_time ?? null,
          source: body.payload?.tracking?.utm_source ?? null,
        },
      });

      // Best-effort founder ping; never block on Telegram outages.
      notify('info', '📅 Yeni Discovery Call rezervasyonu', {
        İsim: invitee.name ?? '-',
        Email: invitee.email ?? '-',
        Başlangıç: scheduled.start_time ?? '-',
        Timezone: invitee.timezone ?? '-',
      }).catch((err) => logger.warn('[calendly] telegram notify failed', { err: String(err) }));
    } else if (event === 'invitee.canceled') {
      void posthogCapture({
        event: 'discovery_canceled',
        distinctId,
        properties: { startTime: scheduled.start_time ?? null },
      });
      notify('warn', '⚠️ Discovery Call iptal edildi', {
        İsim: invitee.name ?? '-',
        Email: invitee.email ?? '-',
        Başlangıç: scheduled.start_time ?? '-',
      }).catch((err) => logger.warn('[calendly] telegram notify failed', { err: String(err) }));
    } else {
      logger.info('[calendly] unhandled event', { event });
      res.status(204).end();
      return;
    }

    res.json({ ok: true, received: true });
  },
);

export default router;
