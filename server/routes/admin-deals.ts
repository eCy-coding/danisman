import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../config/db';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

export const adminDealsRouter = Router();

adminDealsRouter.use(authenticate, requireRole('ADMIN'));

adminDealsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const deals = await prisma.deal.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: deals });
});

adminDealsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, ownerId, transactionValueUsd, successFeePct, expectedCloseDate, notes } =
    req.body as {
      name: string;
      type: string;
      ownerId: string;
      transactionValueUsd?: number;
      successFeePct?: number;
      expectedCloseDate?: string;
      notes?: string;
    };

  // Zorunlu alan kontrolü — eksik name/type/ownerId → 400
  if (!name || !type || !ownerId) {
    res.status(400).json({ error: 'name, type, ownerId zorunlu' });
    return;
  }

  const deal = await prisma.deal.create({
    data: {
      name,
      type: type as never,
      stage: 'DISCOVERY',
      ownerId,
      transactionValueUsd: transactionValueUsd ?? undefined,
      successFeePct: successFeePct ?? 0.02,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'DEAL_CREATE',
      targetType: 'Deal',
      targetId: deal.id,
      newValue: { name: deal.name, stage: deal.stage } as never,
      ip: req.ip,
    },
  });

  res.status(201).json({ data: deal });
});

adminDealsRouter.patch('/:id/stage', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { stage, closedLostReason } = req.body as { stage: string; closedLostReason?: string };

  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Süreç bulunamadı' });
    return;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      stage: stage as never,
      closedLostReason: closedLostReason ?? undefined,
      actualCloseDate: stage === 'CLOSED_WON' || stage === 'CLOSED_LOST' ? new Date() : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'DEAL_STAGE_CHANGE',
      targetType: 'Deal',
      targetId: id,
      oldValue: { stage: existing.stage } as never,
      newValue: { stage } as never,
      ip: req.ip,
    },
  });

  res.json({ data: deal });
});

adminDealsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const deal = await prisma.deal.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id ?? 'system',
      action: 'DEAL_DELETE',
      targetType: 'Deal',
      targetId: id,
      ip: req.ip,
    },
  });

  res.json({ data: deal });
});
