/**
 * P18 BE Track 2 / Aşama 2 — HTTP request → Prometheus emitter.
 *
 * Mounted EARLY in the middleware chain so it sees every request (after
 * request-id but before any auth/rate-limit short-circuits). We wrap
 * `res.end` so the timer fires regardless of how the response was sent
 * (json, send, end, stream).
 *
 * Why wrap `res.end` instead of using `res.on('finish')`? Both work,
 * but `res.end` runs even when a middleware aborts via `res.status(...).send()`
 * without explicitly emitting 'finish' yet; wrapping is also synchronous
 * and gives us a deterministic timing window without a Symbol-leaking
 * listener.
 *
 * Route labelling rule:
 *   - prefer `req.route?.path` (Express's matched route)
 *   - fall back to `req.originalUrl.split('?')[0]` for 404s, normalised
 *     via `normaliseRouteLabel`.
 *
 * The `/metrics` endpoint itself is excluded from emission so the
 * scrape doesn't pollute its own counters.
 */

import type { Request, Response, NextFunction } from 'express';
import { metrics, normaliseRouteLabel } from './metrics';

export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip the scrape endpoint and its docs path — recursive accounting
  // would distort the histogram.
  if (
    req.path === '/metrics' ||
    req.path === '/api/metrics' ||
    req.path === '/api/v1/metrics'
  ) {
    return next();
  }

  const start = process.hrtime.bigint();
  // Express types make `res.end` an overloaded mess (3 signatures, untyped
  // chunk param). We capture once via res.on('finish') instead — slightly
  // less precise (fires after the socket flush starts) but typesafe and
  // never breaks a request even on framework upgrades.
  let emitted = false;
  const emit = (): void => {
    if (emitted) return;
    emitted = true;
    try {
      const ns = Number(process.hrtime.bigint() - start);
      const seconds = ns / 1_000_000_000;
      const routePath =
        (req.route as { path?: string } | undefined)?.path ??
        req.originalUrl.split('?')[0] ??
        req.path;
      const label = normaliseRouteLabel(`${req.baseUrl ?? ''}${routePath ?? ''}` || req.path);
      metrics.observeHttpRequest(req.method, label, res.statusCode, seconds);
    } catch {
      // Never let metrics emission fail a request.
    }
  };
  res.on('finish', emit);
  res.on('close', emit);

  next();
}
