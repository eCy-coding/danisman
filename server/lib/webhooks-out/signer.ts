/**
 * P23 BE Track 2 / Aşama 2 — Outbound webhook HMAC signer + verifier.
 *
 * Wire format (matches the existing inbound `verify-webhook` convention so a
 * partner integrating both directions only needs one verification function):
 *
 *   X-Webhook-Timestamp: 1715800000          (UNIX seconds)
 *   X-Webhook-Id:        deliv_abc123        (delivery row id; idempotency hint)
 *   X-Webhook-Event:     user.created
 *   X-Webhook-Signature: sha256=<hex>
 *
 * Signature input: `${timestamp}.${body}` — timestamp prefix prevents
 * naive replay where an attacker captures a body + sig pair and resends.
 * Receivers should reject deliveries older than ~5 minutes.
 *
 * No external dep — Node's `crypto.createHmac` covers SHA-256.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SignOptions {
  /** Shared secret per subscription. Never log it. */
  secret: string;
  /** Stringified payload that goes in the HTTP body verbatim. */
  body: string;
  /** UNIX ms or s; converted to seconds in headers for partner ergonomics. */
  timestamp?: number;
  /** Delivery row id (helps partners dedupe replays). */
  deliveryId: string;
  /** Event type, e.g. 'user.created'. */
  eventType: string;
}

export interface SignedHeaders extends Record<string, string> {
  'X-Webhook-Timestamp': string;
  'X-Webhook-Id': string;
  'X-Webhook-Event': string;
  'X-Webhook-Signature': string;
  'Content-Type': string;
}

export function sign(opts: SignOptions): SignedHeaders {
  const ts = Math.floor((opts.timestamp ?? Date.now()) / (opts.timestamp && opts.timestamp < 1e12 ? 1 : 1000));
  const sig = createHmac('sha256', opts.secret).update(`${ts}.${opts.body}`).digest('hex');
  return {
    'X-Webhook-Timestamp': String(ts),
    'X-Webhook-Id': opts.deliveryId,
    'X-Webhook-Event': opts.eventType,
    'X-Webhook-Signature': `sha256=${sig}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Constant-time verification — used by our own inbound endpoints
 * if/when a partner sends signed callbacks back.
 */
export function verify(opts: {
  secret: string;
  body: string;
  timestamp: string | number;
  signature: string;
  /** Max age in seconds. Default 300 (5 min). */
  maxAgeSec?: number;
}): { ok: boolean; reason?: string } {
  const ts = typeof opts.timestamp === 'string' ? Number.parseInt(opts.timestamp, 10) : opts.timestamp;
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad_timestamp' };
  const now = Math.floor(Date.now() / 1000);
  const maxAge = opts.maxAgeSec ?? 300;
  if (Math.abs(now - ts) > maxAge) return { ok: false, reason: 'stale' };

  const provided = opts.signature.startsWith('sha256=') ? opts.signature.slice(7) : opts.signature;
  const expected = createHmac('sha256', opts.secret).update(`${ts}.${opts.body}`).digest('hex');

  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return { ok: false, reason: 'sig_length' };
  return { ok: timingSafeEqual(a, b), reason: undefined };
}
