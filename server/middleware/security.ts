/**
 * EcyPro — Security Middleware
 *
 * Production security headers, request ID generation,
 * and structured request logging.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ─── Security Headers ────────────────────────────────────

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Modern browsers use CSP instead
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (only in production behind HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // CSP for API (restrictive)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );

  next();
}

// ─── Structured Request Logger ───────────────────────────

import { logger } from '../config/logger';

interface RequestLog {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  durationMs: number;
}

export function structuredLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Capture response finish
  res.on('finish', () => {
    const logData: RequestLog = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
      userAgent: (req.headers['user-agent'] || '').substring(0, 200),
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    };

    // Log with appropriate level
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request client error', logData);
    } else {
      logger.info('Request success', logData);
    }
  });

  next();
}

// ─── Request Size Validator ──────────────────────────────

export function validateContentLength(maxBytes: number = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxBytes) {
      res.status(413).json({
        status: 'error',
        message: `Request body too large. Maximum ${Math.round(maxBytes / 1024 / 1024)}MB allowed.`,
      });
      return;
    }

    next();
  };
}

// ─── CORS Preflight Cache ────────────────────────────────

export function corsPreflight(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h
  }
  next();
}
