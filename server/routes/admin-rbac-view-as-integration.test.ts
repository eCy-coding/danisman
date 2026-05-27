/**
 * Phase 4.5 — View-As integration: server-side VAS-2/VAS-3 equivalents.
 * These mirror the E2E assertions that need browser in Playwright
 * but test server behavior directly (no browser required).
 */

import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/db', () => ({
  prisma: {
    permission: { findMany: vi.fn(), findUnique: vi.fn() },
    rolePermission: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    roleChangeAudit: { create: vi.fn(), findMany: vi.fn() },
    viewAsSession: {
      create: vi.fn().mockResolvedValue({ id: 'sess-e2e-1', viewingAsRole: 'EDITOR' }),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
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
import adminRbacRouter from './admin-rbac';

function makeApp(user: { id: string; role: string }) {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as unknown as Record<string, unknown>).user = user;
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
  mockPrisma.permission.findMany.mockResolvedValue([]);
  mockPrisma.rolePermission.findMany.mockResolvedValue([]);
  mockPrisma.viewAsSession.create.mockResolvedValue({ id: 'sess-e2e-1', viewingAsRole: 'EDITOR' });
  mockPrisma.viewAsSession.findUnique.mockResolvedValue({ id: 'sess-e2e-1', actorId: 'admin-e2e' });
  mockPrisma.viewAsSession.update.mockResolvedValue({});
});

describe('VAS integration — server behaviour', () => {
  // VAS-1 equivalent: POST /view-as EDITOR → 200 + sessionId returned
  it('[VAS-1s] POST /view-as EDITOR → 200 + sessionId', async () => {
    const app = makeApp({ id: 'admin-e2e', role: 'ADMIN' });
    const res = await request(app)
      .post('/api/admin/rbac/view-as')
      .send({ viewingAsRole: 'EDITOR' });
    expect(res.status).toBe(200);
    expect(res.body.data.viewingAsRole).toBe('EDITOR');
    expect(res.body.data.sessionId).toBeDefined();
  });

  // VAS-2 equivalent: PATCH with X-View-As-Role → 403 VIEW_AS_MUTATION_BLOCKED
  it('[VAS-2s] PATCH matrix with X-View-As-Role → 403 VIEW_AS_MUTATION_BLOCKED', async () => {
    const app = makeApp({ id: 'admin-e2e', role: 'ADMIN' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .set('X-View-As-Role', 'VIEWER')
      .send({ role: 'EDITOR', permissionKey: 'blog.delete', granted: true });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('VIEW_AS_MUTATION_BLOCKED');
  });

  // VAS-3 equivalent: DELETE /view-as/:id → 200 (session ended)
  it('[VAS-3s] DELETE /view-as/:id → 200 (session ended)', async () => {
    const app = makeApp({ id: 'admin-e2e', role: 'ADMIN' });
    const res = await request(app).delete('/api/admin/rbac/view-as/sess-e2e-1');
    expect(res.status).toBe(200);
    expect(mockPrisma.viewAsSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-e2e-1' },
        data: expect.objectContaining({ endedAt: expect.any(Date) }),
      }),
    );
  });
});
