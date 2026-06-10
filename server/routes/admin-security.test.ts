/**
 * Admin security route tests (P57.9 — API keys + IP whitelist + login history)
 *
 * Cases:
 *   1. GET /api-keys → 200 list (correct prisma.apiKey.findMany call)
 *   2. RBAC: non-admin role → 403 forbidden
 *   3. DELETE /ip-whitelist/:ip → 204 (redis.srem called)
 *   4. POST /ip-whitelist invalid ip → 400
 *   5. POST /ip-whitelist valid → 201 (redis.sadd called)
 *   6. DELETE /api-keys/:id → 204 (prisma.apiKey.update revokes)
 *   7. GET /login-history → 200 (AUTH_ prefix filter)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock, redisMock, authState } = vi.hoisted(() => ({
  prismaMock: {
    apiKey: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
  redisMock: {
    smembers: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
  },
  // Mutable role lets a single mock cover both the ADMIN happy path and the
  // RBAC-failure case without re-importing the router.
  authState: { role: 'ADMIN' as string },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

vi.mock('../config/redis', () => ({ redis: redisMock }));

// Auth bypass: authenticate injects user; requireRole enforces authState.role
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'test-admin-id',
      role: authState.role,
    };
    next();
  },
  requireRole:
    (role: string) =>
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (authState.role !== role) {
        return res.status(403).json({ status: 'error', message: 'forbidden' });
      }
      next();
    },
}));

import securityRoutes from './admin-security';
import { errorHandler } from '../middleware/error';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/security', securityRoutes);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeApiKey = {
  id: 'key-id-1',
  name: 'CI Token',
  scopes: ['read'],
  lastUsedAt: null,
  expiresAt: null,
  revokedAt: null,
  createdAt: new Date(),
};

const fakeAuthEvent = {
  id: 'audit-id-1',
  action: 'AUTH_LOGIN',
  adminId: 'test-admin-id',
  ip: '10.0.0.1',
  userAgent: 'jest',
  createdAt: new Date(),
};

// ── 1. GET /api-keys → 200 list ────────────────────────────────────────────────

describe('GET /api/admin/security/api-keys', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'ADMIN';
    app = makeApp();
  });

  it('returns 200 with list of API keys', async () => {
    prismaMock.apiKey.findMany.mockResolvedValue([fakeApiKey] as never);

    const res = await request(app)
      .get('/api/admin/security/api-keys')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.items[0].id).toBe('key-id-1');
    expect(res.body.data.total).toBe(1);
    expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 50 }),
    );
  });

  // ── 2. RBAC failure → 403 ────────────────────────────────────────────────────

  it('returns 403 when role is not ADMIN', async () => {
    authState.role = 'USER';

    const res = await request(app)
      .get('/api/admin/security/api-keys')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(403);
    expect(prismaMock.apiKey.findMany).not.toHaveBeenCalled();
  });
});

// ── 6. DELETE /api-keys/:id → 204 ──────────────────────────────────────────────

describe('DELETE /api/admin/security/api-keys/:id', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'ADMIN';
    app = makeApp();
  });

  it('revokes an API key and returns 204', async () => {
    prismaMock.apiKey.update.mockResolvedValue({ ...fakeApiKey, revokedAt: new Date() } as never);

    const res = await request(app)
      .delete('/api/admin/security/api-keys/key-id-1')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(204);
    expect(prismaMock.apiKey.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-id-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });
});

// ── IP whitelist ────────────────────────────────────────────────────────────────

describe('IP whitelist endpoints', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'ADMIN';
    app = makeApp();
  });

  // ── 5. POST valid → 201 ───────────────────────────────────────────────────────

  it('adds a valid IP and returns 201', async () => {
    redisMock.sadd.mockResolvedValue(1 as never);

    const res = await request(app)
      .post('/api/admin/security/ip-whitelist')
      .set('Authorization', 'Bearer valid')
      .send({ ip: '192.168.1.10' });

    expect(res.status).toBe(201);
    expect(res.body.data.ip).toBe('192.168.1.10');
    expect(redisMock.sadd).toHaveBeenCalledWith('admin:ip-whitelist', '192.168.1.10');
  });

  // ── 4. POST invalid → 400 ─────────────────────────────────────────────────────

  it('returns 400 for an invalid IP payload', async () => {
    const res = await request(app)
      .post('/api/admin/security/ip-whitelist')
      .set('Authorization', 'Bearer valid')
      .send({ ip: 'not an ip!!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('invalid ip');
    expect(redisMock.sadd).not.toHaveBeenCalled();
  });

  // ── 3. DELETE /:ip → 204 ──────────────────────────────────────────────────────

  it('removes an IP and returns 204', async () => {
    redisMock.srem.mockResolvedValue(1 as never);

    const res = await request(app)
      .delete('/api/admin/security/ip-whitelist/192.168.1.10')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(204);
    expect(redisMock.srem).toHaveBeenCalledWith('admin:ip-whitelist', '192.168.1.10');
  });
});

// ── 7. GET /login-history → 200 ─────────────────────────────────────────────────

describe('GET /api/admin/security/login-history', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = 'ADMIN';
    app = makeApp();
  });

  it('returns 200 with AUTH_-prefixed audit events', async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([fakeAuthEvent] as never);

    const res = await request(app)
      .get('/api/admin/security/login-history')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.items[0].action).toBe('AUTH_LOGIN');
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { action: { startsWith: 'AUTH_' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  });
});
