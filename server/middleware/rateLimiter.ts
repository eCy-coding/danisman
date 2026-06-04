/**
 * eCyPro — Rate Limiting Middleware
 *
 * Production-grade rate limiting with Redis for horizontal scalability,
 * falling back to in-memory tracking if Redis is unavailable.
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { isRateLimitExempt } from './health-probe';

// ─── Types ───────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key extractor
  skip?: (req: Request) => boolean; // P99 — return true to bypass limiter (e.g. health probes)
}

// ─── In-Memory Store (Fallback) ──────────────────────────

const fallbackStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackStore) {
    if (now > entry.resetAt) {
      fallbackStore.delete(key);
    }
  }
}, 60_000);

// ─── Default Key Generator ──────────────────────────────
// R1 (Phase 19): since `app.set('trust proxy', 1)` is active in server/index.ts,
// Express now produces the correct client IP in `req.ip` regardless of the
// proxy chain. A manual X-Forwarded-For parse (as before) is both unnecessary
// and spoofable: attackers can inject XFF directly when no trusted proxy is
// in front. We therefore defer entirely to Express's own resolution.
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// ─── Rate Limiter Factory ────────────────────────────────

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = defaultKeyGenerator,
    skip,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // P99 — health probes / explicit bypass paths must not consume the budget.
    if (skip && skip(req)) {
      next();
      return;
    }
    const key = `ratelimit:${keyGenerator(req)}:${req.baseUrl || req.path}`;
    const now = Date.now();
    let currentCount = 1;
    let resetSeconds = Math.ceil(windowMs / 1000);

    try {
      /**
       * P35-T07: Lua atomic rate limiter — true atomicity via single EVAL call.
       *
       * Problem with pipeline: INCR + PTTL are two separate round-trips.
       * Between them, a concurrent request can read stale PTTL (-1) and
       * incorrectly reset the window. Under high concurrency this allows
       * burst traffic to bypass limits.
       *
       * Solution: Single Lua script executed atomically in Redis.
       * Redis Lua scripts are single-threaded — no interleaving possible.
       *
       * Script logic (Lua):
       *   1. GET current count (or 0 if missing)
       *   2. If count == 0: SET key 1 PX windowMs → new window started
       *   3. Else: INCR key (count++) → existing window
       *   4. If PTTL == -1 (key exists but no expiry): PEXPIRE key windowMs
       *   5. Return {count, pttl} as a two-element array
       *
       * Complexity: O(1) — single atomic operation
       * Latency: one RTT instead of two (pipeline → EVAL)
       */
      const LUA_SCRIPT = `
        local key = KEYS[1]
        local window_ms = tonumber(ARGV[1])

        local count = tonumber(redis.call('GET', key) or '0')
        if count == 0 then
          redis.call('SET', key, 1, 'PX', window_ms)
          return {1, window_ms}
        end

        count = tonumber(redis.call('INCR', key))
        local pttl = tonumber(redis.call('PTTL', key))

        if pttl == nil or pttl == -1 then
          redis.call('PEXPIRE', key, window_ms)
          pttl = window_ms
        end

        return {count, pttl}
      `;

      const usable =
        redis.status === 'ready' ||
        redis.status === 'connecting' ||
        redis.status === 'reconnecting';
      if (!usable) throw new Error('Redis not ready');

      const result = (await redis.eval(LUA_SCRIPT, 1, key, windowMs)) as [number, number];
      currentCount = result[0];
      const pttlMs = result[1];
      resetSeconds = Math.ceil(pttlMs / 1000);
    } catch (_err) {
      // Fallback to memory
      let entry = fallbackStore.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        fallbackStore.set(key, entry);
      }
      entry.count++;
      currentCount = entry.count;
      resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    }

    // Set rate limit headers (RFC 6585)
    const remaining = Math.max(0, maxRequests - currentCount);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (currentCount > maxRequests) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.status(429).json({
        status: 'error',
        message,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}

// ─── Pre-configured Limiters ─────────────────────────────

/**
 * General API: 100 requests per 15 minutes.
 * BE-5: Window/max can be overridden via `RATE_LIMIT_WINDOW_MS` /
 * `RATE_LIMIT_MAX` env vars without touching code.
 */
export const generalLimiter = createRateLimiter({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '', 10) || 15 * 60 * 1000,
  maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX ?? '', 10) || 100,
  // P99 follow-up — health probes are platform-issued and idempotent;
  // counting them against the per-IP API budget caused self-inflicted 429s
  // on Render (visible as "Instance failed: HTTP health check failed with
  // status code 429" in Events, every 6-7min). The previous skip relied on
  // `req.path` equality, but `app.use('/api', limiter)` strips `/api` from
  // `req.path` before the middleware sees it — only the originalUrl branch
  // ever fired, and it broke on any query string. We now delegate to
  // `isHealthProbe`, which normalizes the path + accepts Render's probe
  // User-Agent (`Go-http-client/*`).
  // Track 1 launch — also exempt third-party webhook ingress (Calendly).
  skip: isRateLimitExempt,
});

