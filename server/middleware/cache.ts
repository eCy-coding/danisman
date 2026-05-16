/**
 * P16 BE Track 2 / Aşama 1 — Tier-aware response cache middleware.
 *
 * Wraps `GET` handlers so repeated reads short-circuit at the middleware
 * layer instead of executing the route and round-tripping to Postgres / Redis.
 *
 * Design decisions:
 *
 * 1. **Key composition** —
 *      `<METHOD>:<path>:<sortedQueryHash>:<tier>:<scopeHash>`
 *    The tier is included so an admin's cache slot does not bleed into the
 *    anonymous public slot (different visible content). `scopeHash` lets a
 *    route disambiguate by user identity (`req.user?.id`) or by a custom
 *    discriminator (e.g. accept-language).
 *
 * 2. **TTL by tier** —
 *      `public`   default 5 min (`Cache-Control: public, max-age=...`)
 *      `private`  default 1 min (`Cache-Control: private, max-age=...`)
 *      `none`     no caching (`Cache-Control: no-store, no-cache`).
 *
 *    A route can override `ttlMs`, `tier`, and `staleWhileRevalidateMs`.
 *
 * 3. **Cache-Control header** is set on every response that flows through
 *    the middleware — hit OR miss — so the browser / CDN sees a consistent
 *    contract whether or not our LRU served the response.
 *
 * 4. **Invalidation hook** — `invalidateCache(prefix)` purges any cached
 *    response under a path prefix. Mutating handlers (POST/PUT/DELETE) wire
 *    this so a freshly mutated resource doesn't serve stale reads.
 *
 * 5. **Observability** — every hit / miss is counted; admin can pull
 *    aggregated stats from `/api/admin/cache/stats`.
 */

import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { LruCache, type LruCacheStats } from '../lib/lru-cache';
import { logger } from '../config/logger';
// P18 BE Track 2 / Aşama 2 — Prometheus emission on cache hit/miss so
// the scrape can observe the response-cache effectiveness.
import { metrics } from '../observability/metrics';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CacheTier = 'public' | 'private' | 'none';

export interface CachedPayload {
  status: number;
  body: unknown;
  contentType?: string;
  /** Cached at — useful for Age header + observability. */
  storedAt: number;
}

export interface CacheOptions {
  /** TTL in ms. 0 (or `tier: 'none'`) means do not cache. */
  ttlMs?: number;
  /** Tier — drives the default Cache-Control directive. */
  tier?: CacheTier;
  /** `stale-while-revalidate` window in ms (added to public Cache-Control). */
  staleWhileRevalidateMs?: number;
  /**
   * Hook to derive a per-request scope discriminator beyond tier. For example
   * `req.headers['accept-language']` or `req.user?.id`. Returning `''` is OK.
   */
  scope?: (req: Request) => string;
  /**
   * Skip the cache entirely for this request (e.g. force-refresh header).
   * Defaults to `Cache-Control: no-cache` request header detection.
   */
  bypass?: (req: Request) => boolean;
}

interface AuthLikeRequest extends Request {
  user?: { id?: string; role?: string };
}

// ── Shared store + helpers ────────────────────────────────────────────────────

const responseStore = new LruCache<CachedPayload>(
  Number.parseInt(process.env.CACHE_MAX_ENTRIES ?? '', 10) || 2_000,
);

export function getCacheStore(): LruCache<CachedPayload> {
  return responseStore;
}

export function cacheStats(): LruCacheStats {
  return responseStore.stats();
}

function sortedQueryString(query: Request['query']): string {
  const keys = Object.keys(query).sort();
  if (keys.length === 0) return '';
  const parts: string[] = [];
  for (const k of keys) {
    const v = query[k];
    if (Array.isArray(v)) {
      parts.push(`${k}=${[...v].sort().join(',')}`);
    } else if (v !== undefined) {
      parts.push(`${k}=${String(v)}`);
    }
  }
  return parts.join('&');
}

function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function deriveTier(req: AuthLikeRequest, configured?: CacheTier): CacheTier {
  if (configured) return configured;
  // No auth header — public bucket. Authenticated → private.
  return req.user || req.headers.authorization ? 'private' : 'public';
}

function cacheControlHeader(tier: CacheTier, ttlMs: number, swrMs: number): string {
  if (tier === 'none' || ttlMs <= 0) return 'no-store, no-cache, must-revalidate';
  const maxAge = Math.floor(ttlMs / 1000);
  if (tier === 'private') return `private, max-age=${maxAge}, must-revalidate`;
  // public
  const swrPart = swrMs > 0 ? `, stale-while-revalidate=${Math.floor(swrMs / 1000)}` : '';
  return `public, max-age=${maxAge}${swrPart}`;
}

