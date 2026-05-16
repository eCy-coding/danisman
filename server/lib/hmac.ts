/**
 * P37-T05: HMAC-based Secure Token for Booking Management
 *
 * Used to generate tamper-proof, time-limited URLs for:
 *   - Reschedule/cancel without login (email link)
 *   - Webhook signature verification (Cal.com)
 *
 * Token format: `{bookingId}:{expiry}:{hmac}`
 *   - bookingId: UUID
 *   - expiry: Unix timestamp (seconds)
 *   - hmac: HMAC-SHA256(bookingId + ':' + expiry, secret)
 *
 * ENV: BOOKING_HMAC_SECRET (min 32 chars recommended)
 */

import crypto from 'crypto';

const _HMAC_SECRET = process.env.BOOKING_HMAC_SECRET ?? process.env.JWT_SECRET;
if (!_HMAC_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: BOOKING_HMAC_SECRET (or JWT_SECRET) env var is required in production');
  }
  console.warn('[hmac] WARNING: BOOKING_HMAC_SECRET not set — using insecure dev fallback');
}
const SECRET = _HMAC_SECRET ?? 'dev-only-insecure-hmac-fallback-do-not-use-in-prod';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generate a HMAC-signed manage token for a booking.
 * @param bookingId  UUID of the booking
 * @param ttl        Token lifetime in seconds (default: 7 days)
 */
export function generateManageToken(bookingId: string, ttl = DEFAULT_TTL_SECONDS): string {
  const expiry = Math.floor(Date.now() / 1000) + ttl;
  const payload = `${bookingId}:${expiry}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

interface TokenVerifyResult {
  valid: boolean;
  bookingId?: string;
  reason?: 'INVALID_FORMAT' | 'EXPIRED' | 'BAD_SIGNATURE';
}

/**
 * Verify a manage token.
 * Constant-time comparison prevents timing attacks.
 */
export function verifyManageToken(rawToken: string): TokenVerifyResult {
  try {
    const decoded = Buffer.from(rawToken, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return { valid: false, reason: 'INVALID_FORMAT' };

    const [bookingId, expiryStr, sig] = parts as [string, string, string];
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() / 1000 > expiry) {
      return { valid: false, reason: 'EXPIRED' };
    }

    const payload = `${bookingId}:${expiryStr}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, reason: 'BAD_SIGNATURE' };
    }

    return { valid: true, bookingId };
  } catch {
    return { valid: false, reason: 'INVALID_FORMAT' };
  }
}

/**
 * Generate a manage URL for a booking.
 * @param bookingId  UUID
 * @param baseUrl    e.g. "https://ecypro.com" (falls back to VITE_PROD_URL env)
 */
export function bookingManageUrl(bookingId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.VITE_PROD_URL ?? 'https://ecypro.com';
  const token = generateManageToken(bookingId);
  return `${base}/booking/manage?id=${bookingId}&token=${token}`;
}

/**
 * Verify a Cal.com webhook HMAC-SHA256 signature.
 * Cal.com signs with HMAC-SHA256(raw body, webhook secret).
 *
 * @deprecated P15-BE Aşama 6: prefer `verifyWebhook('calcom')` from
 * server/middleware/verify-webhook.ts — that path uses the captured
 * raw request bytes instead of `JSON.stringify(req.body)`, which is
 * lossy. Kept here only for tests that compare against historical
 * signature output.
 */
export function verifyCalWebhook(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
  } catch {
    return false;
  }
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}
