/**
 * Phase 4 — RBAC Security Red-Team: 7 adversarial scenarios.
 *
 * Each test simulates an attacker attempting to exploit the RBAC system.
 * All 7 must pass (attack blocked) for Phase 4 security gate.
 */

import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';

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
import { hasPermission } from '../lib/rbac-service';
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
  (hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  mockPrisma.permission.findMany.mockResolvedValue([]);
  mockPrisma.rolePermission.findMany.mockResolvedValue([]);
  mockPrisma.rolePermission.findUnique.mockResolvedValue(null);
  mockPrisma.rolePermission.upsert.mockResolvedValue({ id: 'rp1' });
  mockPrisma.roleChangeAudit.create.mockResolvedValue({ id: 'a1' });
  mockPrisma.roleChangeAudit.findMany.mockResolvedValue([]);
  mockPrisma.viewAsSession.create.mockResolvedValue({ id: 'vs1', viewingAsRole: 'EDITOR' });
  mockPrisma.viewAsSession.findUnique.mockResolvedValue(null);
  mockPrisma.viewAsSession.update.mockResolvedValue({});
});

describe('Red-Team: RBAC Adversarial Scenarios', () => {
  // Attack 1: ADMIN self-demotion — revoke rbac.write from ADMIN role
  it('[RT-1] ADMIN cannot revoke own rbac.write (self-demotion guard)', async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'rbac.write' });
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: UserRole.ADMIN, permissionKey: 'rbac.write', granted: false });
    expect(res.status).toBe(403);
    expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.roleChangeAudit.create).not.toHaveBeenCalled();
  });

  // Attack 2: Privilege escalation — VIEWER tries to modify RBAC matrix
  it('[RT-2] VIEWER cannot modify permission matrix (privilege escalation)', async () => {
    // VIEWER does not have rbac.write — simulate permission denied
    (hasPermission as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'blog.delete' });
    const app = makeApp({ id: 'viewer-1', role: 'VIEWER' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: UserRole.EDITOR, permissionKey: 'blog.delete', granted: true });
    expect(res.status).toBe(403);
    expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
  });

  // Attack 3: View-As mutation bypass — forge X-View-As-Role header then attempt POST
  it('[RT-3] View-As mutation blocked — cannot POST /view-as while in View-As mode', async () => {
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    // Attacker sends mutation (PATCH matrix) with View-As header
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .set('X-View-As-Role', 'VIEWER')
      .send({ role: UserRole.EDITOR, permissionKey: 'rbac.write', granted: true });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('VIEW_AS_MUTATION_BLOCKED');
    expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
  });

  // Attack 4: View-As with ADMIN role — escalate privileges via simulation
  it('[RT-4] Cannot start View-As as ADMIN role (only non-admin roles allowed)', async () => {
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    const res = await request(app).post('/api/admin/rbac/view-as').send({ viewingAsRole: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(mockPrisma.viewAsSession.create).not.toHaveBeenCalled();
  });

  // Attack 5: Mass assignment — include isSystem=false to bypass system permission protection
  it('[RT-5] Mass assignment rejected — extra fields (isSystem, id) are ignored', async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'blog.delete' });
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    const res = await request(app).patch('/api/admin/rbac/matrix').send({
      role: UserRole.EDITOR,
      permissionKey: 'blog.delete',
      granted: true,
      isSystem: false, // should be ignored
      id: 'injected-id', // should be ignored
      actorId: 'attacker', // should be ignored — server uses req.user.id
    });
    expect(res.status).toBe(200);
    // Verify upsert was called with server-provided actorId, not attacker
    const upsertCall = (mockPrisma.rolePermission.upsert as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upsertCall[0].create.grantedBy).toBe('admin-1'); // server's req.user.id
  });

  // Attack 6: Audit log forgery — include auditLogId in payload to manipulate log entry
  it('[RT-6] Audit log forgery rejected — server generates audit entry, payload id ignored', async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 'p1', key: 'blog.delete' });
    const app = makeApp({ id: 'admin-1', role: 'ADMIN' });
    await request(app).patch('/api/admin/rbac/matrix').send({
      role: UserRole.EDITOR,
      permissionKey: 'blog.delete',
      granted: true,
      auditLogId: 'forge-this-id', // attacker tries to set audit ID
    });
    // Server must call roleChangeAudit.create (not update/upsert with forged ID)
    expect(mockPrisma.roleChangeAudit.create).toHaveBeenCalledTimes(1);
    const createCall = (mockPrisma.roleChangeAudit.create as ReturnType<typeof vi.fn>).mock
      .calls[0];
    // No 'id' field in create data — Prisma generates it
    expect(createCall[0].data.id).toBeUndefined();
  });

  // Attack 7: Non-ADMIN attempts RBAC change (different actor role, not VIEWER)
  it('[RT-7] EDITOR cannot change RBAC matrix (not authorized)', async () => {
    const app = makeApp({ id: 'editor-1', role: 'EDITOR' });
    const res = await request(app)
      .patch('/api/admin/rbac/matrix')
      .send({ role: UserRole.VIEWER, permissionKey: 'rbac.read', granted: true });
    expect(res.status).toBe(403);
    expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
  });
});
