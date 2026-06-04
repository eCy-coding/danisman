/**
 * Sprint 11 P44-T03 — RBAC matrix + audit log integration tests.
 *
 * Grid: 5 role × 20 gate configurations + negative cases.
 * Validates requireRole middleware AND auditMiddleware log writes.
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../lib/crypto/hashIp', () => ({
  hashIp: vi.fn().mockReturnValue('aabbccddeeff00112233445566778899'),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { requireRole } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { prisma } from '../config/db';

// Typed handle to the mocked auditLog.create
const getMockCreate = () =>
  vi.mocked(
    (prisma as unknown as { auditLog: { create: ReturnType<typeof vi.fn> } }).auditLog.create,
  );

// ─── Test helpers ─────────────────────────────────────────────────────────────

const ALL_ROLES = ['ADMIN', 'EDITOR', 'VIEWER', 'CONSULTANT', 'BLOG_AUTHOR'] as const;
type Role = (typeof ALL_ROLES)[number];

/** Build app with user pre-injected via a setup middleware. */
function makeAppForRole(role: Role, allowedRoles: string | readonly string[], withAudit = false) {
  const app = express();
  app.use(express.json());

  // Inject user before route guards
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as Record<string, unknown>).user = { id: `user-${role}`, role };
    next();
  });

  const guards: express.RequestHandler[] = [requireRole(allowedRoles)];
  if (withAudit) guards.unshift(auditMiddleware({ action: 'test.action', resourceType: 'Test' }));

  app.get('/protected', ...guards, (_req: Request, res: Response) => res.json({ ok: true }));
  return app;
}

// ─── Matrix: 5 roles × 4 gate types ─────────────────────────────────────────

describe('RBAC matrix — requireRole gates', () => {
  // Gate 1: ADMIN only
  describe('gate: requireRole("ADMIN")', () => {
    it.each(ALL_ROLES)('role=%s → correct status', async (role) => {
      const expected = role === 'ADMIN' ? 200 : 403;
      const app = makeAppForRole(role, 'ADMIN');
      const res = await request(app).get('/protected');
      expect(res.status).toBe(expected);
    });
  });

  // Gate 2: ADMIN or EDITOR
  describe('gate: requireRole(["ADMIN", "EDITOR"])', () => {
    const allowed: Role[] = ['ADMIN', 'EDITOR'];
    it.each(ALL_ROLES)('role=%s → correct status', async (role) => {
      const expected = allowed.includes(role) ? 200 : 403;
      const app = makeAppForRole(role, ['ADMIN', 'EDITOR']);
      const res = await request(app).get('/protected');
      expect(res.status).toBe(expected);
    });
  });

  // Gate 3: ADMIN or CONSULTANT
  describe('gate: requireRole(["ADMIN", "CONSULTANT"])', () => {
    const allowed: Role[] = ['ADMIN', 'CONSULTANT'];
    it.each(ALL_ROLES)('role=%s → correct status', async (role) => {
      const expected = allowed.includes(role) ? 200 : 403;
      const app = makeAppForRole(role, ['ADMIN', 'CONSULTANT']);
      const res = await request(app).get('/protected');
      expect(res.status).toBe(expected);
    });
  });

  // Gate 4: ADMIN or VIEWER (read-only access)
  describe('gate: requireRole(["ADMIN", "VIEWER"])', () => {
    const allowed: Role[] = ['ADMIN', 'VIEWER'];
    it.each(ALL_ROLES)('role=%s → correct status', async (role) => {
      const expected = allowed.includes(role) ? 200 : 403;
      const app = makeAppForRole(role, ['ADMIN', 'VIEWER']);
      const res = await request(app).get('/protected');
      expect(res.status).toBe(expected);
    });
  });
});

// ─── Negative cases ───────────────────────────────────────────────────────────

