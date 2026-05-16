/**
 * P12/2 — Contact / Lead intake proxy
 *
 * Frontend `src/services/emailService.ts` POSTs here. We validate via zod,
 * rate-limit per IP (3/h via contactLimiter), and forward to Telegram using
 * the server-only TELEGRAM_BOT_TOKEN. No credential is ever shipped to the
 * browser.
 *
 * Endpoints:
 *   POST /api/contact       → general contact form
 *   POST /api/contact (kind=booking) → light-touch booking intake
 *
 * Errors:
 *   400 INVALID_PAYLOAD     — schema validation failed
 *   429 RATE_LIMITED        — handled by contactLimiter middleware
 *   502 NOTIFY_FAILED       — Telegram forwarding 5xx
 *   503 NOTIFY_DISABLED     — TELEGRAM_BOT_TOKEN missing in env
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contactLimiter } from '../middleware/rateLimiter';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../middleware/error';
import { notify } from '../lib/telegram';
import { logger } from '../config/logger';

const router = Router();

// ── Schema ────────────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(120, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(180),
  company: z.string().trim().max(180).optional().default(''),
  phone: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().min(10, 'Message too short').max(4000, 'Message too long'),
  kind: z.enum(['contact', 'booking']).optional().default('contact'),
  serviceInterest: z.string().trim().max(200).optional().default(''),
  budget: z.string().trim().max(60).optional().default(''),
  // Honeypot — bots fill this; real users never see it.
  hp_field: z.string().max(0).optional().default(''),
});

export type ContactPayload = z.infer<typeof ContactSchema>;

// ── Route ─────────────────────────────────────────────────────────────────────

router.post(
  '/',
  contactLimiter,
  // P13/1 — Idempotency-Key honored if client sends one. Optional (no 400 on
  // missing key) so legacy form clients keep working; retried POSTs from
  // network jitter / double-click will dedupe within 24h TTL.
  idempotency({ ttlMs: 24 * 60 * 60 * 1000 }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = ContactSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          parsed.error.issues[0]?.message ?? 'Invalid payload',
        );
      }
      const data = parsed.data;

      // Silent-200 on honeypot match — don't let bots learn the trap.
      if (data.hp_field) {
        logger.info('[contact] honeypot triggered, silently accepting', { ip: req.ip });
        res.json({ ok: true });
        return;
      }

      if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        logger.warn('[contact] TELEGRAM_BOT_TOKEN missing — refusing in prod');
        if (process.env.NODE_ENV === 'production') {
          throw new HttpError(503, 'NOTIFY_DISABLED', 'Notification channel unavailable');
        }
        // dev: pretend success so the form is testable without secrets
        res.json({ ok: true, demo: true });
        return;
      }

      const title =
        data.kind === 'booking' ? '🎯 Yeni Rezervasyon Talebi' : '📬 Yeni İletişim Talebi';

      await notify('info', title, {
        Ad: data.name,
        Email: data.email,
        ...(data.company ? { Firma: data.company } : {}),
        ...(data.phone ? { Telefon: data.phone } : {}),
        ...(data.serviceInterest ? { Hizmet: data.serviceInterest } : {}),
        ...(data.budget ? { Bütçe: data.budget } : {}),
        ...(data.message ? { Mesaj: data.message.slice(0, 600) } : {}),
        IP: req.ip ?? 'unknown',
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
