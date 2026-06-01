/**
 * P40-T04: UptimeRobot Webhook → Telegram Alert
 *
 * UptimeRobot (free tier) monitors ecypro.com / api.ecypro.com and POSTs
 * to this endpoint on state transitions (DOWN / UP / SSL warning).
 * Endpoint forwards to Telegram via existing sendTelegramAlert lib.
 *
 * Auth: `?secret=<UPTIMEROBOT_WEBHOOK_SECRET>` query param (UptimeRobot
 * free tier does not sign payloads; secret is the only auth surface).
 * Constant-time comparison (timingSafeEqual) to prevent timing leak.
 *
 * Setup (operator):
 *   1. uptimerobot.com → Monitor → Alert Contacts → Web-Hook
 *   2. POST URL: https://ecypro.com/api/webhooks/uptime?secret=<SECRET>
 *   3. POST value (raw JSON):
 *      {
 *        "monitorURL": "*monitorURL*",
 *        "monitorFriendlyName": "*monitorFriendlyName*",
 *        "alertType": "*alertType*",
 *        "alertTypeFriendlyName": "*alertTypeFriendlyName*",
 *        "alertDetails": "*alertDetails*",
 *        "alertDuration": "*alertDuration*",
 *        "monitorID": "*monitorID*"
 *      }
 *   4. Send POST → check Telegram channel
 *
 * Test (verify locally):
 *   curl -X POST 'https://ecypro.com/api/webhooks/uptime?secret=$SECRET' \
 *     -H 'Content-Type: application/json' \
 *     -d '{"monitorFriendlyName":"Test","alertTypeFriendlyName":"Down","alertDetails":"timeout"}'
 *
 * Phase 40 Tier 1 — Observability blocker fix.
 */

import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { logger } from '../config/logger';
import { sendTelegramAlert } from '../lib/telegram-alert';

const router = Router();

interface UptimeRobotPayload {
  monitorURL?: string;
  monitorFriendlyName?: string;
  alertType?: string | number;
  alertTypeFriendlyName?: string;
  alertDetails?: string;
  alertDuration?: string | number;
  monitorID?: string | number;
  sslExpiryDate?: string;
  sslExpiryDaysLeft?: string | number;
}

/**
 * Constant-time string comparison. Prevents timing side-channel.
 * Returns false immediately if lengths differ (length-safe comparison).
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Map UptimeRobot alertType to severity.
 * alertType "1" or 1 = DOWN  → error
 * alertType "2" or 2 = UP    → warn (recovery; informational)
 * alertType "3" or 3 = SSL   → warn (cert expiry)
 */
function severityFor(alertType: string | number | undefined): 'error' | 'warn' {
  const n = typeof alertType === 'string' ? Number(alertType) : alertType;
  if (n === 1) return 'error';
  return 'warn';
}

router.post('/uptime', async (req: Request, res: Response) => {
  const secret = process.env.UPTIMEROBOT_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('[uptime-webhook] UPTIMEROBOT_WEBHOOK_SECRET unset; rejecting');
    return res.status(503).json({ ok: false, error: 'webhook_not_configured' });
  }

  const providedSecret = String(req.query.secret ?? '');
  if (!safeEqual(providedSecret, secret)) {
    logger.warn('[uptime-webhook] invalid secret', {
      providedLen: providedSecret.length,
      expectedLen: secret.length,
      ip: req.ip,
    });
    return res.status(401).json({ ok: false, error: 'invalid_secret' });
  }

  const payload = (req.body ?? {}) as UptimeRobotPayload;
  const monitorName =
    payload.monitorFriendlyName?.toString().trim() ||
    payload.monitorURL?.toString().trim() ||
    `monitor#${payload.monitorID ?? 'unknown'}`;
  const alertName =
    payload.alertTypeFriendlyName?.toString().trim() ||
    `alertType=${payload.alertType ?? 'unknown'}`;
  const details = payload.alertDetails?.toString().slice(0, 400) ?? '';
  const duration = payload.alertDuration?.toString() ?? '';
  const severity = severityFor(payload.alertType);

  const summary = `${monitorName} → ${alertName}${duration ? ` (${duration}s)` : ''}`;
  const context: Record<string, unknown> = {
    source: 'uptimerobot',
    monitor: monitorName,
    alertType: payload.alertType,
    monitorID: payload.monitorID,
  };
  if (details) context.details = details;
  if (payload.sslExpiryDate) context.sslExpiryDate = payload.sslExpiryDate;
  if (payload.sslExpiryDaysLeft !== undefined) {
    context.sslExpiryDaysLeft = payload.sslExpiryDaysLeft;
  }

  // Fire-and-forget to keep ack < 200ms (UptimeRobot timeout = 10s but
  // shorter is friendlier for queueing). Do NOT await before res.send.
  void sendTelegramAlert(severity, summary, context).catch((err) => {
    logger.warn('[uptime-webhook] telegram dispatch failed', { err: String(err) });
  });

  logger.info('[uptime-webhook] received', {
    monitor: monitorName,
    severity,
    alertType: payload.alertType,
  });

  return res.status(200).json({ ok: true, monitor: monitorName, severity });
});

export default router;