/**
 * BE-5: Auth endpoints — 5 requests per 15 minutes (brute-force protection).
 * Tightened from 10/15min per P3 backend hardening: login/register/refresh
 * are the highest-value targets and 5 attempts/15min still allows a real
 * user 4 typo retries while crushing credential stuffing.
 *
 * P44-T06: Window/max are env-overrideable (`AUTH_RATE_LIMIT_*`) so local
 * dev can relax the cap while PROD keeps the strict 5/15min default. The
 * production .env never sets these, so prod stays at 5/15min by default.
 */
export const authLimiter = createRateLimiter({
  windowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '', 10) || 15 * 60 * 1000,
  maxRequests: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '', 10) || 5,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
});

/**
 * BE-5: Contact form — 3 per hour per IP.
 * Legacy newsletter subscribe + NPS feedback + analytics /contact route
 * still rely on this. The /api/v1/contact route uses the stricter
 * `contactStrictLimiter` (5 per 10 min) to match the launch KVKK abuse
 * brief without regressing the older flows.
 */
export const contactLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: 'Too many contact form submissions. Please try again later.',
});

/**
 * Track 1 — `/api/v1/contact` launch limiter.
 *
 * 5 req / 10 min / IP. Tighter window than `contactLimiter` so a
 * legitimate user can correct a typo + retry quickly, but a bot loop is
 * killed within seconds. The KVKK abuse brief calls for sub-quarter-hour
 * lockouts on identity-bearing endpoints.
 */
export const contactStrictLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  message: 'Çok sık deneme. Lütfen birkaç dakika sonra tekrar deneyin.',
});

/**
 * Track 1 — `/api/v1/quick-check-submit` limiter.
 *
 * 3 req / hour / IP. Quick-Check is a one-time inbound assessment; three
 * attempts cover form refresh + double-submit while stopping enumeration.
 */
export const quickCheckLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: 'Quick-Check için saatlik gönderim limitine ulaşıldı.',
});

/**
 * SSE connections: 3 per minute.
 * P44-T07: env-overrideable so local dev (admin reconnect storm during hot
 * reload) doesn't lock itself out for a full minute every page navigation.
 * Prod keeps the strict 3/min default by leaving the env vars unset.
 */
export const sseLimiter = createRateLimiter({
  windowMs: Number.parseInt(process.env.SSE_RATE_LIMIT_WINDOW_MS ?? '', 10) || 60 * 1000,
  maxRequests: Number.parseInt(process.env.SSE_RATE_LIMIT_MAX ?? '', 10) || 3,
  message: 'Too many SSE connection attempts.',
});

/**
 * NPS Feedback submission: 3 per 24h per IP
 * Rationale: feedback is a 1-time action post-meeting.
 * 3 allows for accidental double-clicks + re-submission attempts.
 * Key: IP-based (not user-based — unauthenticated endpoint)
 */
export const feedbackLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 3,
  message: 'Feedback submission limit reached. Please try again tomorrow.',
});

/**
 * Public booking creation: 10 per day per IP
 * Rationale: prevents spam bookings that create guest users.
 * 10 is generous enough for legitimate retries, tight enough to block bots.
 */
export const publicBookingLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 10,
  message: 'Too many booking attempts. Please try again tomorrow or contact us directly.',
});

/**
 * Booking slots fetch: 60 per hour per IP (calendar browsing)
 * Rationale: users browse multiple months → need generous limit.
 * Cal.com free tier: 100 req/min → our 60/hour is safe.
 */
export const slotsFetchLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 60,
  message: 'Too many calendar requests. Please wait before browsing more dates.',
});

/**
 * Discovery form: 5 req / hour / IP.
 * High-intent action — tighter than contact to prevent CRM spam.
 */
export const discoveryLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message:
    'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin veya WhatsApp ile iletişime geçin.',
});

// P26-BE Aşama 3 — test-only helper.
// When Redis is mocked out (status !== 'ready'), the limiter falls back to
// the module-level `fallbackStore` Map which leaks state across tests under
// the same module instance. Suite-level vi.mock + multiple requests would
// trip the contactLimiter (3/h) after just three calls. Exposing a reset
// hook keeps the test surface minimal without baking test-only branches
// into the hot path.
export const __resetFallbackStoreForTests = (): void => {
  fallbackStore.clear();
};
