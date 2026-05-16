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

  it('returns 200 when DB ping succeeds, with per-check latency', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    // P16/4 — checks are objects, not strings, and include latencyMs
    expect(res.body.checks.db.status).toBe('ok');
    expect(typeof res.body.checks.db.latencyMs).toBe('number');
    expect(res.body.checks.redis.status).toBe('ok');
    expect(res.body.overall).toBe('ready');
  });

  it('returns 503 with overall=not_ready when DB ping fails', async () => {
    const { prisma } = (await import('../config/db')) as unknown as {
      prisma: { $queryRaw: ReturnType<typeof vi.fn> };
    };
    prisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const app = await buildApp();
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.overall).toBe('not_ready');
    expect(res.body.checks.db.status).toBe('down');
  });

  it('marks sentry as unconfigured when SENTRY_DSN missing', async () => {
    const prevDsn = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    try {
      const app = await buildApp();
      const res = await request(app).get('/api/ready');
      expect(res.body.checks.sentry.status).toBe('unconfigured');
    } finally {
      if (prevDsn !== undefined) process.env.SENTRY_DSN = prevDsn;
    }
  });

  it('marks telegram as unconfigured when TELEGRAM_BOT_TOKEN missing', async () => {
    const prevToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    try {
      const app = await buildApp();
      const res = await request(app).get('/api/ready');
      expect(res.body.checks.telegram.status).toBe('unconfigured');
    } finally {
      if (prevToken !== undefined) process.env.TELEGRAM_BOT_TOKEN = prevToken;
    }
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
