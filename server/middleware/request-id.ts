/**
 * P14-BE: Dedicated request-id middleware.
 *
 * Honors an inbound `X-Request-Id` header if present (so a CDN, load
 * balancer, or upstream service can carry a trace ID across hops) and
 * falls back to a freshly generated UUIDv4. Also:
 *
 *   - Writes the value back as `X-Request-Id` on the response.
 *   - Tags the active Sentry scope (if Sentry is initialized).
 *   - Exposes the id as `req.id` for downstream consumers.
 *
 * Why a separate middleware from `securityHeaders`?
 *   - Request-id must be the FIRST thing in the chain so every later
 *     middleware (rate limiter, body parser, route handler, error handler)
 *     can correlate. `securityHeaders` lives after some preflight handling
 *     and was generating a fresh id every call, ignoring inbound traces.
 *   - This middleware is idempotent: if `req.id` is already set (i.e.
 *     securityHeaders or another upstream layer already populated it),
 *     it's reused as-is.
 *
 * Validation: the inbound header is sanitized to alphanumeric + dash +
 * underscore, max 128 chars. Hostile values (CRLF injection, control
 * chars, oversize strings) trigger a fresh UUID.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';

const HEADER = 'x-request-id';
const SAFE_RE = /^[A-Za-z0-9_-]{1,128}$/;

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  // Already set upstream → respect it (idempotent).
  if (req.id) {
    res.setHeader('X-Request-Id', req.id);
    return next();
  }

  const inbound = (req.headers[HEADER] ?? '') as string;
  const id = SAFE_RE.test(inbound) ? inbound : crypto.randomUUID();

  req.id = id;
  // Normalise the header value too — downstream middleware reading
  // `req.headers['x-request-id']` should see the sanitised id.
  req.headers[HEADER] = id;
  res.setHeader('X-Request-Id', id);

  // Sentry scope tag — surfaces the request-id in every captured exception
  // and breadcrumb for this request. Hub-level configureScope is safe even
  // when Sentry is not initialized (no-op).
  try {
    Sentry.getCurrentScope().setTag('request.id', id);
  } catch {
    // Sentry not initialized in this environment — fail open.
  }

  next();
}
