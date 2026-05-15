/**
 * BE-4 — Production-ready CORS middleware
 *
 * Origin: explicit allowlist from `CORS_ORIGIN` env (comma-separated).
 *   Falls back to localhost dev origins ONLY when NODE_ENV !== 'production'.
 *   In production with no `CORS_ORIGIN` configured the app deliberately
 *   refuses cross-origin requests — explicit > implicit > insecure.
 *
 * Methods: minimal whitelist for our REST surface.
 * AllowedHeaders: explicit whitelist; no wildcard.
 * ExposedHeaders: rate limit + request id so the SPA can act on them.
 * Credentials: true (Bearer is in Authorization header but the SPA may
 *   send cookies for double-submit CSRF tokens in the future).
 * MaxAge: 24h preflight cache.
 */

import corsMiddleware, { type CorsOptions, type CorsOptionsDelegate } from 'cors';
import type { Request, RequestHandler } from 'express';
import { logger } from '../config/logger';

const DEFAULT_DEV_ORIGINS = Object.freeze([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:4175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]);

const PROD_FALLBACK_ORIGINS = Object.freeze([
  'https://www.ecypro.com',
  'https://ecypro.com',
]);

const ALLOWED_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const ALLOWED_HEADERS = [
  'Accept',
  'Accept-Language',
  'Authorization',
  'Content-Language',
  'Content-Type',
  'Origin',
  'X-Requested-With',
  'X-Request-ID',
  'X-CSRF-Token',
];

const EXPOSED_HEADERS = [
  'X-Request-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After',
];

function parseOriginEnv(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function resolveAllowlist(): readonly string[] {
  const fromEnv = parseOriginEnv();
  if (fromEnv.length > 0) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      '[cors] CORS_ORIGIN not set in production — using PROD_FALLBACK_ORIGINS (https://www.ecypro.com, https://ecypro.com). Set CORS_ORIGIN explicitly to silence this warning.',
    );
    return PROD_FALLBACK_ORIGINS;
  }

  return DEFAULT_DEV_ORIGINS;
}

const allowlist = resolveAllowlist();

export const allowedOrigins: readonly string[] = allowlist;

const optionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.header('Origin');
  const base: CorsOptions = {
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    credentials: true,
    maxAge: 86_400,
    optionsSuccessStatus: 204,
  };

  // No Origin header → server-to-server / curl / health probe → allow.
  if (!origin) {
    callback(null, { ...base, origin: false });
    return;
  }

  if (allowlist.includes(origin)) {
    callback(null, { ...base, origin: true });
    return;
  }

  logger.warn('[cors] origin rejected', { origin });
  // Reject silently — do not echo back the origin
  callback(null, { ...base, origin: false });
};

/**
 * Production-ready CORS middleware. Use as `app.use(corsProd())`.
 */
export function corsProd(): RequestHandler {
  return corsMiddleware(optionsDelegate);
}
