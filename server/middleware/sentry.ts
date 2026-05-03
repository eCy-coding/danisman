/**
 * EcyPro — Sentry Error Reporting (Backend)
 *
 * Server-side error tracking middleware and utilities.
 * Uses stub pattern when SENTRY_DSN is not configured.
 */

import type { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { logger } from '../config/logger';

interface ErrorEvent {
  eventId: string;
  message: string;
  stack?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Error Event Store (in-memory ring buffer) ───────────

const ERROR_BUFFER_SIZE = 200;
const errorBuffer: ErrorEvent[] = [];

function pushError(event: ErrorEvent): void {
  errorBuffer.push(event);
  if (errorBuffer.length > ERROR_BUFFER_SIZE) {
    errorBuffer.shift();
  }
}

// ─── Sentry Middleware ───────────────────────────────────

/**
 * Express middleware for capturing request errors.
 *
 * IMPORTANT: this middleware **does not write a response**. It only
 * captures the event (in-memory ring buffer + Sentry if configured),
 * attaches the `eventId` to the error object, and delegates to the
 * next error handler (`errorHandler` in `server/middleware/error.ts`),
 * which is the single source of truth for the API error envelope.
 *
 * Wiring order in `server/index.ts`:
 *   app.use(sentryErrorHandler());   // 1) capture + forward
 *   app.use(errorHandler);           // 2) respond with ApiErrorEnvelope
 */
export function sentryErrorHandler() {
  return (
    err: Error & { statusCode?: number; eventId?: string },
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const requestId = (req.headers['x-request-id'] as string) || 'unknown';
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    const event: ErrorEvent = {
      eventId: crypto.randomUUID(),
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode || 500,
      requestId,
      userId,
      timestamp: new Date().toISOString(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        query: req.query,
      },
    };

    pushError(event);

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err, { extra: event as unknown as Record<string, unknown> });
    }

    // Annotate the error so downstream middlewares (error envelope, tests)
    // can correlate user-visible payloads with the Sentry event.
    err.eventId = event.eventId;

    next(err);
  };
}

/**
 * Express endpoint for receiving frontend error reports
 */
export function clientErrorEndpoint() {
  return (req: Request, res: Response): void => {
    const body = req.body as Record<string, unknown>;

    if (!body || typeof body.message !== 'string') {
      res.status(400).json({ status: 'error', message: 'Invalid error payload' });
      return;
    }

    const event: ErrorEvent = {
      eventId: (body.eventId as string) || crypto.randomUUID(),
      message: body.message as string,
      stack: body.stack as string | undefined,
      url: body.url as string | undefined,
      statusCode: 0, // client-side error
      requestId: req.headers['x-request-id'] as string,
      timestamp: new Date().toISOString(),
      metadata: {
        type: body.type,
        breadcrumbs: body.breadcrumbs,
        context: body.context,
        userAgent: req.headers['user-agent'],
      },
    };

    pushError(event);

    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(`[Client] ${event.message}`, {
        level: 'error',
        extra: event as unknown as Record<string, unknown>
      });
    }

    logger.error(`[Sentry:Client] ${event.eventId}: ${event.message}`);
    res.status(200).json({ status: 'ok', eventId: event.eventId });
  };
}

/**
 * Get recent errors for admin dashboard
 */
export function getRecentErrors() {
  return (_req: Request, res: Response): void => {
    const recent = errorBuffer.slice(-20).reverse();
    res.json({
      status: 'ok',
      count: errorBuffer.length,
      errors: recent,
    });
  };
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  return (_req: Request, res: Response): void => {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    const lastHour = errorBuffer.filter(
      (e) => new Date(e.timestamp).getTime() > now - hour
    ).length;

    const last24h = errorBuffer.filter(
      (e) => new Date(e.timestamp).getTime() > now - day
    ).length;

    const byStatusCode = errorBuffer.reduce(
      (acc, e) => {
        const code = String(e.statusCode || 'client');
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      status: 'ok',
      stats: {
        total: errorBuffer.length,
        lastHour,
        last24h,
        byStatusCode,
      },
    });
  };
}
