import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const adminOutreachRouter = Router();

adminOutreachRouter.use(authenticate, requireRole('ADMIN'));

adminOutreachRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const waves = await prisma.outreachWave.findMany({
    orderBy: { createdAt: 'desc' },
    include: { prospects: true },
  });
  res.json({ data: waves });
});

adminOutreachRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, startDate, endDate, targetRevenueUsd } = req.body as {
    name: string;
    startDate: string;
    endDate?: string;
    targetRevenueUsd?: number;
  };

  const wave = await prisma.outreachWave.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      targetRevenueUsd: targetRevenueUsd ?? undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'OUTREACH_WAVE_CREATE',
      targetType: 'OutreachWave',
      targetId: wave.id,
      newValue: { name, startDate } as never,
      ip: req.ip,
    },
  });

  res.status(201).json({ data: wave });
});

adminOutreachRouter.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  const existing = await prisma.outreachWave.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Dalga bulunamadı' });
    return;
  }

  const wave = await prisma.outreachWave.update({
    where: { id },
    data: { status: status as never },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'OUTREACH_WAVE_STATUS_CHANGE',
      targetType: 'OutreachWave',
      targetId: id,
      oldValue: { status: (existing as Record<string, unknown>).status } as never,
      newValue: { status } as never,
      ip: req.ip,
    },
  });

  res.json({ data: wave });
});

// R8-P1 — Outreach prospect status PATCH.
// Updates an individual prospect's funnel status and auto-stamps the matching
// timestamp (openedAt on OPENED, repliedAt on REPLIED). The wave's
// realizedRevenueUsd does NOT auto-update on MEETING — that's a deal-close
// event and the Revenue admin owns it. Audit log captures the transition.

const ProspectStatusSchema = z.object({
  status: z.enum(['SENT', 'OPENED', 'REPLIED', 'MEETING', 'DISQUALIFIED']),
});

adminOutreachRouter.patch(
  '/prospects/:id/status',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const parsed = ProspectStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error?.issues?.[0]?.message ?? 'Geçersiz istek' });
      return;
    }

    const existing = await prisma.outreachProspect.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Prospect bulunamadı' });
      return;
    }

    const { status } = parsed.data;
    const now = new Date();
    const data: Record<string, unknown> = { status };
    // Stamp the corresponding event timestamp the first time the status
    // transitions there. Idempotent — re-setting REPLIED doesn't overwrite.
    if (status === 'OPENED' && !existing.openedAt) data.openedAt = now;
    if (status === 'REPLIED' && !existing.repliedAt) {
      data.repliedAt = now;
      // Imply OPENED if user jumps straight to REPLIED.
      if (!existing.openedAt) data.openedAt = now;
    }

    try {
      const prospect = await prisma.outreachProspect.update({
        where: { id },
        data: data as never,
      });

      try {
        await prisma.auditLog.create({
          data: {
            adminId: req.user?.id ?? 'system',
            action: 'OUTREACH_PROSPECT_STATUS_CHANGE',
            targetType: 'OutreachProspect',
            targetId: id,
            oldValue: { status: existing.status } as never,
            newValue: { status } as never,
          },
        });
      } catch (auditErr) {
        logger.warn('[admin-outreach] prospect status audit failed (non-blocking)', {
          err: (auditErr as Error)?.message,
        });
      }

      res.json({ data: prospect });
    } catch (err) {
      logger.error('[admin-outreach] prospect status update failed', {
        message: (err as Error)?.message,
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);
