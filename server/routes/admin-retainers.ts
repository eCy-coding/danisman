import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

export const adminRetainersRouter = Router();

adminRetainersRouter.use(authenticate, requireRole('ADMIN'));

adminRetainersRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const retainers = await prisma.retainer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: retainers });
});

adminRetainersRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { dealId, currency, monthlyAmount, kdvRate, stopajRate, startDate, endDate } = req.body as {
    dealId: string;
    currency: string;
    monthlyAmount: number;
    kdvRate?: number;
    stopajRate?: number;
    startDate: string;
    endDate?: string;
  };

  const retainer = await prisma.retainer.create({
    data: {
      dealId,
      currency: currency as never,
      monthlyAmount,
      kdvRate: kdvRate ?? 0.2,
      stopajRate: stopajRate ?? 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'RETAINER_CREATE',
      targetType: 'Retainer',
      targetId: retainer.id,
      newValue: { dealId, currency, monthlyAmount } as never,
      ip: req.ip,
    },
  });

  res.status(201).json({ data: retainer });
});

adminRetainersRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, endDate } = req.body as { status?: string; endDate?: string };

  const existing = await prisma.retainer.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Aylık Anlaşma bulunamadı' });
    return;
  }

  const retainer = await prisma.retainer.update({
    where: { id },
    data: {
      status: status as never,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'RETAINER_UPDATE',
      targetType: 'Retainer',
      targetId: id,
      oldValue: { status: (existing as Record<string, unknown>).status } as never,
      newValue: { status } as never,
      ip: req.ip,
    },
  });

  res.json({ data: retainer });
});
