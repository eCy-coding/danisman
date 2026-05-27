/**
 * Admin Aday (lead) CRUD — Notion-backed proxy.
 *
 * Routes (mounted at /api/admin/leads):
 *   POST /          — create Aday in Notion + log KVKK consent
 *   GET  /          — list Adaylar (cached, paginated via start_cursor)
 *   GET  /:id       — get single Aday from Notion
 *
 * Security: JWT + ADMIN role required on all routes.
 * Token stays server-side only — never forwarded to client.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import {
  createAdayInNotion,
  listAdaylarFromNotion,
  getAdayFromNotion,
  NotionLeadsError,
} from '../lib/notion-leads-client';
import { getSseManager } from '../lib/realtime/sse-manager';

const router = Router();
const adminOnly = [authenticate, requireRole('ADMIN')] as const;

// ── Validation schema ─────────────────────────────────────────────────────────

const AdayCreateSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  email: z.string().email({ message: 'Geçerli e-posta adresi giriniz' }),
  company: z.string().min(2, 'Şirket adı gerekli'),
  revenueRange: z.enum(['100M-300M USD', '301M-500M USD', '501M-1000M USD', '+1000M USD']),
  serviceInterest: z.array(z.string()).min(1, 'En az 1 hizmet seçiniz'),
  source: z.enum(['Discovery Call', 'LinkedIn Wave', 'Founder Letter', 'Direct', 'Referral']),
  purchaseAuthority: z.boolean().optional(),
  kvkkConsent: z.literal(true, { message: 'KVKK rızası zorunludur' }),
});

// ── Error mapper ──────────────────────────────────────────────────────────────

function notionErrorToHttp(err: NotionLeadsError): { status: number; message: string } {
  if (err.code === 'NOTION_RATE_LIMITED') {
    return {
      status: 429,
      message: 'Sistem yoğun, lütfen 10 saniye bekleyin ve tekrar deneyin.',
    };
  }
  if (err.code === 'NOTION_NOT_CONFIGURED') {
    return {
      status: 503,
      message:
        'Şu an işleminizi gerçekleştiremiyoruz. Lütfen doğrudan info@ecypro.com üzerinden bize ulaşın.',
    };
  }
  return {
    status: 502,
    message:
      'Şu an işleminizi gerçekleştiremiyoruz. Lütfen doğrudan info@ecypro.com üzerinden bize ulaşın.',
  };
}

// ── POST / — create Aday ──────────────────────────────────────────────────────

router.post(
  '/',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = AdayCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error?.issues ?? [];
      const msg = issues[0]?.message ?? 'Geçersiz istek';
      res.status(400).json({ status: 'error', message: msg });
      return;
    }

    try {
      const result = await createAdayInNotion(parsed.data);

      // KVKK consent audit — fire-and-forget (never fail the lead create)
      prisma.consentRecord
        .create({
          data: {
            leadId: result.id,
            consentType: 'KVKK_LEAD_FORM',
            ipAddress: req.ip ? req.ip.split(',')[0]?.trim().slice(0, 45) : null,
            userAgent: req.headers['user-agent']?.slice(0, 512) ?? null,
            formVersion: '1.0.0',
          },
        })
        .catch((err) => logger.warn('[admin-leads] consent log failed', { err: String(err) }));

      // SSE broadcast to admin subscribers
      try {
        getSseManager().publish('admin.new_candidate', {
          type: 'new_candidate',
          data: { name: parsed.data.name, company: parsed.data.company, id: result.id },
        });
      } catch {
        // SSE failure never blocks the response
      }

      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      if (err instanceof NotionLeadsError) {
        const { status, message } = notionErrorToHttp(err);
        res.status(status).json({ status: 'error', message });
        return;
      }
      next(err);
    }
  },
);

// ── GET / — list Adaylar ──────────────────────────────────────────────────────

router.get(
  '/',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const result = await listAdaylarFromNotion(cursor);
      res.json({ status: 'success', data: result });
    } catch (err) {
      if (err instanceof NotionLeadsError) {
        const { status, message } = notionErrorToHttp(err);
        res.status(status).json({ status: 'error', message });
        return;
      }
      next(err);
    }
  },
);

// ── GET /:id — get Aday detail ────────────────────────────────────────────────

router.get(
  '/:id',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const aday = await getAdayFromNotion(req.params['id'] ?? '');
      res.json({ status: 'success', data: aday });
    } catch (err) {
      if (err instanceof NotionLeadsError) {
        const { status, message } = notionErrorToHttp(err);
        res.status(status).json({ status: 'error', message });
        return;
      }
      next(err);
    }
  },
);

export default router;
