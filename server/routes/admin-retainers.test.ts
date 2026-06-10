/**
 * Admin Retainers route tests
 *
 * Cases:
 *   1. No auth token → 401 (real middleware)
 *   2. Non-admin role → 403 (real middleware)
 *   3. GET /api/admin/retainers → 200 list
 *   4. POST valid → 201 created + audit entry
 *   5. PATCH /:id known id → 200 updated + audit entry
 *   6. PATCH /:id unknown id → 404
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    retainer: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Bypass Redis dependency
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

// Bypass JWT blacklist lookup used by the real authenticate middleware
vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
  blacklistToken: vi.fn().mockResolvedValue(undefined),
}));

// Auth bypass: authenticate injects an ADMIN user, requireRole passes through.
// The 401/403 cases below use a SEPARATE app wired with the real middleware.
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

import { adminRetainersRouter } from './admin-retainers';
import { errorHandler } from '../middleware/error';

// ── App factories ───────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/retainers', adminRetainersRouter);
  app.use(errorHandler);
  return app;
}

// Real-auth app: re-import the middleware module unmocked so the auth/RBAC
// guards actually run (mirrors auth.test.ts JWT helper pattern).
const JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';

function makeToken(userId: string, role = 'USER') {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);
}

async function makeRealAuthApp() {
  const real = await vi.importActual<typeof import('../middleware/auth')>('../middleware/auth');
  const router = express.Router();
  router.use(real.authenticate, real.requireRole('ADMIN'));
  router.get('/', (_req, res) => {
    res.json({ data: [] });
  });
  const app = express();
  app.use(express.json());
  app.use('/api/admin/retainers', router);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeRetainer = {
  id: 'retainer-id-1',
  dealId: 'deal-id-1',
  currency: 'TRY',
  monthlyAmount: 50000,
  kdvRate: 0.2,
  stopajRate: 0,
  startDate: new Date(),
  endDate: null,
  status: 'ACTIVE',
  createdAt: new Date(),
};

// ── 1. No auth → 401 ─────────────────────────────────────────────────────────

describe('Auth guard', () => {
  it('rejects requests without an auth token (real middleware) with 401', async () => {
    const app = await makeRealAuthApp();
    const res = await request(app).get('/api/admin/retainers');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  // ── 2. Non-admin role → 403 ────────────────────────────────────────────────

  it('rejects a non-admin role (real middleware) with 403', async () => {
    const app = await makeRealAuthApp();
    const token = makeToken('user-id-1', 'CLIENT');
    const res = await request(app)
      .get('/api/admin/retainers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
  });
});

// ── 3. GET /api/admin/retainers → list ────────────────────────────────────────

describe('GET /api/admin/retainers', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with the list of retainers ordered by createdAt desc', async () => {
    prismaMock.retainer.findMany.mockResolvedValue([fakeRetainer]);

    const res = await request(app).get('/api/admin/retainers').set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe('retainer-id-1');
    expect(prismaMock.retainer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

// ── 4. POST valid → 201 ───────────────────────────────────────────────────────

describe('POST /api/admin/retainers', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('creates a retainer + audit entry and returns 201', async () => {
    prismaMock.retainer.create.mockResolvedValue(fakeRetainer);
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    const res = await request(app)
      .post('/api/admin/retainers')
      .set('Authorization', 'Bearer valid')
      .send({
        dealId: 'deal-id-1',
        currency: 'TRY',
        monthlyAmount: 50000,
        startDate: '2026-01-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('retainer-id-1');
    expect(prismaMock.retainer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dealId: 'deal-id-1', monthlyAmount: 50000 }),
      }),
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });
});

// ── 5/6. PATCH /:id ────────────────────────────────────────────────────────────

describe('PATCH /api/admin/retainers/:id', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('updates an existing retainer + audit entry and returns 200', async () => {
    prismaMock.retainer.findUnique.mockResolvedValue(fakeRetainer);
    prismaMock.retainer.update.mockResolvedValue({ ...fakeRetainer, status: 'CANCELLED' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    const res = await request(app)
      .patch('/api/admin/retainers/retainer-id-1')
      .set('Authorization', 'Bearer valid')
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(prismaMock.retainer.update).toHaveBeenCalledOnce();
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });

  it('returns 404 when the retainer does not exist', async () => {
    prismaMock.retainer.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/admin/retainers/does-not-exist')
      .set('Authorization', 'Bearer valid')
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Aylık Anlaşma bulunamadı');
    expect(prismaMock.retainer.update).not.toHaveBeenCalled();
  });
});
