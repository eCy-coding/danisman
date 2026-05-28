import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { UserRole, Domain, CategoryStatus } from '@prisma/client';

// ── Mocks (hoisted) ───────────────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    insightCategory: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    blogPost: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (
    req: express.Request & { user?: Record<string, unknown> },
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    req.user =
      ((req as unknown as Record<string, unknown>).__mockUser as Record<string, unknown>) ?? null;
    next();
  },
}));

import { adminInsightsCategoriesRouter } from './admin-insights-categories';
import { prisma } from '../config/db';

// ─── Test App Factory ─────────────────────────────────────────────────────────

function makeApp(role: UserRole = UserRole.ADMIN) {
  const app = express();
  app.use(express.json());
  app.use((req: express.Request & { user?: unknown; __mockUser?: unknown }, _res, next) => {
    req.__mockUser = { id: 'user-1', role };
    next();
  });
  app.use('/api/v1/admin/insights/categories', adminInsightsCategoriesRouter);
  return app;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockCategory = {
  id: 'cat-1',
  slug: 'ma-due-diligence',
  slugEn: 'ma-due-diligence-en',
  nameTr: 'M&A Due Diligence',
  nameEn: 'M&A Due Diligence',
  descTr: 'Due diligence süreçleri',
  descEn: 'Due diligence processes',
  domain: Domain.M_A,
  parentId: null,
  parent: null,
  children: [],
  iconName: 'Search',
  colorAccent: null,
  displayOrder: 0,
  status: CategoryStatus.ACTIVE,
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { posts: 12 },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/admin/insights/categories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth', async () => {
    // override auth to inject no user (don't use makeApp — need null user)
    const noAuthApp = express();
    noAuthApp.use(express.json());
    noAuthApp.use((req: express.Request & { __mockUser?: unknown }, _res, next) => {
      (req as Record<string, unknown>).__mockUser = null;
      next();
    });
    noAuthApp.use('/api/v1/admin/insights/categories', adminInsightsCategoriesRouter);

    vi.mocked(prisma.insightCategory.findMany).mockResolvedValue([]);
    vi.mocked(prisma.insightCategory.count).mockResolvedValue(0);

    const res = await request(noAuthApp).get('/api/v1/admin/insights/categories');
    expect(res.status).toBe(401);
  });

  it('returns 403 for USER role', async () => {
    vi.mocked(prisma.insightCategory.findMany).mockResolvedValue([]);
    vi.mocked(prisma.insightCategory.count).mockResolvedValue(0);

    const res = await request(makeApp(UserRole.USER)).get('/api/v1/admin/insights/categories');
    expect(res.status).toBe(403);
  });

  it('VIEWER can read categories', async () => {
    vi.mocked(prisma.insightCategory.findMany).mockResolvedValue([mockCategory] as never);
    vi.mocked(prisma.insightCategory.count).mockResolvedValue(1);

    const res = await request(makeApp(UserRole.VIEWER)).get('/api/v1/admin/insights/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it('filters by domain', async () => {
    vi.mocked(prisma.insightCategory.findMany).mockResolvedValue([mockCategory] as never);
    vi.mocked(prisma.insightCategory.count).mockResolvedValue(1);

    const res = await request(makeApp()).get('/api/v1/admin/insights/categories?domain=M_A');
    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.insightCategory.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ domain: 'M_A' }),
      }),
    );
  });
});

describe('POST /api/v1/admin/insights/categories', () => {
  beforeEach(() => vi.clearAllMocks());

  const validPayload = {
    nameTr: 'Due Diligence',
    domain: 'M_A',
    slug: 'due-diligence',
  };

  it('VIEWER cannot create', async () => {
    const res = await request(makeApp(UserRole.VIEWER))
      .post('/api/v1/admin/insights/categories')
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it('missing nameTr → 400', async () => {
    const res = await request(makeApp())
      .post('/api/v1/admin/insights/categories')
      .send({ domain: 'M_A', slug: 'test' });
    expect(res.status).toBe(400);
  });

  it('missing domain → 400', async () => {
    const res = await request(makeApp())
      .post('/api/v1/admin/insights/categories')
      .send({ nameTr: 'Test', slug: 'test' });
    expect(res.status).toBe(400);
  });

  it('EDITOR can create → 201 with auto-slug', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.insightCategory.create).mockResolvedValue(mockCategory as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .post('/api/v1/admin/insights/categories')
      .send({ nameTr: 'Due Diligence', domain: 'M_A' });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
  });

  it('ADMIN can create → 201', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.insightCategory.create).mockResolvedValue(mockCategory as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const res = await request(makeApp())
      .post('/api/v1/admin/insights/categories')
      .send(validPayload);
    expect(res.status).toBe(201);
  });

  it('duplicate slug → 409', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(mockCategory as never);

    const res = await request(makeApp())
      .post('/api/v1/admin/insights/categories')
      .send(validPayload);
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/v1/admin/insights/categories/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('VIEWER cannot update', async () => {
    const res = await request(makeApp(UserRole.VIEWER))
      .patch('/api/v1/admin/insights/categories/cat-1')
      .send({ nameTr: 'Renamed' });
    expect(res.status).toBe(403);
  });

  it('EDITOR can update → 200', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(mockCategory as never);
    vi.mocked(prisma.insightCategory.update).mockResolvedValue({
      ...mockCategory,
      nameTr: 'Renamed',
    } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .patch('/api/v1/admin/insights/categories/cat-1')
      .send({ nameTr: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.data.nameTr).toBe('Renamed');
  });

  it('non-existent id → 404', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(null);

    const res = await request(makeApp())
      .patch('/api/v1/admin/insights/categories/no-such')
      .send({ nameTr: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/admin/insights/categories/:id (soft archive)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('EDITOR cannot delete', async () => {
    const res = await request(makeApp(UserRole.EDITOR)).delete(
      '/api/v1/admin/insights/categories/cat-1',
    );
    expect(res.status).toBe(403);
  });

  it('ADMIN soft-archives → 200 with status=ARCHIVED', async () => {
    vi.mocked(prisma.insightCategory.findUnique).mockResolvedValue(mockCategory as never);
    vi.mocked(prisma.insightCategory.update).mockResolvedValue({
      ...mockCategory,
      status: CategoryStatus.ARCHIVED,
    } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    const res = await request(makeApp()).delete('/api/v1/admin/insights/categories/cat-1');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ARCHIVED');
  });
});

describe('PATCH /api/v1/admin/insights/categories/reorder (display order)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('EDITOR can reorder → 200', async () => {
    vi.mocked(prisma.insightCategory.updateMany).mockResolvedValue({ count: 2 } as never);

    const res = await request(makeApp(UserRole.EDITOR))
      .patch('/api/v1/admin/insights/categories/reorder')
      .send({
        items: [
          { id: 'cat-1', displayOrder: 0 },
          { id: 'cat-2', displayOrder: 1 },
        ],
      });
    expect(res.status).toBe(200);
  });
});
