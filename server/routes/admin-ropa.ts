/**
 * M4 — KVKK İşleme Envanteri (ROPA) admin endpoints.
 *
 * Routes mounted at `/api/admin/ropa`:
 *   GET    /                         — list all ROPAProcess records
 *   GET    /:processId               — single process
 *   POST   /seed                     — idempotent upsert of 8 template processes (admin-only)
 *   PATCH  /:processId/approve       — set dpoApproved=true, update review dates
 *   PATCH  /:processId/status        — change ROPAStatus
 *
 * Retention periods are code-locked in src/constants/ropa-template.ts.
 * Auth: JWT + ADMIN role required on all routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';
import { ROPA_TEMPLATES } from '../../src/constants/ropa-template';

const router = Router();
const adminOnly = [authenticate, requirePermission('ropa.edit')] as const;

const ROPAStatusValues = ['ACTIVE', 'DEPRECATED', 'UNDER_REVIEW'] as const;

const patchStatusSchema = z.object({
  status: z.enum(ROPAStatusValues),
});

// ─── GET /api/admin/ropa ─────────────────────────────────────────────────────

router.get('/', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.rOPAProcess.findMany({
      orderBy: { processId: 'asc' },
    });
    res.json({ status: 'ok', data: records });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/ropa/:processId ─────────────────────────────────────────

router.get('/:processId', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.rOPAProcess.findUnique({
      where: { processId: req.params['processId'] },
    });
    if (!record) {
      res.status(404).json({ status: 'error', message: 'İşlem bulunamadı' });
      return;
    }
    res.json({ status: 'ok', data: record });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/ropa/seed ───────────────────────────────────────────────

router.post('/seed', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const nextReviewDue = new Date(now);
    nextReviewDue.setFullYear(nextReviewDue.getFullYear() + 1);

    const results = await Promise.all(
      ROPA_TEMPLATES.map((tpl) =>
        prisma.rOPAProcess.upsert({
          where: { processId: tpl.processId },
          update: {
            name: tpl.name,
            purpose: tpl.purpose,
            legalBasis: tpl.legalBasis,
            dataCategories: tpl.dataCategories,
            retentionPeriod: tpl.retentionPeriod,
            retentionPeriodDays: tpl.retentionPeriodDays,
            retentionLegalSource: tpl.retentionLegalSource,
            transferLocation: tpl.transferLocation,
            transferMechanism: tpl.transferMechanism,
          },
          create: {
            processId: tpl.processId,
            name: tpl.name,
            purpose: tpl.purpose,
            legalBasis: tpl.legalBasis,
            dataCategories: tpl.dataCategories,
            retentionPeriod: tpl.retentionPeriod,
            retentionPeriodDays: tpl.retentionPeriodDays,
            retentionLegalSource: tpl.retentionLegalSource,
            transferLocation: tpl.transferLocation,
            transferMechanism: tpl.transferMechanism,
            lastReviewedAt: now,
            nextReviewDue,
          },
        }),
      ),
    );

    res.json({ status: 'ok', data: { seeded: results.length } });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/ropa/:processId/approve ────────────────────────────────

router.patch(
  '/:processId/approve',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const nextReviewDue = new Date(now);
      nextReviewDue.setFullYear(nextReviewDue.getFullYear() + 1);

      const record = await prisma.rOPAProcess.update({
        where: { processId: req.params['processId'] },
        data: {
          dpoApproved: true,
          lastReviewedAt: now,
          nextReviewDue,
        },
      });
      res.json({ status: 'ok', data: record });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /api/admin/ropa/:processId/status ────────────────────────────────

router.patch(
  '/:processId/status',
  ...adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = patchStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ status: 'error', issues: parsed.error.issues });
        return;
      }

      const record = await prisma.rOPAProcess.update({
        where: { processId: req.params['processId'] },
        data: { status: parsed.data.status },
      });
      res.json({ status: 'ok', data: record });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
