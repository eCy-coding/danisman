/**
 * P40-T03: Structured logging with optional Better Stack (Logtail) transport
 *
 * Transports:
 *   1. Console (always) — development: pretty-print, production: JSON
 *   2. Logtail (when LOGTAIL_SOURCE_TOKEN env is set) — centralized search + alerting
 *
 * Sensitive data redaction: token/password/secret fields never logged.
 *
 * Setup:
 *   betterstack.com → Logs → Create source → copy Source Token
 *   Add to .env: LOGTAIL_SOURCE_TOKEN=...
 */

import winston from 'winston';

const { combine, timestamp, printf, json } = winston.format;

// ─── Redact sensitive fields from log metadata ────────────
const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'secret',
  'totpSecret',
  'authorization',
  'cookie',
  'apiKey',
  'backupCodes',
]);

const redactFormat = winston.format((info) => {
  const redact = (obj: unknown, depth = 0): unknown => {
    if (depth > 5 || typeof obj !== 'object' || obj === null) return obj;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(val, depth + 1);
    }
    return result;
  };
  return redact(info) as winston.Logform.TransformableInfo;
});

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `[${timestamp}] ${level}: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// ─── Build transport list ─────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console(),
  // P40-T93: Rotating file transport (production) — 10 MB × 3 backups
  ...(process.env.NODE_ENV === 'production'
    ? [
        new winston.transports.File({
          filename: 'logs/ecypro-error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10 MB
          maxFiles: 3,
          tailable: true,
        }),
        new winston.transports.File({
          filename: 'logs/ecypro-combined.log',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 3,
          tailable: true,
        }),
      ]
    : []),
];

// P40-T03: Logtail (Better Stack) — lazy runtime init to avoid crash if not installed
const logtailToken = process.env.LOGTAIL_SOURCE_TOKEN;
if (logtailToken) {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { Logtail } = require('@logtail/node') as { Logtail: new (t: string) => object };
    const { LogtailTransport } = require('@logtail/winston') as {
      LogtailTransport: new (l: object) => winston.transport;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
    const logtail = new Logtail(logtailToken);
    transports.push(new LogtailTransport(logtail));
  } catch {
    // @logtail/node not installed — skip silently (optional dependency)
  }
}

// Select format: production → JSON, test → plain JSON (no colorize), dev → pretty
const activeFormat =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
    ? json()
    : combine(consoleFormat);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
  format: combine(redactFormat(), timestamp(), activeFormat),
  transports,
});

/**
 * BE-3: Child logger helper — bind metadata (e.g. requestId, userId) to a
 * sub-logger so every emit downstream is automatically correlated.
 *
 * Usage:
 *   const log = childLogger({ requestId, userId });
 *   log.info('processing payment', { orderId });
 */
export function childLogger(bindings: Record<string, unknown>): winston.Logger {
  return logger.child(bindings);
}
