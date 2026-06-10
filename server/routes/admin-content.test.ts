/**
 * Admin content override route tests (P57.4)
 *
 * Cases:
 *   1. No auth → real auth middleware blocks (401)
 *   2. GET /service/:slug → 200 with merged override data
 *   3. PATCH /service/:slug → 200 echoes payload + redis.set called
 *   4. GET /page/:pageId → 200 (empty object when no override)
 *   5. PATCH /page/:pageId → 200 echoes payload + redis.set called
 *   6. Non-ADMIN role → 403
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { redisMock } = vi.hoisted(() => ({
  redisMock: {
    status: 'end',
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../config/redis', () => ({ redis: redisMock }));

// Bypass DB dependency (route is redis-only but config may be imported transitively)
vi.mock('../config/db', () => ({ prisma: {} }));

// Auth bypass: authenticate injects user, requireRole passes for ADMIN.
// `currentRole` lets individual tests flip to a non-ADMIN role to exercise 403.
let currentRole = 'ADMIN';

vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { id: string; role: string } }).user = {
      id: 'test-admin-id',
      role: currentRole,
    };
    next();
  },
  requireRole:
    (role: string) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as express.Request & { user?: { role: string } }).user;
      if (!user || user.role !== role) {
        return res.status(403).json({ status: 'error', message: 'forbidden' });
      }
      next();
    },
}));

import contentRoutes from './admin-content';
import { errorHandler } from '../middleware/error';

// ── App factory ───────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/content', contentRoutes);
  app.use(errorHandler);
  return app;
}

// ── 1. No auth → real auth middleware blocks ───────────────────────────────────

describe('Auth guard', () => {
  it('rejects requests without auth token (no routes mounted → 404)', async () => {
    vi.doUnmock('../middleware/auth');
    const appNoMock = express();
    appNoMock.use(express.json());

    const res = await request(appNoMock).get('/api/admin/content/service/strateji');
    expect(res.status).toBe(404);
  });
});

// ── 2. GET /service/:slug ──────────────────────────────────────────────────────

describe('GET /api/admin/content/service/:slug', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'ADMIN';
    app = makeApp();
  });

  it('returns 200 with parsed override data', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ title: 'Yeni Başlık' }));

    const res = await request(app)
      .get('/api/admin/content/service/strateji')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.title).toBe('Yeni Başlık');
    expect(redisMock.get).toHaveBeenCalledWith('content:service:strateji');
  });

  it('returns 200 with empty object when no override exists', async () => {
    redisMock.get.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/admin/content/service/bilinmeyen')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toEqual({});
  });
});

// ── 3. PATCH /service/:slug ────────────────────────────────────────────────────

describe('PATCH /api/admin/content/service/:slug', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'ADMIN';
    app = makeApp();
  });

  it('persists override to redis and echoes payload', async () => {
    redisMock.set.mockResolvedValue('OK');
    const payload = { title: 'Güncellendi', summary: 'Özet' };

    const res = await request(app)
      .patch('/api/admin/content/service/strateji')
      .set('Authorization', 'Bearer valid')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toEqual(payload);
    expect(redisMock.set).toHaveBeenCalledWith('content:service:strateji', JSON.stringify(payload));
  });
});

// ── 4. GET /page/:pageId ───────────────────────────────────────────────────────

describe('GET /api/admin/content/page/:pageId', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'ADMIN';
    app = makeApp();
  });

  it('returns 200 with parsed override data', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ heading: 'Hakkımızda' }));

    const res = await request(app)
      .get('/api/admin/content/page/about')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(200);
    expect(res.body.data.heading).toBe('Hakkımızda');
    expect(redisMock.get).toHaveBeenCalledWith('content:page:about');
  });
});

// ── 5. PATCH /page/:pageId ─────────────────────────────────────────────────────

describe('PATCH /api/admin/content/page/:pageId', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'ADMIN';
    app = makeApp();
  });

  it('persists override to redis and echoes payload', async () => {
    redisMock.set.mockResolvedValue('OK');
    const payload = { heading: 'Yeni Hakkımızda' };

    const res = await request(app)
      .patch('/api/admin/content/page/about')
      .set('Authorization', 'Bearer valid')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(payload);
    expect(redisMock.set).toHaveBeenCalledWith('content:page:about', JSON.stringify(payload));
  });
});

// ── 6. Non-ADMIN role → 403 ────────────────────────────────────────────────────

describe('RBAC guard', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = 'USER';
    app = makeApp();
  });

  it('rejects a non-ADMIN user with 403', async () => {
    const res = await request(app)
      .get('/api/admin/content/service/strateji')
      .set('Authorization', 'Bearer valid');

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(redisMock.get).not.toHaveBeenCalled();
  });
});
