/**
 * P16 BE Track 2 / Aşama 2 — Tier-based rate limiter.
 *
 * Per-IP rate limiting (existing `createRateLimiter`) treats all clients as
 * anonymous. That under-rate-limits attackers behind a single IP burning
 * an authenticated session AND over-rate-limits real authenticated users
 * coming through a corporate NAT (one IP, many users).
 *
 * This middleware identifies the caller as one of:
 *   - `anonymous`  (no JWT)         → 60 req / 15 min
 *   - `auth`       (valid user)     → 300 req / 15 min
 *   - `admin`      (ADMIN role)     → 1000 req / 15 min
 *   - `api-key`    (future)         → per-key custom limits
 *
 * Identity key:
 *   - Authenticated → `user:<id>` (stable across IPs, doesn't punish NAT)
 *   - Anonymous     → `ip:<remoteAddress>`
 *
 * Headers per RFC 6585 + draft-ietf-httpapi-ratelimit-headers:
 *   X-RateLimit-Limit:      tier's bucket size
 *   X-RateLimit-Remaining:  bucket - count
 *   X-RateLimit-Reset:      seconds (NOT epoch) until window resets — matches
 *                           the legacy createRateLimiter contract; tests
 *                           assert this.
 *   Retry-After:            present only on 429
 *
 * Storage backend:
 *   - Reuses the project's Redis adapter for atomicity (Lua-style EVAL)
 *     when available, falls back to in-process Map. The legacy
 *     `createRateLimiter` already implements this dance; we delegate to a
 *     shared core to avoid duplicating the Lua script.
 */

import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { isHealthProbe } from './health-probe';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RateLimitTier = 'anonymous' | 'auth' | 'admin' | 'api-key';

export interface TierBudget {
  windowMs: number;
  maxRequests: number;
}

export interface TierRateLimitOptions {
  /** Optional per-route override map; falls back to defaults. */
  budgets?: Partial<Record<RateLimitTier, TierBudget>>;
  /** Per-route bucket name (defaults to `req.baseUrl + req.path`). */
  bucket?: string;
  /** Override the tier classifier (auth middleware order edge cases). */
  classify?: (req: Request) => RateLimitTier;
  /** Override the identity extractor. */
  identify?: (req: Request, tier: RateLimitTier) => string;
  /**
   * Return true to bypass the limiter for a given request.
   * P99 follow-up — platform health probes (Render, BetterStack) must NOT
   * consume the anonymous tier budget; doing so triggered 429 → instance
   * recover loops visible in Render Events every 6-7 minutes.
   */
  skip?: (req: Request) => boolean;
}

interface AuthLikeRequest extends Request {
  user?: { id?: string; role?: string };
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_BUDGETS: Record<RateLimitTier, TierBudget> = {
  anonymous: {
    windowMs: 15 * 60_000,
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_ANON_MAX ?? '', 10) || 60,
  },
  auth: {
    windowMs: 15 * 60_000,
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '', 10) || 300,
  },
  admin: {
    windowMs: 15 * 60_000,
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_ADMIN_MAX ?? '', 10) || 1000,
  },
  'api-key': {
    windowMs: 15 * 60_000,
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_APIKEY_MAX ?? '', 10) || 600,
  },
};

// ── Fallback in-memory store (when Redis is down) ─────────────────────────────

interface FallbackEntry {
  count: number;
  resetAt: number;
}
const fallback = new Map<string, FallbackEntry>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of fallback) if (now > v.resetAt) fallback.delete(k);
}, 60_000).unref?.();

// Lua script — identical contract to `createRateLimiter` so admins can move
// budgets between the two without semantic drift. Returns [count, pttlMs].
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

async function incrementAtomic(
  key: string,
  windowMs: number,
): Promise<{ count: number; resetSeconds: number }> {
  try {
    const usable =
      redis.status === 'ready' || redis.status === 'connecting' || redis.status === 'reconnecting';
    if (!usable) throw new Error('Redis not ready');
    const result = (await redis.eval(LUA_SCRIPT, 1, key, windowMs)) as [number, number];
    return { count: result[0], resetSeconds: Math.ceil(result[1] / 1000) };
  } catch (_err) {
    const now = Date.now();
    let entry = fallback.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      fallback.set(key, entry);
    }
    entry.count++;
    return {
      count: entry.count,
      resetSeconds: Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
}

// ── Classify + Identify ──────────────────────────────────────────────────────

export function classifyTier(req: AuthLikeRequest): RateLimitTier {
  if (req.headers['x-api-key']) return 'api-key';
  const role = req.user?.role;
  if (role === 'ADMIN') return 'admin';
  if (req.user?.id) return 'auth';
  return 'anonymous';
}

export function defaultIdentify(req: AuthLikeRequest, tier: RateLimitTier): string {
  if (tier === 'api-key') {
    const k = req.headers['x-api-key'];
    return `apikey:${Array.isArray(k) ? k[0] : k}`;
  }
  if (req.user?.id) return `user:${req.user.id}`;
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

// ── Middleware factory ────────────────────────────────────────────────────────

export function tierRateLimit(options: TierRateLimitOptions = {}) {
  const budgets: Record<RateLimitTier, TierBudget> = {
    anonymous: { ...DEFAULT_BUDGETS.anonymous, ...options.budgets?.anonymous },
    auth: { ...DEFAULT_BUDGETS.auth, ...options.budgets?.auth },
    admin: { ...DEFAULT_BUDGETS.admin, ...options.budgets?.admin },
    'api-key': { ...DEFAULT_BUDGETS['api-key'], ...options.budgets?.['api-key'] },
  };

  const skip = options.skip;

  return async function tierRateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (skip && skip(req)) {
      next();
      return;
    }
    const authReq = req as AuthLikeRequest;
    const tier = options.classify ? options.classify(req) : classifyTier(authReq);
    const budget = budgets[tier];
    const bucket = options.bucket ?? req.baseUrl + req.path;
    const identity = options.identify
      ? options.identify(req, tier)
      : defaultIdentify(authReq, tier);
    const key = `ratelimit:tier:${tier}:${bucket}:${identity}`;

    const { count, resetSeconds } = await incrementAtomic(key, budget.windowMs);

    const remaining = Math.max(0, budget.maxRequests - count);
    res.setHeader('X-RateLimit-Limit', String(budget.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));
    res.setHeader('X-RateLimit-Tier', tier);

    if (count > budget.maxRequests) {
      res.setHeader('Retry-After', String(resetSeconds));
      logger.warn('[ratelimit/tier] throttled', { tier, identity, count, bucket });
      res.status(429).json({
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests for tier "${tier}". Please wait ${resetSeconds}s.`,
        retryAfter: resetSeconds,
        tier,
      });
      return;
    }

    next();
  };
}

// ── Default exported middleware (use as global limiter) ──────────────────────

/**
 * Drop-in global limiter — mount AFTER `authenticate` (so `req.user` is set)
 * to get accurate tier classification. Mounting BEFORE auth degrades all
 * requests to the `anonymous` tier (still works, just stricter).
 *
 * P99 follow-up — the global instance MUST skip platform health probes;
 * otherwise Render's liveness check counts against the anonymous tier
 * (60/15min default) and the LB recovers the instance every ~6min.
 */
export const tierRateLimiter = tierRateLimit({ skip: isHealthProbe });

// ── Testing hooks ─────────────────────────────────────────────────────────────

export const _tierTesting = {
  reset(): void {
    fallback.clear();
  },
  budgets: DEFAULT_BUDGETS,
};
