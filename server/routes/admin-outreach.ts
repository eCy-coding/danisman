import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

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
