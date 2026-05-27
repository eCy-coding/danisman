/**
 * M2 — RBAC routes + middleware hardening tests.
 * Uses supertest + vi.mock for Prisma isolation (no DB required).
 */

import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock heavy deps before imports
vi.mock('../config/db', () => ({
  prisma: {
    permission: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    roleChangeAudit: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    viewAsSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../middleware/auth', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../middleware/auth')>();
  return {
    ...orig,
    authenticate: vi.fn(
      (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    ),
  };
});

vi.mock('../lib/rbac-service', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../lib/rbac-service')>();
  return {
    ...orig,
    hasPermission: vi.fn().mockResolvedValue(true),
    invalidatePermissionCache: vi.fn(),
  };
});

import { prisma } from '../config/db';
import { hasPermission, invalidatePermissionCache } from '../lib/rbac-service';
import { authenticate } from '../middleware/auth';
import adminRbacRouter from './admin-rbac';

function makeApp(userOverride?: { id: string; role: string }) {
  const app = express();
  app.use(express.json());
  // Inject test user
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as unknown as Record<string, unknown>).user = userOverride ?? {
      id: 'admin-1',
      role: 'ADMIN',
    };
    next();
  });
  app.use('/api/admin/rbac', adminRbacRouter);
  return app;
}

const mockPrisma = prisma as unknown as {
  permission: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  rolePermission: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  roleChangeAudit: { create: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  viewAsSession: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  (hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (authenticate as ReturnType<typeof vi.fn>).mockImplementation(
    (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  );
  mockPrisma.permission.findMany.mockResolvedValue([
    {
      id: 'p1',
      key: 'rbac.read',
      resource: 'rbac',
      action: 'read',
      description: 'test',
      isSystem: true,
    },
  ]);
  mockPrisma.rolePermission.findMany.mockResolvedValue([]);
  mockPrisma.rolePermission.findUnique.mockResolvedValue(null);
  mockPrisma.rolePermission.upsert.mockResolvedValue({ id: 'rp1' });
  mockPrisma.roleChangeAudit.create.mockResolvedValue({ id: 'rc1' });
  mockPrisma.roleChangeAudit.findMany.mockResolvedValue([]);
  mockPrisma.viewAsSession.create.mockResolvedValue({ id: 'vs1', viewingAsRole: 'EDITOR' });
  mockPrisma.viewAsSession.findUnique.mockResolvedValue(null);
  mockPrisma.viewAsSession.update.mockResolvedValue({});
});

describe('GET /api/admin/rbac/permissions', () => {
  it('returns permissions list', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/admin/rbac/permissions');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('403 when permission denied', async () => {
    (hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const app = makeApp();
    const res = await request(app).get('/api/admin/rbac/permissions');
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/admin/rbac/matrix — permission toggle', () => {
  it('toggles permission and writes audit log', async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'blog.delete' });
    const app = makeApp();
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: 'EDITOR', permissionKey: 'blog.delete', granted: true });
    expect(res.status).toBe(200);
    expect(mockPrisma.rolePermission.upsert).toHaveBeenCalled();
    expect(mockPrisma.roleChangeAudit.create).toHaveBeenCalled();
    expect(invalidatePermissionCache).toHaveBeenCalled();
  });

  it('rejects when actor is not ADMIN (self-demotion guard path)', async () => {
    const app = makeApp({ id: 'e1', role: 'EDITOR' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: 'ADMIN', permissionKey: 'rbac.write', granted: false });
    expect(res.status).toBe(403);
    expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
  });

  it('rejects ADMIN self-demotion: revoke rbac.write from ADMIN role', async () => {
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: 'ADMIN', permissionKey: 'rbac.write', granted: false });
    expect(res.status).toBe(403);
  });

  it('400 on missing fields', async () => {
    const app = makeApp();
    const res = await request(app).patch('/api/admin/rbac/matrix').send({ role: 'EDITOR' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/rbac/view-as — View-As session', () => {
  it('creates View-As session', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/admin/rbac/view-as')
      .send({ viewingAsRole: 'EDITOR' });
    expect(res.status).toBe(200);
    expect(res.body.data.viewingAsRole).toBe('EDITOR');
  });

  it('400 for invalid role (e.g. ADMIN — cannot simulate admin)', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/admin/rbac/view-as').send({ viewingAsRole: 'ADMIN' });
    expect(res.status).toBe(400);
  });
});

describe('View-As mutation block middleware', () => {
  it('blocks PATCH when X-View-As-Role header present', async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'blog.delete' });
    const app = makeApp();
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .set('X-View-As-Role', 'VIEWER')
      .send({ role: 'EDITOR', permissionKey: 'blog.delete', granted: true });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('VIEW_AS_MUTATION_BLOCKED');
  });

  it('allows GET in View-As mode', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/api/admin/rbac/permissions')
      .set('X-View-As-Role', 'VIEWER');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/rbac/audit', () => {
  it('returns audit log entries', async () => {
    mockPrisma.roleChangeAudit.findMany.mockResolvedValue([
      {
        id: 'a1',
        actorId: 'u1',
        targetRole: 'EDITOR',
        targetPermissionKey: 'blog.delete',
        previousValue: false,
        newValue: true,
        reason: null,
        createdAt: new Date(),
      },
    ]);
    const app = makeApp();
    const res = await request(app).get('/api/admin/rbac/audit');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
