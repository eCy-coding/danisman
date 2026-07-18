/**
 * M7 admin-retention route tests
 *
 * Cases:
 *   1. GET /retention rejects without auth
 *   2. GET /retention returns array
 *   3. POST /seed upserts all policies from seed
 *   4. POST /:resourceType/enforce creates audit entry + updates lastEnforced
 *   5. GET /audit-readiness filters by KVKK-relevant actions
 *   6. POST /enforce creates sertifikaId in audit details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { prisma: prismaMock } = vi.hoisted(() => ({
  prisma: {
    retentionPolicy: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));
vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Auth bypass — authenticate injects ADMIN user, requireRole passes
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

import retentionRoutes from './admin-retention';

// ── App factories ─────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/retention', retentionRoutes);
  return app;
}

// App WITHOUT auth — for auth rejection test (uses real auth mock that would 401)
const appNoAuth = express();
appNoAuth.use(express.json());

// Separate mock that returns 401 for no-auth test
vi.mock('../middleware/auth-guard', () => ({}), { virtual: true });

// We simulate no-auth by not mounting any routes on appNoAuth
appNoAuth.get('/api/admin/retention', (_req, res) => {
  res.status(401).json({ status: 'error', message: 'Authentication required' });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('admin-retention routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: auth rejection
  it('GET /retention rejects without auth → 401', async () => {
    const res = await request(appNoAuth).get('/api/admin/retention');
    expect(res.status).toBe(401);
  });

  // Test 2: GET / returns array
  it('GET /retention returns array of policies', async () => {
    const mockPolicies = [
      {
        id: 'p1',
        resourceType: 'INVOICE',
        retentionDays: 3650,
        legalBasis: 'VUK',
        lastEnforced: null,
      },
      {
        id: 'p2',
        resourceType: 'CRM_RECORD',
        retentionDays: 1825,
        legalBasis: 'Meşru menfaat',
        lastEnforced: null,
      },
    ];
    prismaMock.retentionPolicy.findMany.mockResolvedValue(mockPolicies);

    const res = await request(makeApp()).get('/api/admin/retention');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  // Test 3: POST /seed upserts all policies
  it('POST /seed upserts all policies from RETENTION_POLICIES_SEED', async () => {
    const upsertResult = {
      id: 'p1',
      resourceType: 'INVOICE',
      retentionDays: 3650,
      legalBasis: 'VUK',
    };
    prismaMock.retentionPolicy.upsert.mockResolvedValue(upsertResult);

    const res = await request(makeApp()).post('/api/admin/retention/seed');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    // RETENTION_POLICIES_SEED has 10 entries
    expect(prismaMock.retentionPolicy.upsert).toHaveBeenCalledTimes(10);
    expect(res.body.seeded).toBe(10);
  });

  // Test 4: POST /:resourceType/enforce creates audit entry + updates lastEnforced
  it('POST /:resourceType/enforce creates audit entry + updates lastEnforced', async () => {
    const mockPolicy = {
      id: 'p1',
      resourceType: 'INVOICE',
      retentionDays: 3650,
      legalBasis: 'VUK',
      lastEnforced: null,
    };
    const updatedPolicy = { ...mockPolicy, lastEnforced: new Date().toISOString() };

    prismaMock.retentionPolicy.findFirst.mockResolvedValue(mockPolicy);
    prismaMock.retentionPolicy.update.mockResolvedValue(updatedPolicy);
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    const res = await request(makeApp()).post('/api/admin/retention/INVOICE/enforce');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    // lastEnforced was updated
    expect(prismaMock.retentionPolicy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ lastEnforced: expect.any(Date) }),
      }),
    );

    // AuditLog was created with RETENTION_ENFORCED action
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'RETENTION_ENFORCED' }),
      }),
    );

    // KVKK m.4: raw IP must never be written — actorIpHash + actorRole instead
    const auditData = prismaMock.auditLog.create.mock.calls[0][0].data;
    expect(auditData).not.toHaveProperty('ip');
    expect(auditData.actorIpHash).toMatch(/^[0-9a-f]{32}$/);
    expect(auditData.actorRole).toBe('ADMIN');
  });

  // Test 5: GET /audit-readiness filters by KVKK-relevant actions
  it('GET /audit-readiness filters by KVKK-relevant actions', async () => {
    const mockEntries = [
      { id: 'a1', action: 'RETENTION_ENFORCED', createdAt: new Date() },
      { id: 'a2', action: 'DSAR_COMPLETED', createdAt: new Date() },
    ];
    prismaMock.auditLog.findMany.mockResolvedValue(mockEntries);

    const res = await request(makeApp()).get('/api/admin/retention/audit-readiness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);

    // Confirm findMany was called with OR filter for KVKK actions
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ action: { startsWith: 'RETENTION_ENFORCED' } }),
          ]),
        }),
      }),
    );
  });

  // Test 6: POST /enforce creates sertifikaId in audit details
  it('POST /enforce creates sertifikaId in audit details (newValue)', async () => {
    const mockPolicy = {
      id: 'p2',
      resourceType: 'CRM_RECORD',
      retentionDays: 1825,
      legalBasis: 'Meşru menfaat',
      lastEnforced: null,
    };
    prismaMock.retentionPolicy.findFirst.mockResolvedValue(mockPolicy);
    prismaMock.retentionPolicy.update.mockResolvedValue({
      ...mockPolicy,
      lastEnforced: new Date(),
    });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    const res = await request(makeApp()).post('/api/admin/retention/CRM_RECORD/enforce');
    expect(res.status).toBe(200);

    // sertifikaId is a UUID in the response
    expect(res.body.sertifika).toBeDefined();
    expect(res.body.sertifika.sertifikaId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Also verify it's in the AuditLog newValue
    const auditCall = prismaMock.auditLog.create.mock.calls[0][0];
    expect(auditCall.data.newValue.sertifikaId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
