/**
 * P15-BE Aşama 6 — HMAC webhook signature verification middleware.
 *
 * Why a dedicated middleware?
 *   The existing Cal.com path verified its signature against
 *   `JSON.stringify(req.body)` AFTER express had already parsed the
 *   request — a re-serialised payload loses byte-perfect fidelity
 *   (key order, whitespace), so any HMAC computed over the original
 *   bytes drifts and verification silently fails for valid requests.
 *
 *   This middleware works against the RAW request body captured at
 *   parse time (see server/index.ts `express.json({ verify })`), so the
 *   signed bytes match exactly what the upstream provider signed.
 *
 * Provider matrix (header + secret env var):
 *
 *   Cal.com:    X-Cal-Signature-256          CAL_COM_WEBHOOK_SECRET
 *   Stripe:     Stripe-Signature             STRIPE_WEBHOOK_SECRET
 *   GitHub:     X-Hub-Signature-256          GITHUB_WEBHOOK_SECRET
 *   Telegram:   X-Telegram-Bot-Api-Secret-Token  TELEGRAM_WEBHOOK_SECRET
 *
 * Add a new provider by extending PROVIDERS below. Each entry can also
 * supply a `parseSignature` hook for non-hex encodings (Stripe sends
 * `t=…,v1=…` — see comments on the entry).
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';

declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

interface ProviderConfig {
  /** HTTP header carrying the signature value. */
  header: string;
  /** Env var holding the shared secret. */
  secretEnv: string;
  /** Hash algorithm — currently always sha256. */
  algo: 'sha256';
  /**
   * Optional signature extractor for non-hex encodings.
   * Default: strip a `sha256=` prefix and parse the rest as hex.
   */
  parseSignature?: (raw: string) => Buffer | null;
}

const hexParser = (raw: string): Buffer | null => {
  try {
    return Buffer.from(raw.replace(/^sha256=/, ''), 'hex');
  } catch {
    return null;
  }
};

const PROVIDERS: Record<string, ProviderConfig> = {
  calcom: {
    header: 'x-cal-signature-256',
    secretEnv: 'CAL_COM_WEBHOOK_SECRET',
    algo: 'sha256',
    parseSignature: hexParser,
  },
  stripe: {
    header: 'stripe-signature',
    secretEnv: 'STRIPE_WEBHOOK_SECRET',
    algo: 'sha256',
    // Stripe sends "t=<ts>,v1=<hex>"; lift the v1 chunk.
    parseSignature: (raw: string) => {
      const v1 = raw.split(',').find((p) => p.startsWith('v1='));
      if (!v1) return null;
      try {
        return Buffer.from(v1.slice(3), 'hex');
      } catch {
        return null;
      }
    },
  },
  github: {
    header: 'x-hub-signature-256',
    secretEnv: 'GITHUB_WEBHOOK_SECRET',
    algo: 'sha256',
    parseSignature: hexParser,
  },
  telegram: {
    header: 'x-telegram-bot-api-secret-token',
    secretEnv: 'TELEGRAM_WEBHOOK_SECRET',
    algo: 'sha256',
    // Telegram sends the raw token value (constant), not a true HMAC.
    // We perform a constant-time compare against the secret directly.
    parseSignature: (raw: string) => Buffer.from(raw, 'utf-8'),
  },
};

export type WebhookProviderName = keyof typeof PROVIDERS;

/**
 * Constant-time HMAC verification. Returns true iff the signature
 * matches the body under the configured secret. Telegram is a special
 * case: the header is the secret itself (constant-time string compare).
 */
function verifySignature(
  provider: ProviderConfig,
  body: Buffer,
  signatureHeader: string,
  secret: string,
): boolean {
  const parser = provider.parseSignature ?? hexParser;
  const sigBuf = parser(signatureHeader);
  if (!sigBuf) return false;

  // Telegram: compare header to secret directly.
  if (provider === PROVIDERS.telegram) {
    const secretBuf = Buffer.from(secret, 'utf-8');
    if (secretBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(secretBuf, sigBuf);
  }

  const expected = crypto.createHmac(provider.algo, secret).update(body).digest();
  if (expected.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expected, sigBuf);
}

/**
 * Build the Express middleware for a given provider.
 *
 * Behavioural contract:
 *   - In production with no secret configured → 503 (loud misconfig).
 *   - In non-production with no secret configured → log warn, accept
 *     (developers should not need to set every secret to iterate).
 *   - Missing or unparseable signature → 401 INVALID_SIGNATURE.
 *   - Missing raw body capture → 500 RAW_BODY_UNAVAILABLE (server bug).
 */
export function verifyWebhook(provider: WebhookProviderName) {
  const cfg = PROVIDERS[provider];
  if (!cfg) {
    throw new Error(`[verify-webhook] Unknown provider: ${provider}`);
  }

  return function verifyWebhookMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const secret = process.env[cfg.secretEnv];
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        logger.error(
          `[verify-webhook:${provider}] ${cfg.secretEnv} not set — rejecting in production`,
        );
        res.status(503).json({
          status: 'error',
          code: 'WEBHOOK_MISCONFIGURED',
          message: `Webhook signing key ${cfg.secretEnv} is not configured`,
        });
        return;
      }
      logger.warn(
        `[verify-webhook:${provider}] ${cfg.secretEnv} not set — accepting in non-prod (dev fallback)`,
      );
      next();
      return;
    }

    const signature = req.headers[cfg.header] as string | undefined;
    if (!signature) {
      logger.warn(`[verify-webhook:${provider}] missing header ${cfg.header}`);
      res.status(401).json({
        status: 'error',
        code: 'INVALID_SIGNATURE',
        message: 'Webhook signature header missing',
      });
      return;
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      logger.error(
        `[verify-webhook:${provider}] rawBody unavailable — express.json({ verify }) is mandatory`,
      );
      res.status(500).json({
        status: 'error',
        code: 'RAW_BODY_UNAVAILABLE',
        message: 'Server cannot verify webhook (raw body capture not configured)',
      });
      return;
    }

    if (!verifySignature(cfg, rawBody, signature, secret)) {
      logger.warn(`[verify-webhook:${provider}] signature mismatch`);
      res.status(401).json({
        status: 'error',
        code: 'INVALID_SIGNATURE',
        message: 'Webhook signature did not verify',
      });
      return;
    }

    logger.debug(`[verify-webhook:${provider}] OK`);
    next();
  };
}

/**
 * `express.json({ verify })` callback. Wire this into server/index.ts so
 * every webhook receiver has access to the raw bytes:
 *
 *   app.use(express.json({
 *     limit: '10mb',
 *     verify: captureRawBody,
 *   }));
 */
export function captureRawBody(req: Request, _res: Response, buf: Buffer): void {
  if (buf?.length) {
    (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
  }
}
