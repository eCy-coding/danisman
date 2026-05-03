/**
 * EcyPro — Rate Limiting Middleware
 *
 * Production-grade rate limiting with Redis for horizontal scalability,
 * falling back to in-memory tracking if Redis is unavailable.
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

// ─── Types ───────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  message?: string;       // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key extractor
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
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ratelimit:${keyGenerator(req)}:${req.baseUrl || req.path}`;
    const now = Date.now();
    let currentCount = 1;
    let resetSeconds = Math.ceil(windowMs / 1000);

    try {
      // E1: accept a brief reconnecting window to avoid Redis→memory thrashing
      // during transient hiccups. Anything else (end/close/wait) falls back below.
      const usable = redis.status === 'ready' || redis.status === 'connecting' || redis.status === 'reconnecting';
      if (usable) {
        // Use Redis
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();
        
        if (results && results[0] && results[1]) {
          currentCount = results[0][1] as number;
          const pttl = results[1][1] as number;
          
          if (currentCount === 1 || pttl === -1) {
            await redis.pexpire(key, windowMs);
            resetSeconds = Math.ceil(windowMs / 1000);
          } else {
            resetSeconds = Math.ceil(pttl / 1000);
          }
        }
      } else {
        throw new Error('Redis not ready, falling back to memory.');
      }
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

/** General API: 100 requests per 15 minutes */
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

/** Auth endpoints: 10 requests per 15 minutes (brute-force protection) */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please wait 15 minutes.',
});

/** Contact form: 5 per hour */
export const contactLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many contact form submissions. Please try again later.',
});

/** SSE connections: 3 per minute */
export const sseLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: 'Too many SSE connection attempts.',
});
