/**
 * P13/1 — Request timeout middleware.
 *
 * Caps how long any single request can occupy a worker. Without this, a slow
 * Telegram POST or a stuck Prisma query can starve the event loop and
 * eventually trip Render's 30s health-check window — at which point Render
 * recycles the container and we lose in-flight requests.
 *
 * Behavior:
 *   - Default 30s global timeout, 60s for uploads (multipart/form-data),
 *     overridable per-route via `timeout({ ms })`.
 *   - When the deadline hits we respond 504 with a stable envelope and tag
 *     the response for downstream logs / Sentry transaction tracking.
 *   - We do NOT abort the handler — Node can't safely cancel arbitrary code.
 *     We just stop the response and rely on the handler to discover the
 *     terminated socket on its next write attempt.
 *   - Skips long-lived endpoints (SSE, websockets) via opt-out list.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface TimeoutOptions {
  /** Timeout in milliseconds. Default 30_000. */
  ms?: number;
  /** Timeout for multipart uploads. Default 60_000. */
  uploadMs?: number;
  /** Path prefixes that must NEVER timeout (SSE, websocket upgrades). */
  skipPrefixes?: string[];
}

const DEFAULT_SKIP = ['/api/sse', '/__health', '/api/health'];

export function requestTimeout(options: TimeoutOptions = {}) {
  const defaultMs = options.ms ?? 30_000;
  const uploadMs = options.uploadMs ?? 60_000;
  const skipPrefixes = [...DEFAULT_SKIP, ...(options.skipPrefixes ?? [])];

  return function timeoutMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (skipPrefixes.some((p) => req.path.startsWith(p))) return next();

    const isUpload = (req.headers['content-type'] ?? '').toString().startsWith('multipart/');
    const limit = isUpload ? uploadMs : defaultMs;

    const timer = setTimeout(() => {
      if (res.headersSent || res.writableEnded) return;
      logger.warn(`[timeout] ${req.method} ${req.path} exceeded ${limit}ms`);
      res.status(504).json({
        status: 'error',
        code: 'REQUEST_TIMEOUT',
        message: `Request exceeded ${limit}ms deadline.`,
        requestId: (req.headers['x-request-id'] as string) || 'unknown',
      });
      // Tag for downstream listeners (Sentry, metrics).
      res.locals.timedOut = true;
    }, limit);
    timer.unref?.();

    const clear = () => clearTimeout(timer);
    res.once('finish', clear);
    res.once('close', clear);

    next();
  };
}
