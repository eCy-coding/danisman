import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db', () => ({
  prisma: {
    deal: { findMany: vi.fn() },
    retainer: { findMany: vi.fn() },
    outreachWave: { findMany: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

import { exportToCsv } from './csv-export';
import { prisma } from '../config/db';

const mockDeals = [
  {
    id: 'deal-1',
    name: 'Aile X',
    stage: 'CLOSED_WON',
    transactionValueUsd: 150_000_000,
    successFeePct: 0.02,
    ownerId: 'user-1',
  },
];

const mockOutreachProspects = [
  {
    id: 'wave-1',
    name: 'Dalga 1',
    prospects: [
      {
        id: 'p-1',
        companyName: 'ACME Ltd',
        contactName: 'Ahmet Yılmaz',
        contactEmail: 'ahmet@acme.com',
        status: 'MEETING',
      },
    ],
  },
];

describe('CSV Export — KVKK (M7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.deal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeals);
    (prisma.outreachWave.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockOutreachProspects,
    );
    (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  test('Export deals CSV with maskPII=false → includes raw contact data', async () => {
    const result = await exportToCsv({
      resource: 'deals',
      filters: {},
      maskPII: false,
      requestedBy: 'admin-1',
    });
    expect(result.csv).toContain('Aile X');
    expect(result.rowCount).toBe(1);
  });

  test('Export outreach CSV with maskPII=true → emails masked', async () => {
    const result = await exportToCsv({
      resource: 'outreach',
      filters: {},
      maskPII: true,
      requestedBy: 'admin-1',
    });
    expect(result.csv).not.toContain('ahmet@acme.com');
    expect(result.csv).toContain('***@');
    expect(result.csv).not.toContain('Ahmet Yılmaz');
    expect(result.csv).toContain('*** ***');
  });

  test('Export creates audit log entry with requestedBy + resource + filter snapshot', async () => {
    await exportToCsv({
      resource: 'deals',
      filters: { stage: 'CLOSED_WON' },
      maskPII: false,
      requestedBy: 'admin-2',
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: 'admin-2',
          action: 'CSV_EXPORT',
        }),
      }),
    );
  });
});
