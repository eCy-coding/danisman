/**
 * Admin Deals route tests
 *
 * Cases:
 *   1. No auth (authenticate rejects) → 401
 *   2. Non-admin (requireRole rejects) → 403
 *   3. GET /api/admin/deals → 200 list
 *   4. POST valid → 201 created + audit entry
 *   5. POST invalid (missing name/type/ownerId) → 400
 *   6. PATCH /:id/stage existing → 200 + audit entry
 *   7. PATCH /:id/stage unknown id → 404
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock, authState } = vi.hoisted(() => ({
  prismaMock: {
    deal: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
  // Mutable switches so individual tests can simulate auth / RBAC failures
  // without re-mocking the module (mirrors the DSAR harness auth bypass).
  authState: {
    authenticated: true,
    roleAllowed: true,
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Bypass Redis dependency
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

// Auth bypass: authenticate injects user, requireRole passes for ADMIN.
// Both honour `authState` so a test can flip them to exercise 401 / 403.
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!authState.authenticated) {
      res.status(401).json({ status: 'error', code: 'UNAUTHORIZED' });
      return;
    }
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'test-admin-id',
      role: 'ADMIN',
    };
    next();
  },
  requireRole:
    (_role: string) =>
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!authState.roleAllowed) {
        res.status(403).json({ status: 'error', code: 'FORBIDDEN' });
        return;
      }
      next();
    },
}));

import { adminDealsRouter } from './admin-deals';
import { errorHandler } from '../middleware/error';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/deals', adminDealsRouter);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeDeal = {
  id: 'deal-id-1',
  name: 'Acme Acquisition',
  type: 'MA',
  stage: 'DISCOVERY',
  ownerId: 'owner-id-1',
  transactionValueUsd: 5_000_000,
  successFeePct: 0.02,
  expectedCloseDate: null,
  actualCloseDate: null,
  closedLostReason: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Auth / RBAC guards ─────────────────────────────────────────────────────────

describe('Auth + RBAC guards', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.authenticated = true;
    authState.roleAllowed = true;
    app = makeApp();
  });

  it('returns 401 when authenticate rejects (no token)', async () => {
    authState.authenticated = false;

    const res = await request(app).get('/api/admin/deals');

    expect(res.status).toBe(401);
    expect(prismaMock.deal.findMany).not.toHaveBeenCalled();
  });

  it('returns 403 when caller is not an ADMIN', async () => {
    authState.roleAllowed = false;

    const res = await request(app).get('/api/admin/deals').set('Authorization', 'Bearer valid');

    expect(res.status).toBe(403);
    expect(prismaMock.deal.findMany).not.toHaveBeenCalled();
  });
});

// ── GET /api/admin/deals ───────────────────────────────────────────────────────

describe('GET /api/admin/deals', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.authenticated = true;
    authState.roleAllowed = true;
    app = makeApp();
  });

  it('returns 200 with list of deals ordered by createdAt desc', async () => {
    prismaMock.deal.findMany.mockResolvedValue([fakeDeal]);

    const res = await request(app).get('/api/admin/deals').set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe('deal-id-1');
    expect(prismaMock.deal.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });
});

// ── POST /api/admin/deals ───────────────────────────────────────────────────────

describe('POST /api/admin/deals', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.authenticated = true;
    authState.roleAllowed = true;
    app = makeApp();
  });

  it('creates a deal + audit entry and returns 201', async () => {
    prismaMock.deal.create.mockResolvedValue(fakeDeal);
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    const res = await request(app)
      .post('/api/admin/deals')
      .set('Authorization', 'Bearer valid')
      .send({ name: 'Acme Acquisition', type: 'MA', ownerId: 'owner-id-1' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('deal-id-1');
    expect(prismaMock.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Acme Acquisition',
          type: 'MA',
          stage: 'DISCOVERY',
          ownerId: 'owner-id-1',
        }),
      }),
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid payload (missing name/type/ownerId)', async () => {
    const res = await request(app)
      .post('/api/admin/deals')
      .set('Authorization', 'Bearer valid')
      .send({ name: 'Only a name' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(prismaMock.deal.create).not.toHaveBeenCalled();
  });
});

// ── PATCH /api/admin/deals/:id/stage ────────────────────────────────────────────

describe('PATCH /api/admin/deals/:id/stage', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.authenticated = true;
    authState.roleAllowed = true;
    app = makeApp();
  });

  it('updates stage + creates audit entry and returns 200', async () => {
    prismaMock.deal.findUnique.mockResolvedValue(fakeDeal);
    prismaMock.deal.update.mockResolvedValue({ ...fakeDeal, stage: 'NEGOTIATION' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    const res = await request(app)
      .patch('/api/admin/deals/deal-id-1/stage')
      .set('Authorization', 'Bearer valid')
      .send({ stage: 'NEGOTIATION' });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('NEGOTIATION');
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns 404 when the deal does not exist', async () => {
    prismaMock.deal.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/admin/deals/unknown-id/stage')
      .set('Authorization', 'Bearer valid')
      .send({ stage: 'NEGOTIATION' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(prismaMock.deal.update).not.toHaveBeenCalled();
  });
});
