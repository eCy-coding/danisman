/**
 * P17 BE Track 2 / Aşama 4 — API key authentication middleware.
 *
 * Programmatic clients send their key as:
 *   Authorization: Bearer <raw-key>
 *
 * We never store the raw key — only a SHA-256 hash. To authenticate:
 *   1. Extract the bearer token.
 *   2. Hash with SHA-256 → namespaced cache lookup.
 *   3. DB lookup if cache miss; verify not revoked / not expired.
 *   4. Attach `req.apiKey` so downstream handlers can scope-check.
 *
 * Why SHA-256 and not bcrypt?
 *   - API keys are long, high-entropy random strings (we generate 32B
 *     base64url). They aren't memorable like a password, so brute-force
 *     resistance via slow hashing isn't useful — speed of lookup matters.
 *   - Constant-time comparison happens at the byte level via Buffer.compare.
 *
 * Cache: we keep a 60s in-process LRU of (hashedKey → ApiKey-row-snippet)
 * so the hot path avoids a DB round-trip. Revocation lag is bounded to
 * 60s; the admin DELETE endpoint also flushes the entry inline.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db';
import { LruCache } from '../lib/lru-cache';
import { logger } from '../config/logger';

export interface ApiKeyContext {
  id: string;
  name: string;
  scopes: string[];
  userId: string | null;
  expiresAt: Date | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    apiKey?: ApiKeyContext;
  }
}

const cache = new LruCache<ApiKeyContext>(500);
const CACHE_TTL_MS = 60_000;

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Constant-time string equality so the cache lookup doesn't open a
 *  timing side-channel on hashed comparisons. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function invalidateCachedKey(hashedKey: string): void {
  cache.delete(hashedKey);
}

// ── Middleware ──────────────────────────────────────────────────────────────

export interface ApiKeyAuthOptions {
  /** When true, missing/invalid key → 401. When false, just pass through. */
  required?: boolean;
  /** Required scope tags (ALL must be present). */
  requiredScopes?: string[];
}

export function apiKeyAuth(options: ApiKeyAuthOptions = {}) {
  const required = options.required !== false;
  const requiredScopes = options.requiredScopes ?? [];

  return async function apiKeyAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      if (required) {
        res.status(401).json({
          status: 'error',
          code: 'API_KEY_MISSING',
          message: 'Authorization: Bearer <key> required',
        });
        return;
      }
      return next();
    }

    const rawKey = header.slice('Bearer '.length).trim();
    // Sanity guard — raw key must be in the alphabet/length range we
    // emit at creation (32B base64url ≈ 43 chars). Reject anything
    // shorter/longer outright so we don't even hit the cache.
    if (rawKey.length < 24 || rawKey.length > 128) {
      if (required) {
        res.status(401).json({
          status: 'error',
          code: 'API_KEY_INVALID_SHAPE',
          message: 'Malformed API key',
        });
        return;
      }
      return next();
    }

    const hashedKey = hashApiKey(rawKey);

    let ctx = cache.get(hashedKey);
    if (!ctx) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = await (prisma as any).apiKey.findUnique({
          where: { hashedKey },
        });
        if (!row || row.revokedAt) {
          if (required) {
            res.status(401).json({
              status: 'error',
              code: 'API_KEY_INVALID',
              message: 'Unknown or revoked API key',
            });
            return;
          }
          return next();
        }
        if (row.expiresAt && row.expiresAt < new Date()) {
          if (required) {
            res.status(401).json({
              status: 'error',
              code: 'API_KEY_EXPIRED',
              message: 'API key has expired',
            });
            return;
          }
          return next();
        }
        // Constant-time check — the DB lookup matched, but reassert to
        // close any path-shortening leak.
        if (!safeEqual(row.hashedKey, hashedKey)) {
          if (required) {
            res.status(401).json({
              status: 'error',
              code: 'API_KEY_INVALID',
              message: 'Authentication failed',
            });
            return;
          }
          return next();
        }
        ctx = {
          id: row.id,
          name: row.name,
          scopes: row.scopes,
          userId: row.userId ?? null,
          expiresAt: row.expiresAt ?? null,
        };
        cache.set(hashedKey, ctx, CACHE_TTL_MS);

        // Touch lastUsedAt out-of-band — never blocks the request.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        void (prisma as any).apiKey
          .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
          .catch((err: Error) =>
            logger.warn('[api-key-auth] lastUsedAt update failed', { message: err.message }),
          );
      } catch (err) {
        logger.error('[api-key-auth] DB lookup failed', { message: (err as Error).message });
        if (required) {
          res.status(500).json({
            status: 'error',
            code: 'API_KEY_AUTH_INTERNAL_ERROR',
            message: 'Authentication backend error',
          });
          return;
        }
        return next();
      }
    }

    // Scope check — ALL required scopes must be present.
    const missing = requiredScopes.filter((s) => !ctx!.scopes.includes(s));
    if (missing.length > 0) {
      res.status(403).json({
        status: 'error',
        code: 'API_KEY_INSUFFICIENT_SCOPE',
        message: 'Missing required scopes',
        missing,
      });
      return;
    }

    req.apiKey = ctx;
    next();
  };
}

// ── Test seam ──────────────────────────────────────────────────────────────

export const _testing = {
  cache,
};
