/**
 * BE-14 — /health & /ready integration tests
 *
 * Verifies the production health surface contracts that Render/Railway
 * platforms rely on for liveness and readiness probes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mocks before importing the router ────────────────────────────────────────
vi.mock('../config/redis', () => ({
  redis: {
    status: 'ready',
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

vi.mock('../config/db', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    contactSubmission: { count: vi.fn().mockResolvedValue(0) },
    newsletterSubscriber: { count: vi.fn().mockResolvedValue(0) },
    booking: { count: vi.fn().mockResolvedValue(0) },
    interaction: { count: vi.fn().mockResolvedValue(0) },
  },
}));

vi.mock('../lib/health', () => ({
  checkAllServices: vi
    .fn()
    .mockResolvedValue({ overall: 'ok', services: {} }),
}));

// Avoid pulling the auth/middleware tree that some sub-routers expect
vi.mock('../middleware/auth', () => ({
  authenticate: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
  requireRole: () =>
    (
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => next(),
}));

// ── Build a tiny app that mounts only the router we need ─────────────────────
async function buildApp() {
  const app = express();
  app.use(express.json());
  // Lazy import so vi.mock() above is hoisted in time.
  const { default: router } = await import('./index');
  app.use('/api', router);
  return app;
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with status ok + version + uptime', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'ecypro-api',
    });
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('does NOT touch the database', async () => {
    const { prisma } = await import('../config/db');
    const app = await buildApp();
    await request(app).get('/api/health');
    expect((prisma as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw).not.toHaveBeenCalled();
  });
});

describe('GET /api/ready', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 when DB ping succeeds', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.db).toBe('ok');
  });

  it('returns 503 when DB ping fails', async () => {
    const { prisma } = (await import('../config/db')) as unknown as {
      prisma: { $queryRaw: ReturnType<typeof vi.fn> };
    };
    prisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const app = await buildApp();
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.checks.db).toBe('down');
  });
});

describe('GET /api/docs.json', () => {
  it('returns OpenAPI 3 spec JSON', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('info');
    expect(res.body).toHaveProperty('paths');
  });
});