export function buildCacheKey(req: AuthLikeRequest, tier: CacheTier, scope: string): string {
  const path = req.baseUrl + req.path;
  const queryStr = sortedQueryString(req.query);
  return `${req.method}:${path}:${hash(queryStr)}:${tier}:${hash(scope)}`;
}

function isCacheBypassRequest(req: Request): boolean {
  const cc = req.headers['cache-control'];
  if (typeof cc === 'string' && /(?:^|,)\s*no-cache\b/i.test(cc)) return true;
  return false;
}

// ── Middleware factory ────────────────────────────────────────────────────────

export function cache(options: CacheOptions = {}) {
  const {
    tier: configuredTier,
    ttlMs: configuredTtl,
    staleWhileRevalidateMs = configuredTier === 'public' ? 600_000 : 0,
    scope: scopeFn,
    bypass: bypassFn,
  } = options;

  return function cacheMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Only safe-method reads. Non-GET methods bypass entirely (mutating routes
    // should call `invalidateCache` directly from their handlers).
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const tier = deriveTier(req as AuthLikeRequest, configuredTier);
    const ttlMs = tier === 'none' ? 0 : (configuredTtl ?? (tier === 'public' ? 300_000 : 60_000));
    const ccHeader = cacheControlHeader(tier, ttlMs, staleWhileRevalidateMs);

    // Always emit Cache-Control even on hits to keep the contract uniform.
    res.setHeader('Cache-Control', ccHeader);
    res.setHeader('Vary', 'Authorization, Accept-Language');

    const shouldBypass = bypassFn ? bypassFn(req) : isCacheBypassRequest(req);
    if (tier === 'none' || ttlMs <= 0 || shouldBypass) {
      res.setHeader('X-Cache', shouldBypass ? 'BYPASS' : 'OFF');
      return next();
    }

    const scope = scopeFn ? scopeFn(req) : ((req as AuthLikeRequest).user?.id ?? '');
    const key = buildCacheKey(req as AuthLikeRequest, tier, scope);
    const cached = responseStore.get(key);

    if (cached) {
      const ageSec = Math.max(0, Math.floor((Date.now() - cached.storedAt) / 1000));
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Age', String(ageSec));
      metrics.incCache('response', 'hit');
      if (cached.contentType) res.setHeader('Content-Type', cached.contentType);
      res.status(cached.status);
      if (typeof cached.body === 'string') {
        res.send(cached.body);
      } else {
        res.json(cached.body);
      }
      return;
    }

    res.setHeader('X-Cache', 'MISS');
    metrics.incCache('response', 'miss');

    // Wrap res.json so a successful 2xx response gets cached on the way out.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const status = res.statusCode;
      if (status >= 200 && status < 300) {
        try {
          responseStore.set(
            key,
            {
              status,
              body,
              contentType: (res.getHeader('Content-Type') as string | undefined) ?? undefined,
              storedAt: Date.now(),
            },
            ttlMs,
          );
        } catch (err) {
          logger.warn('[cache] store.set failed', { message: (err as Error).message });
        }
      }
      return originalJson(body);
    };

    next();
  };
}

// ── Invalidation API ──────────────────────────────────────────────────────────

/**
 * Purge cached responses whose keys start with `pathPrefix`. Used by mutating
 * handlers — e.g. PATCH /api/admin/contacts/:id invalidates GET /api/contacts.
 *
 * Returns the count of purged entries (for log lines + tests).
 */
export function invalidateCache(pathPrefix: string): number {
  // Keys are `<METHOD>:<path>:...`. To match any method, scan all keys.
  let purged = 0;
  for (const k of responseStore.keys()) {
    // After "<METHOD>:" the path begins.
    const colon = k.indexOf(':');
    if (colon < 0) continue;
    const pathPart = k.slice(colon + 1);
    if (pathPart.startsWith(pathPrefix)) {
      responseStore.delete(k);
      purged++;
    }
  }
  if (purged > 0) {
    logger.info('[cache] invalidate', { prefix: pathPrefix, purged });
  }
  return purged;
}

/**
 * Express handler wrapper — call after a mutation handler to invalidate
 * GET caches for the affected resource. Example:
 *
 *   router.post('/contacts', handler, invalidateAfter('/contacts'));
 *
 * (Generally inline `invalidateCache('/api/contacts')` inside the handler is
 *  simpler — this is provided for declarative routes.)
 */
export function invalidateAfter(pathPrefix: string) {
  return function invalidateAfterMiddleware(
    _req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    invalidateCache(pathPrefix);
    next();
  };
}

// ── Testing hooks ─────────────────────────────────────────────────────────────

export const _cacheTesting = {
  reset(): void {
    responseStore.clear();
  },
  store: responseStore,
};
