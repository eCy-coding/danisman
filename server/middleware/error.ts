import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

/**
 * Standard API error envelope used across the EcyPro backend.
 *
 * Clients can rely on stable `status` + `code` values for machine handling
 * while `message` remains human-friendly. `requestId` lets support triage
 * back to Winston logs.
 */
export interface ApiErrorEnvelope {
  status: 'error';
  /** Machine-readable error code (e.g. VALIDATION_ERROR, UNIQUE_CONSTRAINT). */
  code: string;
  /** Human-friendly message. Kept non-localized for log correlation. */
  message: string;
  /** Correlates with Winston logs + client Sentry reports. */
  requestId: string;
  /** Sentry event id when `sentryErrorHandler` has captured the error. */
  eventId?: string;
  /** Populated for Zod validation errors. */
  issues?: Array<{ path: string; message: string; code?: string }>;
}

/** Thrown inside controllers to surface a typed domain error with an HTTP status. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly issues?: ApiErrorEnvelope['issues'],
  ) {
    super(message);
    this.name = 'HttpError';
  }

  // BE-6: Ergonomic factories — keep call sites short and code stable.
  static badRequest(message = 'Bad request', issues?: ApiErrorEnvelope['issues']): HttpError {
    return new HttpError(400, 'BAD_REQUEST', message, issues);
  }
  static unauthorized(message = 'Authentication required'): HttpError {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Insufficient permissions'): HttpError {
    return new HttpError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Resource not found'): HttpError {
    return new HttpError(404, 'NOT_FOUND', message);
  }
  static conflict(message = 'Resource already exists'): HttpError {
    return new HttpError(409, 'CONFLICT', message);
  }
  static tooManyRequests(message = 'Too many requests'): HttpError {
    return new HttpError(429, 'RATE_LIMITED', message);
  }
  static internal(message = 'Internal server error'): HttpError {
    return new HttpError(500, 'INTERNAL_ERROR', message);
  }
}

function normalizeZod(err: ZodError): ApiErrorEnvelope['issues'] {
  return err.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
    code: i.code,
  }));
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const isProd = process.env.NODE_ENV === 'production';
  const eventId = (err as { eventId?: string })?.eventId;

  // ── HttpError (explicit domain error) ──────────────────
  if (err instanceof HttpError) {
    logger.warn(`[HttpError:${err.statusCode}] ${err.code}: ${err.message}`, { requestId, path: req.path });
    const body: ApiErrorEnvelope = {
      status: 'error',
      code: err.code,
      message: err.message,
      requestId,
    };
    if (eventId) body.eventId = eventId;
    if (err.issues) body.issues = err.issues;
    return res.status(err.statusCode).json(body);
  }

  const eventIdFragment = eventId ? { eventId } : {};

  // ── Zod validation errors → 400 ────────────────────────
  if (err instanceof ZodError) {
    logger.warn('[Zod] validation failed', { requestId, path: req.path });
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Request payload failed validation',
      requestId,
      issues: normalizeZod(err),
      ...eventIdFragment,
    } satisfies ApiErrorEnvelope);
  }

  // ── Prisma known errors ────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`[Prisma:${err.code}] ${err.message}`, { requestId, path: req.path });
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        code: 'UNIQUE_CONSTRAINT',
        message: 'Resource already exists',
        requestId,
        ...eventIdFragment,
      } satisfies ApiErrorEnvelope);
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId,
        ...eventIdFragment,
      } satisfies ApiErrorEnvelope);
    }
    return res.status(400).json({
      status: 'error',
      code: `PRISMA_${err.code}`,
      message: isProd ? 'Database request error' : err.message,
      requestId,
      ...eventIdFragment,
    } satisfies ApiErrorEnvelope);
  }

  // ── Syntax errors from body parser ─────────────────────
  if (err instanceof SyntaxError && 'body' in (err as unknown as Record<string, unknown>)) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_JSON',
      message: 'Request body is not valid JSON',
      requestId,
      ...eventIdFragment,
    } satisfies ApiErrorEnvelope);
  }

  // ── Fallback 500 ───────────────────────────────────────
  const baseErr = err as Error;
  logger.error(`[Error] ${baseErr?.name ?? 'Unknown'}: ${baseErr?.message ?? 'unknown'}`, {
    stack: baseErr?.stack,
    requestId,
    path: req.path,
  });
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: isProd ? 'Internal server error' : baseErr?.message ?? 'Unknown error',
    requestId,
    ...(eventId ? { eventId } : {}),
  } satisfies ApiErrorEnvelope);
};
