/**
 * /healthz + /readyz integration tests — Sprint 10 Phase 10B (P46)
 *
 * Verifies:
 *   - liveness path is fast-path (no DB/Redis call)
 *   - readiness 200 happy path with all probes ok
 *   - readiness 503 when DB is down (load balancer signal)
 *   - readiness 200 + `degraded` when Redis is down (graceful)
 *   - readiness 200 when Sentry is unconfigured (presence-only)
 *   - latency budget honored (totalLatencyMs reported)
 *   - rate-limit bypass: `/healthz` + `/readyz` match isHealthProbe()
 *
 * Test harness pattern lifted from existing `server/routes/health.test.ts`
 * (P29 — 10s timeout for cold-start router barrel import, defensive fetch
 * stub to prevent leaking TELEGRAM_BOT_TOKEN probes).
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.setConfig({ testTimeout: 10_000 });

beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
});

// Hoisted mocks must be declared before the router import so probes.ts picks
// up the doubles when its module graph evaluates.
const pingMock = vi.fn();
const queryRawMock = vi.fn();

vi.mock('../config/redis', () => ({
  redis: {
    status: 'ready',
    ping: pingMock,
  },
}));

vi.mock('../config/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

async function buildApp() {
  const app = express();
  app.use(express.json());
  const { default: healthK8sRouter } = await import('./health-k8s');
  app.use('/api', healthK8sRouter);
  return app;
}

describe('GET /healthz (liveness)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pingMock.mockResolvedValue('PONG');
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('returns 200 with status ok + version + uptime + Cache-Control no-store', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/healthz');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'ecypro-api',
    });
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.version).toBe('string');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('does NOT call DB or Redis (liveness fast-path)', async () => {
    const app = await buildApp();
    await request(app).get('/api/healthz');

    expect(queryRawMock).not.toHaveBeenCalled();
    expect(pingMock).not.toHaveBeenCalled();
  });
});

describe('GET /readyz (readiness)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pingMock.mockResolvedValue('PONG');
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('returns 200 + status ok when DB + Redis ok and Sentry configured', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry/0';
    const app = await buildApp();
    const res = await request(app).get('/api/readyz');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.db.status).toBe('ok');
    expect(res.body.checks.redis.status).toBe('ok');
    expect(res.body.checks.sentry.status).toBe('ok');
    expect(typeof res.body.totalLatencyMs).toBe('number');
    expect(res.body.budgets).toMatchObject({ db: 1500, redis: 500 });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('returns 503 + status not_ready when DB is down', async () => {
    queryRawMock.mockRejectedValue(new Error('Connection refused'));
    const app = await buildApp();
    const res = await request(app).get('/api/readyz');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not_ready');
    expect(res.body.checks.db.status).toBe('down');
  });

  it('returns 200 + status degraded when Redis is down (DB ok)', async () => {
    pingMock.mockRejectedValue(new Error('Redis ECONNREFUSED'));
    const app = await buildApp();
    const res = await request(app).get('/api/readyz');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.db.status).toBe('ok');
    expect(res.body.checks.redis.status).toBe('degraded');
  });

  it('reports sentry unconfigured when SENTRY_DSN is unset (still 200)', async () => {
    delete process.env.SENTRY_DSN;
    const app = await buildApp();
    const res = await request(app).get('/api/readyz');

    expect(res.status).toBe(200);
    expect(res.body.checks.sentry.status).toBe('unconfigured');
  });

  it('honors latency budget — totalLatencyMs <= ~3000 even with all timeouts', async () => {
    queryRawMock.mockImplementation(
      () => new Promise(() => {}), // never resolves → DB timeout
    );
    pingMock.mockImplementation(
      () => new Promise(() => {}), // never resolves → Redis timeout
    );
    const app = await buildApp();
    const res = await request(app).get('/api/readyz');

    expect(res.body.totalLatencyMs).toBeLessThanOrEqual(3000);
    // DB never resolved → down → 503
    expect(res.status).toBe(503);
  });
});

describe('isHealthProbe rate-limit bypass coverage', () => {
  it('matches /healthz, /readyz, /api/healthz, /api/readyz, /api/v1/healthz, /api/v1/readyz', async () => {
    const { isHealthProbe } = await import('../middleware/health-probe');
    const matches = (path: string) =>
      isHealthProbe({ originalUrl: path, url: path, get: () => undefined } as unknown as Parameters<
        typeof isHealthProbe
      >[0]);

    expect(matches('/healthz')).toBe(true);
    expect(matches('/readyz')).toBe(true);
    expect(matches('/api/healthz')).toBe(true);
    expect(matches('/api/readyz')).toBe(true);
    expect(matches('/api/v1/healthz')).toBe(true);
    expect(matches('/api/v1/readyz')).toBe(true);
    expect(matches('/api/v1/healthz?foo=bar')).toBe(true);
  });
});
