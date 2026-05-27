/**
 * M5 — VERBİS Bildirim Takibi admin endpoints.
 *
 * Routes mounted at `/api/admin/verbis`:
 *   GET   /status        — returns current VERBİS registration status
 *   PATCH /status        — update status (PENDING | REGISTERED) + optional sicilNo
 *   GET   /annual-review — returns nextReviewDue + overdue flag
 *
 * Storage: SiteConfig table with keys verbis_status, verbis_sicil_no, verbis_registered_at
 * Auth: JWT + ADMIN role required on all routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { prisma } from '../config/db';

const router = Router();
const adminOnly = [authenticate, requirePermission('consent.read')] as const;

const VERBISStatusValues = ['PENDING', 'REGISTERED'] as const;
type VERBISStatus = (typeof VERBISStatusValues)[number];

const patchStatusSchema = z.object({
  status: z.enum(VERBISStatusValues),
  sicilNo: z.string().trim().optional(),
});

async function getSiteConfigValue(key: string): Promise<string | null> {
  const record = await prisma.siteConfig.findUnique({ where: { key } });
  return record?.value ?? null;
}

// ─── GET /api/admin/verbis/status ────────────────────────────────────────────

router.get('/status', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [statusRecord, sicilRecord, registeredAtRecord] = await Promise.all([
      prisma.siteConfig.findUnique({ where: { key: 'verbis_status' } }),
      prisma.siteConfig.findUnique({ where: { key: 'verbis_sicil_no' } }),
      prisma.siteConfig.findUnique({ where: { key: 'verbis_registered_at' } }),
    ]);

    const status: VERBISStatus = statusRecord?.value === 'REGISTERED' ? 'REGISTERED' : 'PENDING';

    res.json({
      status: 'ok',
      data: {
        verbisStatus: status,
        sicilNo: sicilRecord?.value ?? null,
        registeredAt: registeredAtRecord?.value ?? null,
        lastUpdatedAt: statusRecord?.updatedAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/verbis/status ──────────────────────────────────────────

router.patch('/status', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = patchStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ status: 'error', message: 'Geçersiz veri', issues: parsed.error.issues });
      return;
    }

    const { status, sicilNo } = parsed.data;
    const now = new Date().toISOString();

    await prisma.siteConfig.upsert({
      where: { key: 'verbis_status' },
      update: { value: status },
      create: { key: 'verbis_status', value: status },
    });

    if (sicilNo !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'verbis_sicil_no' },
        update: { value: sicilNo },
        create: { key: 'verbis_sicil_no', value: sicilNo },
      });
    }

    if (status === 'REGISTERED') {
      await prisma.siteConfig.upsert({
        where: { key: 'verbis_registered_at' },
        update: { value: now },
        create: { key: 'verbis_registered_at', value: now },
      });
    }

    res.json({ status: 'ok', data: { verbisStatus: status, updatedAt: now } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/verbis/annual-review ─────────────────────────────────────

router.get(
  '/annual-review',
  ...adminOnly,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const registeredAt = await getSiteConfigValue('verbis_registered_at');

      if (!registeredAt) {
        res.json({
          status: 'ok',
          data: {
            nextReviewDue: null,
            overdue: false,
            message: 'Henüz kayıt yapılmamış',
          },
        });
        return;
      }

      const registeredDate = new Date(registeredAt);
      const nextReviewDue = new Date(registeredDate);
      nextReviewDue.setFullYear(nextReviewDue.getFullYear() + 1);

      const overdue = nextReviewDue.getTime() < Date.now();

      res.json({
        status: 'ok',
        data: {
          nextReviewDue: nextReviewDue.toISOString(),
          overdue,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
