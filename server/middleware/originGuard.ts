/**
 * Phase 109a: Origin / Referer guard.
 *
 * The app uses JWT in the `Authorization: Bearer …` header (no auth cookies),
 * so classic CSRF via auto-sent cookies is not directly exploitable. This
 * guard adds a defence-in-depth check: for state-changing methods we require
 * the request to carry an `Origin` (or fall back to `Referer`) that matches
 * the same allowlist the CORS middleware uses, blocking cross-origin POSTs
 * from unrelated sites and most reflected-XSS-driven mutation attempts.
 *
 * Server-to-server callers (webhooks, health probes, synthetic checks) often
 * have no `Origin` header — pass them via the `ignore` prefix list.
 */

import type { Request, Response, NextFunction } from 'express';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface OriginGuardOptions {
  /** Path prefixes that bypass the guard (server-to-server callers). */
  ignore?: string[];
  /**
   * Override the allowlist. Defaults to `CORS_ORIGIN` env (comma-separated)
   * with the same dev fallbacks as the CORS middleware in `server/index.ts`.
   */
  allowedOrigins?: string[];
}

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:4175',
];

function resolveAllowlist(override?: string[]): string[] {
  if (override && override.length > 0) return override;
  const env = process.env.CORS_ORIGIN;
  if (env && env.trim().length > 0) {
    return env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_DEV_ORIGINS;
}

function originFromReferer(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

export function originGuard(options: OriginGuardOptions = {}) {
  const ignore = options.ignore ?? [];
  return function originGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!MUTATION_METHODS.has(req.method)) {
      next();
      return;
    }

    if (ignore.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      next();
      return;
    }

    const allowed = resolveAllowlist(options.allowedOrigins);
    const origin = req.headers.origin;
    const referer = req.headers.referer || req.headers.referrer;
    const sourceOrigin =
      origin ?? originFromReferer(typeof referer === 'string' ? referer : undefined);

    if (!sourceOrigin) {
      res.status(403).json({
        status: 'error',
        code: 'ORIGIN_REQUIRED',
        message: 'Origin or Referer header is required for state-changing requests.',
      });
      return;
    }

    if (!allowed.includes(sourceOrigin)) {
      res.status(403).json({
        status: 'error',
        code: 'ORIGIN_FORBIDDEN',
        message: 'Request origin is not in the allowlist.',
      });
      return;
    }

    next();
  };
}
