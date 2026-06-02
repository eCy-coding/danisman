/**
 * P44-T04: BetterStack Heartbeat endpoint
 *
 * Receives a signed POST from a cron scheduler (e.g. GitHub Actions, Render
 * cron) to confirm the server is alive, then forwards a ping to the
 * BetterStack heartbeat URL so the uptime monitor stays green.
 *
 * Auth: HMAC-SHA256 signature in `X-Heartbeat-Signature` header.
 *   expected = "sha256=" + hex(hmac-sha256(BETTERSTACK_HEARTBEAT_SECRET, body))
 *
 * Setup (operator):
 *   1. Set BETTERSTACK_HEARTBEAT_SECRET in Render env vars.
 *   2. Set BETTERSTACK_HEARTBEAT_URL  in Render env vars (BetterStack → Heartbeat → copy URL).
 *   3. Schedule a POST to /api/heartbeat/cron every N minutes with the header set.
 */

import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '../config/logger';

const router = Router();

/**
 * Constant-time HMAC-SHA256 signature verification.
 * Returns false immediately if lengths differ (prevents oracle attacks).
 */
function verifySignature(secret: string, bodyStr: string, signature: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(bodyStr, 'utf8').digest('hex');
  const bufExpected = Buffer.from(expected, 'utf8');
  const bufReceived = Buffer.from(signature, 'utf8');
  if (bufExpected.length !== bufReceived.length) return false;
  try {
    return timingSafeEqual(bufExpected, bufReceived);
  } catch {
    return false;
  }
}

/** POST /cron — signed liveness ping from cron scheduler */
router.post('/cron', (req: Request, res: Response) => {
  const secret = process.env.BETTERSTACK_HEARTBEAT_SECRET;
  if (!secret) {
    return res.status(503).json({ status: 'not_configured' });
  }

  const signature = req.headers['x-heartbeat-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ status: 'unauthorized' });
  }

  const bodyStr = JSON.stringify(req.body || {});
  if (!verifySignature(secret, bodyStr, signature)) {
    return res.status(401).json({ status: 'unauthorized' });
  }

  logger.info('[heartbeat] Cron heartbeat received OK');

  const heartbeatUrl = process.env.BETTERSTACK_HEARTBEAT_URL;
  if (heartbeatUrl) {
    void fetch(heartbeatUrl).catch((err: unknown) =>
      logger.warn('[heartbeat] BetterStack ping failed', { err }),
    );
  }

  return res.status(200).json({ status: 'ok', ts: process.uptime().toFixed(3) + 's' });
});

export default router;
