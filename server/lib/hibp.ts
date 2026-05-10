/**
 * P35-T08: Have I Been Pwned — k-Anonymity Password Breach Check
 *
 * Uses the HIBP Pwned Passwords v3 API with k-anonymity model:
 *   1. SHA-1 hash the password.
 *   2. Send only the first 5 hex chars (prefix) to the API.
 *   3. API returns all hashes matching that prefix (without seeing full hash).
 *   4. Check locally if the full hash suffix is in the returned list.
 *
 * Privacy: The full password hash never leaves the server. HIBP only sees
 *   a 5-character prefix — mathematically insufficient to recover the password.
 *
 * Rate limit: HIBP allows ~1 req/sec sustained. We don't cache because
 *   this is a one-time check on registration, not a hot path.
 *
 * Usage:
 *   const { breached, count } = await checkPasswordBreached('user_password');
 *   if (breached) { throw HttpError(422, 'PASSWORD_BREACHED', ...) }
 */

import crypto from 'crypto';
import { logger } from '../config/logger';

const HIBP_URL = 'https://api.pwnedpasswords.com/range';
const HIBP_TIMEOUT_MS = 5_000;

interface BreachResult {
  breached: boolean;
  count: number;
}

/**
 * Check if a password has been found in known data breaches.
 * Returns { breached: false, count: 0 } on API error (fail-open for UX).
 */
export async function checkPasswordBreached(password: string): Promise<BreachResult> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

    const res = await fetch(`${HIBP_URL}/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Reduces timing attacks via response size
        'User-Agent': 'EcyPro-Auth/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      logger.warn('[HIBP] Non-200 response', { status: res.status });
      return { breached: false, count: 0 };
    }

    const text = await res.text();
    const lines = text.split('\r\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':') as [string, string];
      if (hashSuffix?.toUpperCase() === suffix) {
        const count = parseInt(countStr ?? '0', 10);
        return { breached: count > 0, count };
      }
    }

    return { breached: false, count: 0 };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      logger.warn('[HIBP] Timeout — skipping breach check');
    } else {
      logger.warn('[HIBP] API error — skipping breach check', {
        message: (err as Error).message,
      });
    }
    // Fail-open: don't block registration if HIBP is down
    return { breached: false, count: 0 };
  }
}
