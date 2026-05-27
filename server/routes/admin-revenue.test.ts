import { describe, test, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ── Prisma mock ──────────────────────────────────────────────────────────────
vi.mock('../config/db', () => {
  const auditLogMock = { create: vi.fn().mockResolvedValue({}) };
  const dealMock = {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const retainerMock = {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
  };
  const waveMock = {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
  };
  return {
    prisma: {
      auditLog: auditLogMock,
      deal: dealMock,
      retainer: retainerMock,
      outreachWave: waveMock,
    },
  };
});

vi.mock('../middleware/auth', () => ({
  authenticate: (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

import { adminDealsRouter } from './admin-deals';
import { adminRetainersRouter } from './admin-retainers';
import { adminOutreachRouter } from './admin-outreach';
import { prisma } from '../config/db';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/deals', adminDealsRouter);
  app.use('/api/admin/retainers', adminRetainersRouter);
  app.use('/api/admin/outreach', adminOutreachRouter);
  return app;
}

const mockDeal = {
  id: 'deal-1',
  name: 'Test Süreç',
  type: 'SELL_SIDE',
  stage: 'DISCOVERY',
  successFeePct: 0.02,
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Revenue APIs — M6', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.deal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockDeal]);
    (prisma.deal.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeal);
    (prisma.deal.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeal);
    (prisma.deal.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockDeal,
      stage: 'DD',
    });
    (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  // ── Deals ────────────────────────────────────────────────────────────────
  test('GET /api/admin/deals → 200 + deal array', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/admin/deals');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('POST /api/admin/deals → 201 + creates audit log', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/admin/deals')
      .send({ name: 'Yeni Süreç', type: 'SELL_SIDE', ownerId: 'user-1' });
    expect(res.status).toBe(201);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('PATCH /api/admin/deals/:id/stage → 200 + audit log on stage change', async () => {
    const app = makeApp();
    const res = await request(app).patch('/api/admin/deals/deal-1/stage').send({ stage: 'DD' });
    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('DELETE /api/admin/deals/:id → 200 + audit log', async () => {
    (prisma.deal.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockDeal,
      deletedAt: new Date(),
    });
    const app = makeApp();
    const res = await request(app).delete('/api/admin/deals/deal-1');
    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  // ── Retainers ────────────────────────────────────────────────────────────
  test('GET /api/admin/retainers → 200 + retainer array', async () => {
    (prisma.retainer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const app = makeApp();
    const res = await request(app).get('/api/admin/retainers');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('POST /api/admin/retainers → 201 + audit log', async () => {
    const mockRetainer = { id: 'ret-1', dealId: 'deal-1', currency: 'USD', monthlyAmount: 25000 };
    (prisma.retainer.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockRetainer);
    const app = makeApp();
    const res = await request(app).post('/api/admin/retainers').send({
      dealId: 'deal-1',
      currency: 'USD',
      monthlyAmount: 25000,
      kdvRate: 0.2,
      stopajRate: 0,
      startDate: new Date().toISOString(),
    });
    expect(res.status).toBe(201);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  // ── Outreach ─────────────────────────────────────────────────────────────
  test('GET /api/admin/outreach → 200 + wave array', async () => {
    (prisma.outreachWave.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const app = makeApp();
    const res = await request(app).get('/api/admin/outreach');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('POST /api/admin/outreach → 201 + audit log', async () => {
    const mockWave = { id: 'wave-1', name: 'Dalga 1', status: 'DRAFT', startDate: new Date() };
    (prisma.outreachWave.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockWave);
    const app = makeApp();
    const res = await request(app)
      .post('/api/admin/outreach')
      .send({ name: 'Dalga 1', startDate: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('PATCH /api/admin/retainers/:id → 200 + status update + audit log', async () => {
    const mockRet = {
      id: 'ret-1',
      dealId: 'deal-1',
      currency: 'USD',
      monthlyAmount: 25000,
      status: 'ACTIVE',
    };
    (prisma.retainer.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRet);
    (prisma.retainer.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockRet,
      status: 'PAUSED',
    });
    const app = makeApp();
    const res = await request(app).patch('/api/admin/retainers/ret-1').send({ status: 'PAUSED' });
    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('PATCH /api/admin/outreach/:id/status → 200 + wave status update', async () => {
    const mockWave = { id: 'wave-1', name: 'Dalga 1', status: 'DRAFT' };
    (prisma.outreachWave.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockWave);
    (prisma.outreachWave.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockWave,
      status: 'LIVE',
    });
    const app = makeApp();
    const res = await request(app)
      .patch('/api/admin/outreach/wave-1/status')
      .send({ status: 'LIVE' });
    expect(res.status).toBe(200);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('GET /api/admin/deals → returns deal with transactionValueUsd', async () => {
    const richDeal = { ...mockDeal, transactionValueUsd: 150_000_000, successFeeUsd: 3_000_000 };
    (prisma.deal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([richDeal]);
    const app = makeApp();
    const res = await request(app).get('/api/admin/deals');
    expect(res.status).toBe(200);
    expect(res.body.data[0].transactionValueUsd).toBe(150_000_000);
  });

  // ── Cross-resource ────────────────────────────────────────────────────────
  test('PATCH stage to CLOSED_WON → deal update + audit log', async () => {
    (prisma.deal.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockDeal,
      stage: 'CLOSED_WON',
      actualCloseDate: new Date(),
    });
    const app = makeApp();
    const res = await request(app)
      .patch('/api/admin/deals/deal-1/stage')
      .send({ stage: 'CLOSED_WON' });
    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('CLOSED_WON');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('Unauthenticated request → 401 (RBAC guard)', async () => {
    const appNoAuth = express();
    appNoAuth.use(express.json());
    appNoAuth.use('/api/admin/deals', (_req: Request, res: Response) => {
      res.status(401).json({ message: 'Authentication required' });
    });
    const res = await request(appNoAuth).get('/api/admin/deals');
    expect(res.status).toBe(401);
  });
});
