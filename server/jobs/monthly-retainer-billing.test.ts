import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db', () => ({
  prisma: {
    retainer: { findMany: vi.fn() },
    invoice: { create: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { runMonthlyBilling } from './monthly-retainer-billing';
import { prisma } from '../config/db';

const activeRetainer = {
  id: 'ret-1',
  dealId: 'deal-1',
  currency: 'USD',
  monthlyAmount: 25000,
  kdvRate: 0.2,
  stopajRate: 0,
  status: 'ACTIVE',
  startDate: new Date('2026-01-01'),
};

const pausedRetainer = {
  ...activeRetainer,
  id: 'ret-2',
  status: 'PAUSED',
};

describe('Monthly Billing Cron — M8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  test('Active retainer → creates DRAFT invoice with correct amounts', async () => {
    (prisma.retainer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([activeRetainer]);
    (prisma.invoice.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'inv-1' });

    const result = await runMonthlyBilling({ dryRun: false });

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          retainerId: 'ret-1',
          subtotal: 25000,
          kdv: 5000,
          stopaj: 0,
          total: 30000,
          status: 'DRAFT',
          currency: 'USD',
        }),
      }),
    );
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  test('dryRun=true → no invoice created, no audit log, result.created=0', async () => {
    (prisma.retainer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([activeRetainer]);

    const result = await runMonthlyBilling({ dryRun: true });

    expect(prisma.invoice.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
  });

  test('PAUSED retainer → no invoice created', async () => {
    (prisma.retainer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([pausedRetainer]);

    const result = await runMonthlyBilling({ dryRun: false });

    expect(prisma.invoice.create).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
  });
});
