/**
 * P23 BE Track 2 / Aşama 5 — CDN Cache-Control + Vary middleware.
 *
 * Background: Render runs the app behind its own edge cache, and several
 * customers front us with Cloudflare. Without explicit Cache-Control the
 * defaults are conservative:
 *   - Render edge:  ignores responses without `cache-control`
 *   - Cloudflare:   only caches static-extension URLs by default
 *
 * Setting headers explicitly per route class lets us trade freshness for
 * latency:
 *
 *   Versioned static asset    → cache forever (`immutable`)
 *   HTML document             → 5 min browser, 1 day stale-while-revalidate
 *   API GET, public           → 60s browser, 5 min CDN (`s-maxage`)
 *   API GET, authenticated    → never cache (`private, must-revalidate`)
 *   POST/PUT/DELETE/PATCH     → never cache (`no-store`)
 *
 * Vary handling: caches key on (path, method, Vary-listed headers). We MUST
 * list `Accept-Language` (TR/EN content negotiation) and `Cookie` (auth
 * separation) so an authenticated user never sees an anonymous cached
 * response. `Accept-Encoding` is added so gzip vs identity variants don't
 * collide.
 *
 * ETag: Express's `etag` is on by default for GET responses. We don't
 * override it; the conditional GET → 304 path is downstream-compatible
 * with the cache classes below.
 */

import type { Request, Response, NextFunction } from 'express';

export type CacheClass =
  | 'static-immutable'
  | 'html'
  | 'api-public-get'
  | 'api-private-get'
  | 'no-store';

export interface CacheClassOptions {
  /** Override max-age in seconds. */
  maxAge?: number;
  /** Override s-maxage (CDN-side) in seconds. */
  sMaxAge?: number;
  /** Override stale-while-revalidate seconds. */
  staleWhileRevalidate?: number;
}

/**
 * Build the Cache-Control directive string for the named class.
 * Pure function — tests assert exact strings.
 */
export function buildCacheControl(cls: CacheClass, opts: CacheClassOptions = {}): string {
  switch (cls) {
    case 'static-immutable': {
      const maxAge = opts.maxAge ?? 31_536_000; // 1y
      return `public, max-age=${maxAge}, immutable`;
    }
    case 'html': {
      const maxAge = opts.maxAge ?? 300; // 5 min
      const swr = opts.staleWhileRevalidate ?? 86_400; // 1 day
      return `public, max-age=${maxAge}, stale-while-revalidate=${swr}`;
    }
    case 'api-public-get': {
      const maxAge = opts.maxAge ?? 60; // 1 min browser
      const sMax = opts.sMaxAge ?? 300; // 5 min CDN
      return `public, max-age=${maxAge}, s-maxage=${sMax}`;
    }
    case 'api-private-get':
      return 'private, max-age=0, must-revalidate';
    case 'no-store':
    default:
      return 'no-store';
  }
}

const DEFAULT_VARY = ['Accept-Language', 'Accept-Encoding', 'Cookie'];

/**
 * Set Cache-Control + Vary for a single response. Use directly inside a
 * route handler when one route's policy diverges from the global default.
 */
export function setCache(
  res: Response,
  cls: CacheClass,
  opts: CacheClassOptions = {},
  vary: string[] = DEFAULT_VARY,
): void {
  res.setHeader('Cache-Control', buildCacheControl(cls, opts));
  res.setHeader('Vary', vary.join(', '));
}

/**
 * Express middleware factory — apply a single cache class to a router
 * subtree. Useful for `/api/v1/services` where every GET is public and
 * cacheable.
 */
export function cacheControl(cls: CacheClass, opts: CacheClassOptions = {}) {
  const directive = buildCacheControl(cls, opts);
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Cache-Control', directive);
    // Append (not overwrite) Vary so route-level headers can compose.
    appendVary(res, DEFAULT_VARY);
    next();
  };
}

/**
 * Method-aware default cache middleware. Mount globally to give every
 * response a sane Cache-Control even when no route opts in explicitly:
 *
 *   app.use(defaultCacheByMethod());
 *
 * Decision tree:
 *   - Mutating methods (POST/PUT/PATCH/DELETE)             → no-store
 *   - GET/HEAD with `Authorization` or auth cookie         → api-private-get
 *   - GET/HEAD on unauthenticated requests                 → api-public-get
 */
export function defaultCacheByMethod() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method.toUpperCase();
    let cls: CacheClass = 'api-public-get';
    if (method !== 'GET' && method !== 'HEAD') {
      cls = 'no-store';
    } else if (req.headers.authorization || hasAuthCookie(req)) {
      cls = 'api-private-get';
    }
    // Don't clobber an explicit header set later — only set when blank.
    if (!res.getHeader('Cache-Control')) {
      res.setHeader('Cache-Control', buildCacheControl(cls));
    }
    appendVary(res, DEFAULT_VARY);
    next();
  };
}

function hasAuthCookie(req: Request): boolean {
  const c = req.headers.cookie;
  if (typeof c !== 'string' || c.length === 0) return false;
  // Common project cookie names — keep this list narrow to avoid false
  // positives that demote cacheable responses to private.
  return /(?:^|;\s*)(?:access_token|refresh_token|session)=/.test(c);
}

function appendVary(res: Response, fields: string[]): void {
  const existing = res.getHeader('Vary');
  if (typeof existing === 'string' && existing.length > 0) {
    const have = new Set(existing.split(',').map((s) => s.trim().toLowerCase()));
    const merged = [
      ...existing.split(',').map((s) => s.trim()).filter(Boolean),
      ...fields.filter((f) => !have.has(f.toLowerCase())),
    ];
    res.setHeader('Vary', merged.join(', '));
  } else {
    res.setHeader('Vary', fields.join(', '));
  }
}
