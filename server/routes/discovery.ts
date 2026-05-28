/**
 * L1-3 — Discovery form backend route.
 *
 * POST /api/v1/discovery → validate → ConsentRecord (SAT-01) → Notion CRM →
 *   Resend ack → PostHog event → 200 ok
 *
 * KVKK: consentType = "KVKK_DISCOVERY_FORM", retention = 3 years (SAT-01).
 * Rate limit: 5 req / hour / IP (discovery is a high-intent CRM event).
 *
 * Errors:
 *   400 INVALID_PAYLOAD   — Zod validation failed
 *   400 KVKK_REQUIRED     — kvkkConsent missing or false
 *   429 RATE_LIMITED      — discoveryLimiter middleware
 *   503 SERVICE_ERROR     — unexpected downstream failure
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { discoveryLimiter } from '../middleware/rateLimiter';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../middleware/error';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { capture as posthogCapture } from '../lib/posthog-server';
import { upsertProspect } from '../services/notion';
import { sendContactAck, isResendConfigured } from '../services/contact-ack';
import { withOutboxRecord } from '../lib/outbox';
import crypto from 'node:crypto';

const router = Router();

const DiscoverySchema = z.object({
  name: z.string().trim().min(2, 'Ad çok kısa').max(120, 'Ad çok uzun'),
  email: z.string().trim().email('Geçersiz e-posta').max(180),
  company: z.string().trim().min(1, 'Şirket adı zorunlu').max(180),
  sector: z.string().trim().max(120).optional().default(''),
  headcount: z.string().trim().max(20).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
  kvkkConsent: z.boolean(),
  hp_field: z.string().max(0).optional().default(''),
});

export type DiscoveryPayload = z.infer<typeof DiscoverySchema>;

router.post(
  '/',
  discoveryLimiter,
  idempotency({ ttlMs: 24 * 60 * 60 * 1000 }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = DiscoverySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          parsed.error.issues[0]?.message ?? 'Geçersiz form verisi',
        );
      }
      const data = parsed.data;

      if (data.hp_field) {
        logger.info('[discovery] honeypot triggered', { ip: req.ip });
        res.json({ ok: true });
        return;
      }

      if (!data.kvkkConsent) {
        throw new HttpError(400, 'KVKK_REQUIRED', 'KVKK onayı bu formu göndermek için zorunludur');
      }

      // SAT-01: ConsentRecord — 3 year retention, hash IP for minimality
      const ipHash = req.ip
        ? crypto.createHash('sha256').update(req.ip).digest('hex').slice(0, 16)
        : null;

      void prisma.consentRecord
        .create({
          data: {
            consentType: 'KVKK_DISCOVERY_FORM',
            ipAddress: ipHash,
            userAgent: (req.headers['user-agent'] ?? '').slice(0, 500) || null,
            formVersion: '1.0.0',
          },
        })
        .catch((err) =>
          logger.warn('[discovery] consentRecord create failed', { err: String(err) }),
        );

      // Notion CRM — best-effort, never blocks user
      void upsertProspect({
        company: data.company,
        decisionMaker: data.name,
        decisionMakerEmail: data.email,
        sector: data.sector || undefined,
        outreachStatus: 'Replied',
        firstContactDate: new Date().toISOString(),
        kvkkConsentAt: new Date().toISOString(),
        notes: [
          'Source: Discovery form',
          data.headcount && `Headcount: ${data.headcount}`,
          data.description && `Priority: ${data.description.slice(0, 800)}`,
        ]
          .filter(Boolean)
          .join('\n'),
      }).catch((err) => logger.warn('[discovery] notion upsert failed', { err: String(err) }));

      // Resend confirmation — best-effort via outbox
      if (isResendConfigured()) {
        void withOutboxRecord(
          {
            service: 'RESEND',
            operation: 'sendDiscoveryAck',
            payload: { to: data.email, name: data.name, kind: 'booking' },
          },
          () => sendContactAck({ to: data.email, name: data.name, kind: 'booking' }),
        ).catch((err) => logger.warn('[discovery] ack email failed', { err: String(err) }));
      }

      // PostHog: discovery_submitted
      void posthogCapture({
        event: 'discovery_submitted',
        distinctId: data.email,
        properties: {
          company: data.company,
          sector: data.sector || null,
          headcount: data.headcount || null,
          has_description: Boolean(data.description),
        },
      });

      logger.info('[discovery] form submitted', {
        email: data.email.replace(/(.{2}).+(@.+)/, '$1***$2'),
        company: data.company,
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