describe('RBAC negative cases', () => {
  it('unauthenticated request → 401 (no req.user)', async () => {
    // No user injection — requireRole sees no req.user
    const app = express();
    app.use(express.json());
    app.get('/protected', requireRole('ADMIN'), (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('unknown role → 403', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as Record<string, unknown>).user = { id: 'u1', role: 'UNKNOWN_ROLE' };
      next();
    });
    app.get('/protected', requireRole(['ADMIN', 'EDITOR']), (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/protected');
    expect(res.status).toBe(403);
  });

  it('ADMIN bypasses any role list (god-mode)', async () => {
    // Even requireRole(['EDITOR']) passes for ADMIN (implicit bypass)
    const app = makeAppForRole('ADMIN', ['EDITOR', 'VIEWER', 'CONSULTANT']);
    const res = await request(app).get('/protected');
    expect(res.status).toBe(200);
  });

  it('403 response body has status=error', async () => {
    const app = makeAppForRole('VIEWER', 'ADMIN');
    const res = await request(app).get('/protected');
    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/permission/i);
  });

  it('401 response body has status=error', async () => {
    const app = express();
    app.use(express.json());
    app.get('/protected', requireRole('ADMIN'), (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/protected');
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/auth/i);
  });
});

// ─── Audit middleware integration ─────────────────────────────────────────────

describe('auditMiddleware — AuditLog writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes AuditLog with result=SUCCESS on 200', async () => {
    const app = makeAppForRole('ADMIN', 'ADMIN', true);
    const res = await request(app).get('/protected');
    expect(res.status).toBe(200);

    // Give fire-and-forget a tick to resolve
    await new Promise((r) => setTimeout(r, 10));

    expect(getMockCreate()).toHaveBeenCalledOnce();
    const data = getMockCreate().mock.calls[0][0].data;
    expect(data.result).toBe('SUCCESS');
    expect(data.action).toBe('test.action');
    expect(data.actorRole).toBe('ADMIN');
    expect(data.actorIpHash).toBeTruthy();
    // Raw IP must never be stored
    expect(data.ip).toBeUndefined();
  });

  it('writes AuditLog with result=DENIED on 403', async () => {
    const app = makeAppForRole('VIEWER', 'ADMIN', true);
    const res = await request(app).get('/protected');
    expect(res.status).toBe(403);

    await new Promise((r) => setTimeout(r, 10));

    expect(getMockCreate()).toHaveBeenCalledOnce();
    const data = getMockCreate().mock.calls[0][0].data;
    expect(data.result).toBe('DENIED');
  });

  it('does not include PII keys in metadata', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as Record<string, unknown>).user = { id: 'u1', role: 'ADMIN' };
      next();
    });
    app.get(
      '/protected',
      auditMiddleware({ action: 'test.pii', resourceType: 'Test' }),
      requireRole('ADMIN'),
      (_req, res) =>
        res.json({ email: 'user@example.com', status: 'ok', token: 'abc', safeField: 'yes' }),
    );

    await request(app).get('/protected');
    await new Promise((r) => setTimeout(r, 10));

    const data = getMockCreate().mock.calls[0][0].data;
    const stored = data.newValue as Record<string, unknown>;
    expect(stored).not.toHaveProperty('email');
    expect(stored).not.toHaveProperty('token');
    expect(stored).toHaveProperty('safeField', 'yes');
  });

  it('does not write raw ip field', async () => {
    const app = makeAppForRole('ADMIN', 'ADMIN', true);
    await request(app).get('/protected');
    await new Promise((r) => setTimeout(r, 10));

    const data = getMockCreate().mock.calls[0]?.[0]?.data ?? {};
    expect(data).not.toHaveProperty('ip');
  });

  it('audit fail does not crash request (fail-soft)', async () => {
    getMockCreate().mockRejectedValueOnce(new Error('DB down'));

    const app = makeAppForRole('ADMIN', 'ADMIN', true);
    const res = await request(app).get('/protected');
    // Request still succeeds despite audit failure
    expect(res.status).toBe(200);
  });

  it('writes actorRole and adminId from req.user', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as Record<string, unknown>).user = { id: 'user-editor-42', role: 'EDITOR' };
      next();
    });
    app.get(
      '/protected',
      auditMiddleware({ action: 'content.update', resourceType: 'Article' }),
      requireRole(['ADMIN', 'EDITOR']),
      (_req, res) => res.json({ ok: true }),
    );

    await request(app).get('/protected');
    await new Promise((r) => setTimeout(r, 10));

    const data = getMockCreate().mock.calls[0][0].data;
    expect(data.adminId).toBe('user-editor-42');
    expect(data.actorRole).toBe('EDITOR');
    expect(data.targetType).toBe('Article');
    expect(data.result).toBe('SUCCESS');
  });
});

// ─── Role downgrade scenario ──────────────────────────────────────────────────

describe('RBAC — role downgrade mid-session', () => {
  it('former ADMIN with VIEWER token gets 403 on admin-only endpoint', async () => {
    // Simulates a token issued after role was downgraded
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      // Token claims say VIEWER (after downgrade from ADMIN)
      (req as unknown as Record<string, unknown>).user = { id: 'former-admin', role: 'VIEWER' };
      next();
    });
    app.get('/admin-only', requireRole('ADMIN'), (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/admin-only');
    expect(res.status).toBe(403);
  });
});
