/**
 * P13/3 — GDPR / KVKK data-rights endpoints.
 *
 * KVKK Madde 11 + GDPR Art. 15-17 ile uyumlu:
 *   POST /api/gdpr/export   → data export talebi (kullanıcı email'i)
 *   POST /api/gdpr/delete   → silme talebi
 *   GET  /api/gdpr/status   → endpoint sağlık + politika linkleri (public)
 *
 * Rate limit: 1 request / 24 saat / email (abuse koruması). Storage: in-process
 * Map (Redis-ready), TTL 24h. Çift istek 429 döner.
 *
 * Audit: her talep `notify('info', …)` ile Telegram'a düşer + Winston'a
 * structured log; ileride `DataRightsRequest` Prisma modeli eklenince
 * persistent audit'e geçirilir.
 *
 * Confirmation flow:
 *   1. POST /export → "İsteğinizi aldık" — 24 saat içinde admin manuel hazırlar
 *      (otomatik export şu an aktivasyon dışı; KVKK kimlik doğrulaması gerek)
 *   2. POST /delete → confirmation link admin'e gider — admin kullanıcıyı
 *      doğrular + Prisma cascade delete yapar.
 *
 * Idempotency: client `Idempotency-Key` header'ı atarsa 24h içinde aynı email +
 * aynı body için aynı response cached.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HttpError } from '../middleware/error';
import { idempotency } from '../middleware/idempotency';
import { notify } from '../lib/telegram';
import { logger } from '../config/logger';

const router = Router();

// ── Per-email rate limit (1 req / 24h) ────────────────────────────────────────

interface RateEntry {
  count: number;
  resetAt: number;
}
const rateBucket = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

setInterval(
  () => {
    const now = Date.now();
    for (const [k, v] of rateBucket) if (now > v.resetAt) rateBucket.delete(k);
  },
  5 * 60 * 1000,
).unref?.();

function rateKey(kind: 'export' | 'delete', email: string): string {
  return `${kind}:${email.toLowerCase()}`;
}

function applyRateLimit(kind: 'export' | 'delete', email: string): boolean {
  const key = rateKey(kind, email);
  const now = Date.now();
  const entry = rateBucket.get(key);
  if (!entry || now > entry.resetAt) {
    rateBucket.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= 1) return false;
  entry.count += 1;
  return true;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  email: z.string().trim().email().max(180),
  reason: z.string().trim().max(2000).optional().default(''),
  // Honeypot — bots fill, real users never see.
  hp_field: z.string().max(0).optional().default(''),
  // Language preference for the response message.
  lang: z.enum(['tr', 'en']).optional().default('tr'),
});

type RequestPayload = z.infer<typeof RequestSchema>;

// ── Localized response messages ───────────────────────────────────────────────

function ackMessage(kind: 'export' | 'delete', lang: 'tr' | 'en'): string {
  if (lang === 'en') {
    return kind === 'export'
      ? 'Your data export request has been received. We will respond within 24 hours.'
      : 'Your data deletion request has been received. We will confirm via email within 24 hours.';
  }
  return kind === 'export'
    ? 'Veri dışa aktarım talebiniz alındı. 24 saat içinde size dönüş yapılacaktır.'
    : 'Veri silme talebiniz alındı. 24 saat içinde e-posta ile teyit edilecektir.';
}

// ── Public status endpoint ────────────────────────────────────────────────────

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    endpoints: {
      export: 'POST /api/gdpr/export',
      delete: 'POST /api/gdpr/delete',
    },
    policy: {
      privacyUrl: 'https://www.ecypro.com/privacy',
      dataRightsUrl: 'https://www.ecypro.com/privacy/data-rights',
      contactEmail: 'kvkk@ecypro.com',
    },
    rateLimit: {
      window: 'P1D',
      maxPerEmail: 1,
    },
    legalBasis: ['KVKK Madde 11', 'GDPR Art. 15-17'],
  });
});

// ── Shared handler factory ────────────────────────────────────────────────────

function makeHandler(kind: 'export' | 'delete') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = RequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          parsed.error.issues[0]?.message ?? 'Invalid payload',
        );
      }
      const data: RequestPayload = parsed.data;

      // Honeypot → silent-200 (don't leak the trap to bots).
      if (data.hp_field) {
        logger.info(`[gdpr/${kind}] honeypot triggered`, { ip: req.ip });
        res.json({ ok: true, message: ackMessage(kind, data.lang) });
        return;
      }

      if (!applyRateLimit(kind, data.email)) {
        throw new HttpError(
          429,
          'RATE_LIMITED',
          'Bu email adresi için 24 saat içinde yalnızca 1 talep gönderilebilir.',
        );
      }

      // Audit log — Winston structured + Telegram admin alert.
      const auditPayload = {
        kind,
        email: data.email,
        reasonLen: data.reason.length,
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent']?.toString().slice(0, 200) ?? '',
        lang: data.lang,
        ts: new Date().toISOString(),
      };
      logger.info(`[gdpr/${kind}] request received`, auditPayload);

      // Telegram admin notify (best-effort — failure shouldn't block ack).
      try {
        const title =
          kind === 'export' ? '📤 KVKK Veri Dışa Aktarım Talebi' : '🗑️ KVKK Veri Silme Talebi';
        await notify('warn', title, {
          'E-posta': data.email,
          IP: auditPayload.ip,
          Dil: data.lang,
          Sebep: data.reason ? data.reason.slice(0, 300) : '(belirtilmemiş)',
          Zaman: auditPayload.ts,
        });
      } catch (err) {
        logger.warn(`[gdpr/${kind}] admin notify failed`, {
          message: (err as Error).message,
        });
      }

      res.json({
        ok: true,
        kind,
        message: ackMessage(kind, data.lang),
        responseSlaHours: 24,
      });
    } catch (err) {
      next(err);
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/export', idempotency({ ttlMs: 24 * 60 * 60 * 1000 }), makeHandler('export'));
router.post('/delete', idempotency({ ttlMs: 24 * 60 * 60 * 1000 }), makeHandler('delete'));

// ── Test helpers (NOT exported for runtime) ───────────────────────────────────

export const _testing = {
  resetRateLimit: () => rateBucket.clear(),
};

export default router;
