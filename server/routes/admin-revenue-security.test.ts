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
import { exportToCsv } from '../lib/csv-export';
import { calculateInvoice } from '../services/billing-calculator';
import { prisma } from '../config/db';

const mockDeal = {
  id: 'deal-sec-1',
  name: 'Güvenlik Testi',
  type: 'SELL_SIDE',
  stage: 'DISCOVERY',
  successFeePct: 0.02,
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/deals', adminDealsRouter);
  return app;
}

describe('Revenue API — Güvenlik Testleri (Phase 2.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.deal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockDeal]);
    (prisma.deal.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeal);
    (prisma.deal.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockDeal);
    (prisma.deal.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockDeal,
      updatedAt: new Date(),
    });
    (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.outreachWave.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  // ── Test 1: CSV export maskPII=true → email maskelenir ────────────────────
  test('CSV export maskPII=true: contactEmail ***@domain.com biçimine maskelenir', async () => {
    (prisma.outreachWave.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'wave-sec-1',
        name: 'Güvenlik Dalgası',
        prospects: [
          {
            id: 'p-sec-1',
            companyName: 'GizliCo',
            contactName: 'Mehmet Gizli',
            contactEmail: 'mehmet@gizlico.com',
            status: 'CONTACTED',
          },
        ],
      },
    ]);

    const result = await exportToCsv({
      resource: 'outreach',
      filters: {},
      maskPII: true,
      requestedBy: 'admin-security',
    });

    // Ham email görünmemeli
    expect(result.csv).not.toContain('mehmet@gizlico.com');
    // Maskeli format: ***@domain.com
    expect(result.csv).toContain('***@gizlico.com');
    // İsim de maskelenmeli
    expect(result.csv).not.toContain('Mehmet Gizli');
    expect(result.csv).toContain('*** ***');
  });

  // ── Test 2: NaN subtotal → throw ──────────────────────────────────────────
  test('Billing calc: NaN subtotal → "Geçersiz finansal değer" hatası fırlatır', () => {
    expect(() => calculateInvoice({ subtotal: NaN, kdvRate: 0.2, stopajRate: 0 })).toThrow(
      'Geçersiz finansal değer',
    );
  });

  // ── Test 3: Infinity input → throw ────────────────────────────────────────
  test('Billing calc: Infinity subtotal → "Geçersiz finansal değer" hatası fırlatır', () => {
    expect(() => calculateInvoice({ subtotal: Infinity, kdvRate: 0.2, stopajRate: 0 })).toThrow(
      'Geçersiz finansal değer',
    );

    expect(() => calculateInvoice({ subtotal: 100_000, kdvRate: Infinity, stopajRate: 0 })).toThrow(
      'Geçersiz finansal değer',
    );

    expect(() =>
      calculateInvoice({ subtotal: 100_000, kdvRate: 0.2, stopajRate: -Infinity }),
    ).toThrow('Geçersiz finansal değer');
  });

  // ── Test 4: SQL enjeksiyonu güvenli — ham string olarak saklanır ──────────
  test("SQL injection: deal name '; DROP TABLE Deal;--' ham string olarak mock'a iletilir", async () => {
    const sqlPayload = "'; DROP TABLE Deal;--";
    const dealWithSqlName = { ...mockDeal, name: sqlPayload };
    (prisma.deal.create as ReturnType<typeof vi.fn>).mockResolvedValue(dealWithSqlName);

    const app = makeApp();
    const res = await request(app)
      .post('/api/admin/deals')
      .send({ name: sqlPayload, type: 'SELL_SIDE', ownerId: 'user-1' });

    expect(res.status).toBe(201);

    // Prisma'nın parameterize queries kullandığını simüle: değer değiştirilmeden geçmeli
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: sqlPayload }),
      }),
    );
  });

  // ── Test 5: Mass assignment — successFeeUsd gövdede gönderilirse yok sayılır
  test("Mass assignment: POST body'de successFeeUsd:9999 → prisma.deal.create'e iletilmez", async () => {
    const app = makeApp();
    await request(app).post('/api/admin/deals').send({
      name: 'Test Deal',
      type: 'SELL_SIDE',
      ownerId: 'user-1',
      successFeeUsd: 9999, // bu alan route tarafından destructure edilmiyor
    });

    // deal.create çağrısı yapıldıysa (400 değilse) successFeeUsd içermemeli
    if ((prisma.deal.create as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
      const callArgs = (prisma.deal.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(callArgs.data).not.toHaveProperty('successFeeUsd');
    }
    // Route successFeeUsd'u destructure etmediği için Prisma'ya ulaşmamalı
  });

  // ── Test 6: PII — deals CSV'de contactName/contactEmail kolonu bulunmaz ───
  test('PII: deals CSV exportu contactName ve contactEmail kolonu içermez', async () => {
    (prisma.deal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockDeal]);

    const result = await exportToCsv({
      resource: 'deals',
      filters: {},
      maskPII: false, // maskPII false olsa bile deals'de bu kolonlar yoktur
      requestedBy: 'admin-security',
    });

    // Header'da contactName veya contactEmail olmamalı
    const headerLine = result.csv.split('\n')[0];
    expect(headerLine).not.toContain('contactName');
    expect(headerLine).not.toContain('contactEmail');
  });
});
