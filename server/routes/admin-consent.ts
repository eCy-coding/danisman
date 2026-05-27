/**
 * M3 — KVKK Rıza Defteri (Consent Ledger) endpoints.
 *
 * Routes mounted at `/api/admin/consent`:
 *   GET /          — list consent records (paginated, filterable, searchable)
 *   GET /stats     — aggregate stats: total / active / unsubscribed / reconsent-due
 *   GET /reconsent-due — subscribers where subscribedAt < now-365d AND unsubscribedAt IS NULL
 *
 * Consent records are READ-ONLY — created only via the public subscribe flow.
 * Auth: JWT + ADMIN role required on all routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';

const router = Router();
const adminOnly = [authenticate, requirePermission('consent.read')] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECONSENT_THRESHOLD_DAYS = 365;

// ─── GET /api/admin/consent ──────────────────────────────────────────────────

router.get('/', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '50'), 10), 200);
    const offset = parseInt(String(req.query['offset'] ?? '0'), 10);
    const search = String(req.query['search'] ?? '').trim();
    const consentFilter = req.query['consent'];

    const where: {
      email?: { contains: string; mode: 'insensitive' };
      consent?: boolean;
    } = {};

    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    if (consentFilter === 'true') {
      where.consent = true;
    } else if (consentFilter === 'false') {
      where.consent = false;
    }

    const [items, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          consent: true,
          source: true,
          subscribedAt: true,
          unsubscribedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    res.json({ status: 'ok', data: { items, total, limit, offset } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/consent/stats ───────────────────────────────────────────

router.get('/stats', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reconsentCutoff = new Date(Date.now() - RECONSENT_THRESHOLD_DAYS * MS_PER_DAY);

    const [total, active, unsubscribed, reconsentDue] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null, consent: true } }),
      prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
      prisma.newsletterSubscriber.count({
        where: {
          subscribedAt: { lt: reconsentCutoff },
          unsubscribedAt: null,
        },
      }),
    ]);

    res.json({
      status: 'ok',
      data: { total, active, unsubscribed, reconsentDue },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/consent/reconsent-due ────────────────────────────────────

router.get(
  '/reconsent-due',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '100'), 10), 500);
      const offset = parseInt(String(req.query['offset'] ?? '0'), 10);

      const reconsentCutoff = new Date(Date.now() - RECONSENT_THRESHOLD_DAYS * MS_PER_DAY);

      const where = {
        subscribedAt: { lt: reconsentCutoff },
        unsubscribedAt: null,
      };

      const [items, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where,
          orderBy: { subscribedAt: 'asc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            email: true,
            consent: true,
            subscribedAt: true,
          },
        }),
        prisma.newsletterSubscriber.count({ where }),
      ]);

      res.json({ status: 'ok', data: { items, total, limit, offset } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
