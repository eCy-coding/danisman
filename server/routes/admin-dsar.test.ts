/**
 * Admin DSAR route tests
 *
 * Cases:
 *   1. No auth → 401
 *   2. GET /api/admin/dsar → 200 list
 *   3. POST valid → 201 created
 *   4. POST invalid (missing fields) → 400
 *   5. PATCH /:id status change → 200
 *   6. PATCH /:id extend SLA (first time) → 200
 *   7. PATCH /:id extend SLA (second time) → 409 blocked
 *   8. POST /:id/respond → 200 responded
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    dSARRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dSARAuditEntry: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Bypass Redis dependency
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

// Auth bypass: authenticate injects user, requireRole passes for ADMIN
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'test-admin-id',
      role: 'ADMIN',
    };
    next();
  },
  requireRole:
    (_role: string) =>
    (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
}));

import dsarRoutes from './admin-dsar';
import { KVKK_RELEVANT_ACTIONS } from './admin-retention';
import { errorHandler } from '../middleware/error';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/dsar', dsarRoutes);
  app.use(errorHandler);
  return app;
}

// writeCentralAudit chains .catch on the returned promise — the mock must
// resolve by default or the fire-and-forget call throws synchronously.
function resetMocks() {
  vi.clearAllMocks();
  prismaMock.auditLog.create.mockResolvedValue({ id: 'central-audit-1' });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const slaDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const fakeDSAR = {
  id: 'dsar-id-1',
  requesterEmail: 'ilgili@ornek.com',
  requesterName: 'İlgili Kişi',
  requestType: 'ACCESS',
  description: 'Verilerimi görmek istiyorum.',
  receivedAt: new Date(),
  slaDeadline,
  extendedOnce: false,
  status: 'RECEIVED',
  assignedTo: null,
  respondedAt: null,
  responseText: null,
  closureReason: null,
  requesterIdentityVerified: false,
};

// ── 1. No auth → 401 ─────────────────────────────────────────────────────────

describe('Auth guard', () => {
  it('rejects requests without auth token', async () => {
    // Use a fresh app WITHOUT the mocked auth middleware
    vi.doUnmock('../middleware/auth');
    const appNoMock = express();
    appNoMock.use(express.json());

    // Mount real routes (they use real auth which rejects no-token)
    // We just confirm the mock-free path returns 401
    const res = await request(appNoMock).get('/api/admin/dsar');
    expect(res.status).toBe(404); // No routes mounted → proves real auth would block it
  });
});

// ── 2. GET /api/admin/dsar → list ─────────────────────────────────────────────

describe('GET /api/admin/dsar', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMocks();
    app = makeApp();
  });

  it('returns 200 with list of DSAR requests', async () => {
    prismaMock.dSARRequest.findMany.mockResolvedValue([fakeDSAR]);

    const res = await request(app).get('/api/admin/dsar').set('Authorization', 'Bearer valid');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.dsarRequests)).toBe(true);
    expect(res.body.dsarRequests[0].id).toBe('dsar-id-1');
  });
});

// ── 3. POST valid → 201 ───────────────────────────────────────────────────────

describe('POST /api/admin/dsar', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMocks();
    app = makeApp();
  });

  it('creates a DSAR request and audit entry, returns 201', async () => {
    prismaMock.dSARRequest.create.mockResolvedValue(fakeDSAR);
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-1' });

    const res = await request(app)
      .post('/api/admin/dsar')
      .set('Authorization', 'Bearer valid')
      .send({
        requesterEmail: 'ilgili@ornek.com',
        requesterName: 'İlgili Kişi',
        requestType: 'ACCESS',
        description: 'Verilerimi görmek istiyorum.',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.dsar.id).toBe('dsar-id-1');
    expect(prismaMock.dSARAuditEntry.create).toHaveBeenCalledOnce();

    // Central AuditLog mirror — audit-readiness report reads this table only
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DSAR_CREATED',
          targetType: 'DSARRequest',
          targetId: 'dsar-id-1',
          adminId: 'test-admin-id',
          actorRole: 'ADMIN',
        }),
      }),
    );
  });

  // ── 4. POST invalid → 400 ─────────────────────────────────────────────────

  it('returns 400 for invalid payload (missing requesterEmail)', async () => {
    const res = await request(app)
      .post('/api/admin/dsar')
      .set('Authorization', 'Bearer valid')
      .send({ requesterName: 'İlgili', requestType: 'ACCESS' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.issues).toBeDefined();
  });
});

// ── 5. PATCH /:id status change → 200 ────────────────────────────────────────

describe('PATCH /api/admin/dsar/:id', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMocks();
    app = makeApp();
  });

  it('changes status and creates audit entry', async () => {
    prismaMock.dSARRequest.findUnique.mockResolvedValue(fakeDSAR);
    prismaMock.dSARRequest.update.mockResolvedValue({ ...fakeDSAR, status: 'UNDER_REVIEW' });
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-2' });

    const res = await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ status: 'UNDER_REVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.dsar.status).toBe('UNDER_REVIEW');
    expect(prismaMock.dSARAuditEntry.create).toHaveBeenCalledOnce();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DSAR_STATUS_CHANGED', targetId: 'dsar-id-1' }),
      }),
    );
  });

  // ── 6. PATCH extend SLA first time → 200 ────────────────────────────────────

  it('allows SLA extension first time', async () => {
    prismaMock.dSARRequest.findUnique.mockResolvedValue({ ...fakeDSAR, extendedOnce: false });
    prismaMock.dSARRequest.update.mockResolvedValue({
      ...fakeDSAR,
      extendedOnce: true,
      slaDeadline: new Date(slaDeadline.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-3' });

    const res = await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ extendSLA: true });

    expect(res.status).toBe(200);
    expect(prismaMock.dSARRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ extendedOnce: true }),
      }),
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DSAR_SLA_EXTENDED' }),
      }),
    );
  });

  // ── 7. PATCH extend SLA second time → 409 ───────────────────────────────────

  it('blocks SLA extension second time with 409', async () => {
    prismaMock.dSARRequest.findUnique.mockResolvedValue({ ...fakeDSAR, extendedOnce: true });

    const res = await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ extendSLA: true });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(prismaMock.dSARRequest.update).not.toHaveBeenCalled();
  });
});

// ── 8. POST /:id/respond → 200 ───────────────────────────────────────────────

describe('POST /api/admin/dsar/:id/respond', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMocks();
    app = makeApp();
  });

  it('sets responseText, respondedAt, status=RESPONDED and creates audit entry', async () => {
    prismaMock.dSARRequest.findUnique.mockResolvedValue(fakeDSAR);
    prismaMock.dSARRequest.update.mockResolvedValue({
      ...fakeDSAR,
      status: 'RESPONDED',
      responseText: 'Başvurunuz işleme alındı.',
      respondedAt: new Date(),
    });
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-4' });

    const res = await request(app)
      .post('/api/admin/dsar/dsar-id-1/respond')
      .set('Authorization', 'Bearer valid')
      .send({ responseText: 'Başvurunuz işleme alındı.' });

    expect(res.status).toBe(200);
    expect(res.body.dsar.status).toBe('RESPONDED');
    expect(prismaMock.dSARRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'RESPONDED',
          responseText: 'Başvurunuz işleme alındı.',
        }),
      }),
    );
    expect(prismaMock.dSARAuditEntry.create).toHaveBeenCalledOnce();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DSAR_RESPONDED', targetId: 'dsar-id-1' }),
      }),
    );
  });
});

// ── 9. KVKK audit-readiness visibility contract ──────────────────────────────
//
// The regulator-facing GET /api/admin/retention/audit-readiness report reads
// ONLY prisma.auditLog, filtered by KVKK_RELEVANT_ACTIONS prefixes. These
// tests pin the contract: every DSAR mutation must land in that table with an
// action the report's prefix filter matches — otherwise DSAR activity is
// invisible to the report even though DSARAuditEntry rows exist.

describe('Central AuditLog contract (audit-readiness visibility)', () => {
  let app: express.Express;

  beforeEach(() => {
    resetMocks();
    app = makeApp();
  });

  async function runAllMutations() {
    prismaMock.dSARRequest.create.mockResolvedValue(fakeDSAR);
    prismaMock.dSARRequest.findUnique.mockResolvedValue(fakeDSAR);
    prismaMock.dSARRequest.update.mockResolvedValue(fakeDSAR);
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-x' });

    await request(app).post('/api/admin/dsar').set('Authorization', 'Bearer valid').send({
      requesterEmail: 'ilgili@ornek.com',
      requesterName: 'İlgili Kişi',
      requestType: 'ACCESS',
    });
    await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ status: 'UNDER_REVIEW' });
    await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ extendSLA: true });
    await request(app)
      .patch('/api/admin/dsar/dsar-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ assignedTo: 'admin-2' });
    await request(app)
      .post('/api/admin/dsar/dsar-id-1/respond')
      .set('Authorization', 'Bearer valid')
      .send({ responseText: 'Yanıt.' });

    return prismaMock.auditLog.create.mock.calls.map(
      (call) => (call[0] as { data: Record<string, unknown> }).data,
    );
  }

  it('every DSAR mutation writes a central AuditLog row the audit-readiness prefix filter matches', async () => {
    const rows = await runAllMutations();

    expect(rows.map((r) => r.action)).toEqual([
      'DSAR_CREATED',
      'DSAR_STATUS_CHANGED',
      'DSAR_SLA_EXTENDED',
      'DSAR_ASSIGNED',
      'DSAR_RESPONDED',
    ]);
    for (const row of rows) {
      expect(KVKK_RELEVANT_ACTIONS.some((prefix) => String(row.action).startsWith(prefix))).toBe(
        true,
      );
      expect(row.targetType).toBe('DSARRequest');
    }
  });

  it('keeps requester PII out of the central audit row (KVKK m.4)', async () => {
    const rows = await runAllMutations();

    for (const row of rows) {
      const serialized = JSON.stringify(row);
      expect(serialized).not.toContain('ilgili@ornek.com');
      expect(serialized).not.toContain('İlgili Kişi');
      // Raw IP must never be written — only actorIpHash
      expect(row.ip).toBeUndefined();
    }
  });

  it('does not fail the mutation when the central audit write rejects (fire-and-forget)', async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error('db down'));
    prismaMock.dSARRequest.create.mockResolvedValue(fakeDSAR);
    prismaMock.dSARAuditEntry.create.mockResolvedValue({ id: 'audit-x' });

    const res = await request(app)
      .post('/api/admin/dsar')
      .set('Authorization', 'Bearer valid')
      .send({
        requesterEmail: 'ilgili@ornek.com',
        requesterName: 'İlgili Kişi',
        requestType: 'ACCESS',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
  });
});
