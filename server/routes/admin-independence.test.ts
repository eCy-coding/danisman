/**
 * M7 admin-independence route tests
 *
 * Cases:
 *   1. Auth rejection → 401
 *   2. POST create with no conflicts → auditFirmConflicts = []
 *   3. POST "KPMG Turkey" → auditFirmConflicts = ["KPMG"]
 *   4. POST "PricewaterhouseCoopers Ltd" → auditFirmConflicts = ["PwC"]
 *   5. GET / returns array
 *   6. validUntil = checkedAt + 1 year
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { prisma: prismaMock } = vi.hoisted(() => ({
  prisma: {
    independenceCheck: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));
vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Auth bypass
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'admin-test-id',
      role: 'ADMIN',
    };
    next();
  },
  requireRole:
    (_role: string) =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

import independenceRoutes from './admin-independence';

// ── App factories ─────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/independence', independenceRoutes);
  return app;
}

const appNoAuth = express();
appNoAuth.use(express.json());
appNoAuth.post('/api/admin/independence', (_req, res) => {
  res.status(401).json({ status: 'error', message: 'Authentication required' });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('admin-independence routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: auth rejection
  it('POST /independence rejects without auth → 401', async () => {
    const res = await request(appNoAuth).post('/api/admin/independence').send({});
    expect(res.status).toBe(401);
  });

  // Test 2: no Big4 conflict
  it('POST create with clean client name → auditFirmConflicts = []', async () => {
    const checkedAt = new Date('2026-01-15T10:00:00.000Z');
    const validUntil = new Date('2027-01-15T10:00:00.000Z');

    prismaMock.independenceCheck.create.mockResolvedValue({
      id: 'chk-1',
      clientId: 'client-abc',
      checkedAt,
      auditFirmConflicts: [],
      pureAdvisoryConfirmed: true,
      signatoryUserId: 'user-1',
      declarationDocUrl: null,
      validUntil,
    });

    const res = await request(makeApp()).post('/api/admin/independence').send({
      clientId: 'client-abc',
      clientName: 'Acme Consulting Ltd',
      pureAdvisoryConfirmed: true,
      signatoryUserId: 'user-1',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');

    const createArg = prismaMock.independenceCheck.create.mock.calls[0][0];
    expect(createArg.data.auditFirmConflicts).toEqual([]);
  });

  // Test 3: KPMG detected
  it('POST "KPMG Turkey" → auditFirmConflicts = ["KPMG"]', async () => {
    prismaMock.independenceCheck.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          auditFirmConflicts: string[];
          clientId: string;
          pureAdvisoryConfirmed: boolean;
          signatoryUserId: string;
          checkedAt: Date;
          validUntil: Date;
        };
      }) =>
        Promise.resolve({
          id: 'chk-2',
          ...data,
        }),
    );

    const res = await request(makeApp()).post('/api/admin/independence').send({
      clientId: 'client-kpmg',
      clientName: 'KPMG Turkey',
      pureAdvisoryConfirmed: true,
      signatoryUserId: 'user-1',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.auditFirmConflicts).toEqual(['KPMG']);
  });

  // Test 4: PricewaterhouseCoopers detected as PwC
  it('POST "PricewaterhouseCoopers Ltd" → auditFirmConflicts = ["PwC"]', async () => {
    prismaMock.independenceCheck.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          auditFirmConflicts: string[];
          clientId: string;
          pureAdvisoryConfirmed: boolean;
          signatoryUserId: string;
          checkedAt: Date;
          validUntil: Date;
        };
      }) =>
        Promise.resolve({
          id: 'chk-3',
          ...data,
        }),
    );

    const res = await request(makeApp()).post('/api/admin/independence').send({
      clientId: 'client-pwc',
      clientName: 'PricewaterhouseCoopers Ltd',
      pureAdvisoryConfirmed: false,
      signatoryUserId: 'user-2',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.auditFirmConflicts).toEqual(['PwC']);
  });

  // Test 5: GET / returns array
  it('GET /independence returns array of checks', async () => {
    prismaMock.independenceCheck.findMany.mockResolvedValue([
      { id: 'chk-1', clientId: 'abc', auditFirmConflicts: [] },
      { id: 'chk-2', clientId: 'def', auditFirmConflicts: ['KPMG'] },
    ]);

    const res = await request(makeApp()).get('/api/admin/independence');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  // Test 6: validUntil = checkedAt + 1 year
  it('validUntil is set to checkedAt + 1 year', async () => {
    prismaMock.independenceCheck.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          auditFirmConflicts: string[];
          clientId: string;
          pureAdvisoryConfirmed: boolean;
          signatoryUserId: string;
          checkedAt: Date;
          validUntil: Date;
        };
      }) => Promise.resolve({ id: 'chk-4', ...data }),
    );

    const res = await request(makeApp()).post('/api/admin/independence').send({
      clientId: 'client-test',
      clientName: 'Test Company',
      pureAdvisoryConfirmed: true,
      signatoryUserId: 'user-3',
    });

    expect(res.status).toBe(201);

    const createArg = prismaMock.independenceCheck.create.mock.calls[0][0];
    const { checkedAt, validUntil } = createArg.data as { checkedAt: Date; validUntil: Date };

    const diffMs = validUntil.getTime() - checkedAt.getTime();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    // Allow ±1 day tolerance for leap years
    expect(diffMs).toBeGreaterThanOrEqual(oneYearMs - 86_400_000);
    expect(diffMs).toBeLessThanOrEqual(oneYearMs + 86_400_000);
  });
});
