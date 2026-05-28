/**
 * BE-14 — /health & /ready integration tests
 *
 * Verifies the production health surface contracts that Render/Railway
 * platforms rely on for liveness and readiness probes.
 *
 * P29 — Vitest's 5s default test timeout is tight for the first dynamic
 * import of ./index (full router barrel: Prisma + Sentry + Redis init).
 * On cold sandboxes this exceeded 5s. We do two things to harden:
 *   1. Bump per-file testTimeout to 10s (covers cold-start module init).
 *   2. Defensively stub fetch so a leaking TELEGRAM_BOT_TOKEN can never
 *      cause a real network probe inside this test file.
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// P29 — give the first cold module import enough headroom; all other tests
// are fast since the import is cached.
vi.setConfig({ testTimeout: 10_000 });

// P29 — defensive: prevent any accidental real network probe (Telegram getMe)
// if TELEGRAM_BOT_TOKEN ever leaks into the test environment.
beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
  );
});

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
  checkAllServices: vi.fn().mockResolvedValue({ overall: 'ok', services: {} }),
}));

// Avoid pulling the auth/middleware tree that some sub-routers expect
vi.mock('../middleware/auth', () => ({
  authenticate: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
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
    expect(
      (prisma as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw,
    ).not.toHaveBeenCalled();
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

describe('GET /api/health/preflight', () => {
  // Required runtime env (lead-pipeline integration surface).
  const REQUIRED: Record<string, string> = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    RESEND_API_KEY: 're_LIVE_SECRET_VALUE_ABC',
    NOTION_API_KEY: 'ntn_SECRET_VALUE_DEF',
    NOTION_DB_PROSPECTS: 'prospects-db-id',
  };
  const OPTIONAL: Record<string, string> = {
    NOTION_DB_INTERACTIONS: 'interactions-db-id',
    CALENDLY_WEBHOOK_SIGNING_KEY: 'calendly-secret-key',
    SENTRY_DSN: 'https://sentry.example/123',
    TELEGRAM_BOT_TOKEN: 'telegram-bot-secret-token',
    TELEGRAM_CHAT_ID: '123456',
  };
  const ALL_KEYS = [...Object.keys(REQUIRED), ...Object.keys(OPTIONAL)];

  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    vi.clearAllMocks();
    snapshot = {};
    for (const k of ALL_KEYS) snapshot[k] = process.env[k];
    for (const [k, v] of Object.entries({ ...REQUIRED, ...OPTIONAL })) process.env[k] = v;
  });

  afterEach(() => {
    for (const k of ALL_KEYS) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  it('returns 200 + healthy when all env present and DB ok', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.checks.env.required.ok).toBe(true);
    expect(res.body.checks.env.required.missing).toEqual([]);
    expect(res.body.checks.env.optional.ok).toBe(true);
    expect(res.body.checks.database.ok).toBe(true);
    expect(res.body.checks.notion).toMatchObject({ ok: true, checked: 'env-presence-only' });
    expect(res.body.checks.resend).toMatchObject({ ok: true, checked: 'env-presence-only' });
    expect(typeof res.body.version).toBe('string');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('populates database.latencyMs', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    expect(typeof res.body.checks.database.latencyMs).toBe('number');
    expect(res.body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns 200 + degraded when an optional env var is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.env.required.ok).toBe(true);
    expect(res.body.checks.env.optional.ok).toBe(false);
    expect(res.body.checks.env.optional.missing).toContain('TELEGRAM_BOT_TOKEN');
  });

  it('returns 503 + unhealthy when a required env var is missing', async () => {
    delete process.env.NOTION_API_KEY;
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.checks.env.required.ok).toBe(false);
    expect(res.body.checks.env.required.missing).toContain('NOTION_API_KEY');
  });

  it('returns 503 + unhealthy when the database probe rejects', async () => {
    const { prisma } = (await import('../config/db')) as unknown as {
      prisma: { $queryRaw: ReturnType<typeof vi.fn> };
    };
    prisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unhealthy');
    expect(res.body.checks.database.ok).toBe(false);
    expect(typeof res.body.checks.database.latencyMs).toBe('number');
  });

  it('never leaks token VALUES — only key NAMES appear in the payload', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/health/preflight');
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('SECRET_VALUE');
    expect(serialized).not.toContain('telegram-bot-secret-token');
    expect(serialized).not.toContain('calendly-secret-key');
    expect(serialized).not.toContain('postgresql://');
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
