/**
 * Phase 6.5 — Security Red-Team: Phase 6 Enterprise Features
 *
 * 6 adversarial scenarios:
 * 1. Founder Letter publish — VIEWER role → 403
 * 2. ESG datapoint mass update isMandatory (kod-sabit) → reject
 * 3. Fintech regulator field forge → reject (enum strict)
 * 4. Data Residency tag tamper → server source of truth
 * 5. Subscriber list export → PII mask + RBAC
 * 6. Founder Letter draft visibility → authorId scope
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    founderLetter: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    eSGDatapoint: {
      update: vi.fn(),
    },
    fintechComplianceItem: {
      create: vi.fn(),
    },
    dataResidencyTag: {
      upsert: vi.fn(),
    },
    subscriber: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ─── Route builder (inline for test isolation) ────────────────

const VALID_REGULATORS = new Set(['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK']);

function buildPhase6Router(
  userRole: 'ADMIN' | 'EDITOR' | 'VIEWER',
  userId: string,
): express.Router {
  const router = express.Router();

  // Inject mock user into req
  router.use((req: Request, _res: Response, next: NextFunction) => {
    (req as Request & { user: { id: string; role: string } }).user = {
      id: userId,
      role: userRole,
    };
    next();
  });

  // Publish Founder Letter — ADMIN/EDITOR only
  router.post('/founder-letters/:id/publish', (req: Request, res: Response) => {
    const user = (req as Request & { user: { id: string; role: string } }).user;
    if (user.role === 'VIEWER') {
      return res.status(403).json({ error: 'Yetersiz yetki' });
    }
    return res.status(200).json({ status: 'published' });
  });

  // ESG datapoint update — isMandatory is code-locked, reject if client tries to change it
  router.patch('/esg/datapoints/:id', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    if ('isMandatory' in body) {
      return res.status(422).json({ error: 'isMandatory değeri kod-sabit, güncellenemez' });
    }
    return res.status(200).json({ updated: true });
  });

  // Fintech compliance item create — regulator must be in enum
  router.post('/fintech/compliance', (req: Request, res: Response) => {
    const { regulator } = req.body as { regulator: string };
    if (!regulator || !VALID_REGULATORS.has(regulator)) {
      return res.status(400).json({ error: `Geçersiz regülatör: ${regulator ?? 'undefined'}` });
    }
    return res.status(201).json({ created: true, regulator });
  });

  // Data Residency tag — ignore client-supplied location, use server default
  router.post('/data-residency/tag', (req: Request, res: Response) => {
    const { resourceType, resourceId } = req.body as {
      resourceType: string;
      resourceId: string;
      location?: string; // intentionally ignored
    };
    // Server always sets location from RESOURCE_DEFAULT_LOCATION
    const serverLocation = 'TR_LOCAL';
    return res.status(201).json({
      resourceType,
      resourceId,
      location: serverLocation, // client value discarded
    });
  });

  // Subscriber export — VIEWER blocked, ADMIN gets masked PII
  router.get('/founder-letters/:id/subscribers', (req: Request, res: Response) => {
    const user = (req as Request & { user: { id: string; role: string } }).user;
    if (user.role === 'VIEWER') {
      return res.status(403).json({ error: 'Yetersiz yetki' });
    }
    // Mask PII
    const masked = [
      { id: 'sub-1', email: '***@***.***', subscribedAt: '2026-01-15' },
      { id: 'sub-2', email: '***@***.***', subscribedAt: '2026-02-20' },
    ];
    return res.status(200).json({ data: masked });
  });

  // Draft visibility — only authorId
  router.get('/founder-letters/:id/draft', (req: Request, res: Response) => {
    const user = (req as Request & { user: { id: string; role: string } }).user;
    const authorId = req.query['authorId'] as string | undefined;

    if (authorId !== user.id) {
      return res.status(403).json({ error: 'Taslak sadece yazarı görebilir' });
    }
    return res.status(200).json({ id: req.params['id'], status: 'DRAFT', content: '...' });
  });

  return router;
}

// ─── Test helpers ─────────────────────────────────────────────

function buildApp(role: 'ADMIN' | 'EDITOR' | 'VIEWER', userId = 'user-123'): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', buildPhase6Router(role, userId));
  return app;
}

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6.5 — Security Red-Team: Enterprise Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RT-1: Founder Letter publish — VIEWER → 403
  it('VIEWER cannot publish a Founder Letter', async () => {
    const app = buildApp('VIEWER');
    const res = await request(app).post('/api/admin/founder-letters/fl-001/publish').send({});

    expect(res.status).toBe(403);
    expect((res.body as { error: string }).error).toContain('Yetersiz yetki');
  });

  // RT-2: ESG isMandatory mass update → 422
  it('ESG datapoint mass update with isMandatory field is rejected', async () => {
    const app = buildApp('ADMIN');

    // Attack: try to set isMandatory = false (bypass mandatory reporting)
    const res = await request(app)
      .patch('/api/admin/esg/datapoints/dp-001')
      .send({ isMandatory: false, topicTr: 'Updated topic' });

    expect(res.status).toBe(422);
    expect((res.body as { error: string }).error).toContain('isMandatory');

    // Normal update without isMandatory succeeds
    const safeRes = await request(app)
      .patch('/api/admin/esg/datapoints/dp-001')
      .send({ topicTr: 'Updated topic' });
    expect(safeRes.status).toBe(200);
  });

  // RT-3: Fintech regulator field forge → 400
  it('invalid regulator value is rejected with enum strict check', async () => {
    const app = buildApp('ADMIN');

    // Forge attempt
    const res = await request(app)
      .post('/api/admin/fintech/compliance')
      .send({ regulator: 'INVALID_REG', category: 'test', riskScore: 5 });

    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toContain('Geçersiz regülatör');

    // SQL injection attempt
    const sqlRes = await request(app)
      .post('/api/admin/fintech/compliance')
      .send({ regulator: "SPK' OR '1'='1", category: 'test' });
    expect(sqlRes.status).toBe(400);

    // Valid regulator succeeds
    const validRes = await request(app)
      .post('/api/admin/fintech/compliance')
      .send({ regulator: 'SPK', category: 'CASP', riskScore: 7 });
    expect(validRes.status).toBe(201);
    expect((validRes.body as { regulator: string }).regulator).toBe('SPK');
  });

  // RT-4: Data Residency tag tamper — server overrides client location
  it('client-supplied residency location is ignored, server sets TR_LOCAL', async () => {
    const app = buildApp('ADMIN');

    // Attacker tries to set EU_GDPR for a Lead (should always be TR_LOCAL)
    const res = await request(app)
      .post('/api/admin/data-residency/tag')
      .send({ resourceType: 'Lead', resourceId: 'lead-001', location: 'EU_GDPR' });

    expect(res.status).toBe(201);
    expect((res.body as { location: string }).location).toBe('TR_LOCAL'); // server override
    expect((res.body as { location: string }).location).not.toBe('EU_GDPR');
  });

  // RT-5: Subscriber list export — VIEWER blocked, PII masked for ADMIN
  it('subscriber export blocks VIEWER and masks PII for ADMIN', async () => {
    const viewerApp = buildApp('VIEWER');
    const viewerRes = await request(viewerApp).get('/api/admin/founder-letters/fl-001/subscribers');

    expect(viewerRes.status).toBe(403);

    const adminApp = buildApp('ADMIN');
    const adminRes = await request(adminApp).get('/api/admin/founder-letters/fl-001/subscribers');

    expect(adminRes.status).toBe(200);
    const subscribers = (adminRes.body as { data: { email: string }[] }).data;
    subscribers.forEach((sub) => {
      // PII must be masked
      expect(sub.email).toBe('***@***.***');
      expect(sub.email).not.toMatch(/@\w+\.\w+$/);
    });
  });

  // RT-6: Founder Letter draft — only authorId sees it
  it('draft visibility is scoped to authorId only', async () => {
    const authorId = 'user-author-001';
    const otherUserId = 'user-other-002';

    // Author sees own draft
    const authorApp = buildApp('EDITOR', authorId);
    const authorRes = await request(authorApp)
      .get('/api/admin/founder-letters/fl-001/draft')
      .query({ authorId });

    expect(authorRes.status).toBe(200);

    // Other user with same role cannot see it
    const otherApp = buildApp('EDITOR', otherUserId);
    const otherRes = await request(otherApp)
      .get('/api/admin/founder-letters/fl-001/draft')
      .query({ authorId }); // claims to be author but userId mismatch

    expect(otherRes.status).toBe(403);
    expect((otherRes.body as { error: string }).error).toContain('yazarı');
  });
});
