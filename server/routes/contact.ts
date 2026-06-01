/**
 * P12/2 + Track B — Contact / Lead intake proxy.
 *
 * Frontend `<ContactForm />` POSTs here. We validate via zod, rate-limit per
 * IP (`contactLimiter`), require an explicit KVKK consent boolean, optionally
 * send a Resend acknowledgement to the lead, fire a PostHog server-side
 * funnel event, and forward to Telegram using the server-only
 * TELEGRAM_BOT_TOKEN. No credential is ever shipped to the browser.
 *
 * Endpoints:
 *   POST /api/contact       → general contact form
 *   POST /api/contact (kind=booking) → light-touch booking intake
 *
 * Errors:
 *   400 INVALID_PAYLOAD     — schema validation failed
 *   400 KVKK_REQUIRED       — kvkkConsent missing or not true
 *   429 RATE_LIMITED        — handled by contactLimiter middleware
 *   502 NOTIFY_FAILED       — Telegram forwarding 5xx
 *   503 NOTIFY_DISABLED     — TELEGRAM_BOT_TOKEN missing in env
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as Sentry from '@sentry/node';
import { contactStrictLimiter } from '../middleware/rateLimiter';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../middleware/error';
import { notify } from '../lib/telegram';
import { logger } from '../config/logger';
import { hashIp } from '../lib/crypto/hashIp';
import { captureWithConsent } from '../lib/posthog-server';
import { prisma } from '../config/db';
import { upsertProspect } from '../services/notion';
import {
  sendContactAck,
  sendFounderNotification,
  isResendConfigured,
} from '../services/contact-ack';
import { withOutboxRecord } from '../lib/outbox';

const router = Router();

// ── Schema ────────────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(120, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(180),
  company: z.string().trim().max(180).optional().default(''),
  sector: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().min(10, 'Message too short').max(4000, 'Message too long'),
  kind: z.enum(['contact', 'booking']).optional().default('contact'),
  serviceInterest: z.string().trim().max(200).optional().default(''),
  budget: z.string().trim().max(60).optional().default(''),
  // Free-string subject — contact form <select> keys (general/project/…) or
  // chat widget free text (SimpleChatWidget sends 'Web chat widget mesajı').
  // Never an enum: chat widget sends arbitrary strings.
  subject: z.string().trim().max(120).optional().default(''),
  // KVKK explicit opt-in — legal basis for processing the inbound lead.
  kvkkConsent: z.boolean().optional().default(false),
  analyticsConsent: z.boolean().optional().default(false),
  // Honeypot — bots fill this; real users never see it.
  hp_field: z.string().max(0).optional().default(''),
});

export type ContactPayload = z.infer<typeof ContactSchema>;

// Maps contact form <select> subject keys to TR labels for founder email + CRM.
// Free-text subjects (e.g. chat widget) pass through unchanged.
const SUBJECT_LABELS: Record<string, string> = {
  general: 'Genel Bilgi',
  project: 'Proje Teklifi',
  partnership: 'İş Ortaklığı',
  career: 'Kariyer',
};

// ── Route ─────────────────────────────────────────────────────────────────────

router.post(
  '/',
  contactStrictLimiter,
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

      // KVKK explicit opt-in is mandatory for the inbound lead's processing
      // basis. Reject the submission rather than silently storing it.
      if (!data.kvkkConsent) {
        throw new HttpError(
          400,
          'KVKK_REQUIRED',
          'KVKK / GDPR consent is required to process this request',
        );
      }

      // SAT-01: immutable consent provenance — 3yr retention (KVKK_CONTACT_FORM).
      // KVKK m.4 (Veri minimizasyonu) + m.12 (Veri güvenliği): IP is pseudonymized
      // via the canonical hashIp helper (32-char SHA-256 hex). Best-effort: DB
      // blip must NOT fail the user submission.
      const ipHash = hashIp(req.ip);
      void prisma.consentRecord
        .create({
          data: {
            consentType: 'KVKK_CONTACT_FORM',
            ipAddress: ipHash,
            userAgent: (req.headers['user-agent'] ?? '').slice(0, 500) || null,
            formVersion: '1.0.0',
          },
        })
        .catch((err) => logger.warn('[contact] consentRecord create failed', { err: String(err) }));

      // Resolve subject key → TR label for founder email + CRM.
      const subjectLabel = data.subject
        ? (SUBJECT_LABELS[data.subject] ?? data.subject)
        : undefined;

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
        KVKK: 'onaylandı',
        IP: req.ip ?? 'unknown',
      });

      // Resend dual-send: founder notification + visitor confirmation.
      // Both wrapped in outbox WAL so a Resend blip is retried by cron.
      // Skip entirely when Resend is unconfigured (dev / CI).
      if (isResendConfigured()) {
        void withOutboxRecord(
          {
            service: 'RESEND',
            operation: 'sendFounderNotification',
            payload: {
              name: data.name,
              email: data.email,
              message: data.message.slice(0, 1200),
              company: data.company || undefined,
              phone: data.phone || undefined,
              subject: data.serviceInterest || subjectLabel,
            },
          },
          () =>
            sendFounderNotification({
              name: data.name,
              email: data.email,
              message: data.message,
              company: data.company || undefined,
              phone: data.phone || undefined,
              subject: data.serviceInterest || subjectLabel,
            }),
        ).catch((err) =>
          logger.warn('[contact] founder notification failed — recorded in outbox for retry', {
            err: String(err),
          }),
        );

        void withOutboxRecord(
          {
            service: 'RESEND',
            operation: 'sendAutoresponder',
            payload: { to: data.email, name: data.name, kind: data.kind },
          },
          () => sendContactAck({ to: data.email, name: data.name, kind: data.kind }),
        ).catch((err) =>
          logger.warn('[contact] ack email failed — recorded in outbox for retry', {
            err: String(err),
          }),
        );
      }

      // KVKK m.5/2-f — consent timestamp captured at submission time; Notion
      // stores the timestamp on the Prospect row for audit provenance.
      // Best-effort: a Notion outage MUST NOT fail the user submission.
      void upsertProspect({
        company: data.company || undefined,
        decisionMaker: data.name,
        decisionMakerEmail: data.email,
        sector: data.sector || undefined,
        outreachStatus: 'Replied',
        serviceSlug: data.serviceInterest || undefined,
        firstContactDate: new Date().toISOString(),
        kvkkConsentAt: new Date().toISOString(),
        notes: [
          data.kind === 'booking' ? 'Source: Booking form' : 'Source: Contact form',
          subjectLabel && `Subject: ${subjectLabel}`,
          data.serviceInterest && `Service: ${data.serviceInterest}`,
          data.budget && `Budget: ${data.budget}`,
          data.phone && `Phone: ${data.phone}`,
          data.message && `Message: ${data.message.slice(0, 1200)}`,
        ]
          .filter(Boolean)
          .join('\n'),
      }).catch((err) => logger.warn('[contact] notion upsert failed', { err: String(err) }));

      void captureWithConsent({
        event: 'contact_submit',
        email: data.email,
        consent: { kvkk: data.kvkkConsent, analytics: data.analyticsConsent },
        properties: {
          kind: data.kind,
          company: data.company || null,
          sector: data.sector || null,
          serviceInterest: data.serviceInterest || null,
          subject: data.subject || null,
          budget: data.budget || null,
        },
      });

      res.json({ ok: true });
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  },
);

export default router;
