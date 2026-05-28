/**
 * P16 BE Track 2 / Aşama 2 — tier rate limiter tests.
 *
 * Verifies identity-key (user vs IP), tier classification, X-RateLimit
 * headers, 429 contract, NAT immunity (two users behind same IP get separate
 * buckets).
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Force in-memory fallback so _tierTesting.reset() is effective (Redis stores cross-run state)
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));
import { classifyTier, tierRateLimit, _tierTesting } from './rate-limit-tier';

interface AuthLikeRequest extends Request {
  user?: { id: string; role: string };
}

function authStub(req: AuthLikeRequest, _res: Response, next: NextFunction): void {
  const uid = req.headers['x-test-user-id'];
  const role = req.headers['x-test-user-role'];
  if (typeof uid === 'string') {
    req.user = { id: uid, role: typeof role === 'string' ? role : 'USER' };
  }
  next();
}

describe('classifyTier', () => {
  it('returns anonymous when no user + no api key', () => {
    const req = { user: undefined, headers: {} } as unknown as AuthLikeRequest;
    expect(classifyTier(req)).toBe('anonymous');
  });

  it('returns admin when role is ADMIN', () => {
    const req = {
      user: { id: 'u', role: 'ADMIN' },
      headers: {},
    } as unknown as AuthLikeRequest;
    expect(classifyTier(req)).toBe('admin');
  });

  it('returns auth for any non-admin authenticated user', () => {
    const req = {
      user: { id: 'u', role: 'USER' },
      headers: {},
    } as unknown as AuthLikeRequest;
    expect(classifyTier(req)).toBe('auth');
  });

  it('returns api-key when X-Api-Key header present', () => {
    const req = {
      user: undefined,
      headers: { 'x-api-key': 'abc' },
    } as unknown as AuthLikeRequest;
    expect(classifyTier(req)).toBe('api-key');
  });
});

describe('tierRateLimit middleware', () => {
  beforeEach(() => _tierTesting.reset());
  afterEach(() => _tierTesting.reset());

  it('anonymous tier: emits X-RateLimit headers + tier', async () => {
    const app = express();
    app.use(
      tierRateLimit({
        budgets: { anonymous: { windowMs: 60_000, maxRequests: 3 } },
      }),
    );
    app.get('/x', (_req, res) => res.json({ ok: true }));
    const r = await request(app).get('/x');
    expect(r.headers['x-ratelimit-limit']).toBe('3');
    expect(Number(r.headers['x-ratelimit-remaining'])).toBe(2);
    expect(Number(r.headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    expect(r.headers['x-ratelimit-tier']).toBe('anonymous');
  });

  it('429 after exceeding budget, includes Retry-After + RATE_LIMIT_EXCEEDED code', async () => {
    const app = express();
    app.use(
      tierRateLimit({
        budgets: { anonymous: { windowMs: 60_000, maxRequests: 2 } },
      }),
    );
    app.get('/x', (_req, res) => res.json({ ok: true }));
    await request(app).get('/x');
    await request(app).get('/x');
    const third = await request(app).get('/x');
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(third.body.tier).toBe('anonymous');
    expect(third.headers['retry-after']).toBeDefined();
  });

  it('auth tier has a larger budget than anonymous', async () => {
    const app = express();
    app.use(authStub);
    app.use(
      tierRateLimit({
        budgets: {
          anonymous: { windowMs: 60_000, maxRequests: 2 },
          auth: { windowMs: 60_000, maxRequests: 10 },
        },
      }),
    );
    app.get('/x', (_req, res) => res.json({ ok: true }));
    const r = await request(app).get('/x').set('X-Test-User-Id', 'alice');
    expect(r.headers['x-ratelimit-tier']).toBe('auth');
    expect(r.headers['x-ratelimit-limit']).toBe('10');
  });

  it('admin tier overrides auth budget when role=ADMIN', async () => {
    const app = express();
    app.use(authStub);
    app.use(
      tierRateLimit({
        budgets: {
          auth: { windowMs: 60_000, maxRequests: 10 },
          admin: { windowMs: 60_000, maxRequests: 100 },
        },
      }),
    );
    app.get('/x', (_req, res) => res.json({ ok: true }));
    const r = await request(app)
      .get('/x')
      .set('X-Test-User-Id', 'admin1')
      .set('X-Test-User-Role', 'ADMIN');
    expect(r.headers['x-ratelimit-tier']).toBe('admin');
    expect(r.headers['x-ratelimit-limit']).toBe('100');
  });

  it('two users behind the same IP get separate buckets (NAT immunity)', async () => {
    const app = express();
    app.use(authStub);
    app.use(
      tierRateLimit({
        budgets: { auth: { windowMs: 60_000, maxRequests: 2 } },
      }),
    );
    app.get('/x', (_req, res) => res.json({ ok: true }));

    // Alice burns her 2-request budget.
    await request(app).get('/x').set('X-Test-User-Id', 'alice');
    await request(app).get('/x').set('X-Test-User-Id', 'alice');
    const aliceThird = await request(app).get('/x').set('X-Test-User-Id', 'alice');
    expect(aliceThird.status).toBe(429);

    // Bob shares the same source IP (supertest loopback) but is NOT throttled.
    const bobFirst = await request(app).get('/x').set('X-Test-User-Id', 'bob');
    expect(bobFirst.status).toBe(200);
    expect(Number(bobFirst.headers['x-ratelimit-remaining'])).toBe(1);
  });

  it('different buckets (paths) accounted independently', async () => {
    const app = express();
    app.use(
      tierRateLimit({
        budgets: { anonymous: { windowMs: 60_000, maxRequests: 1 } },
      }),
    );
    app.get('/a', (_req, res) => res.json({ ok: true }));
    app.get('/b', (_req, res) => res.json({ ok: true }));
    const ra1 = await request(app).get('/a');
    const ra2 = await request(app).get('/a');
    const rb1 = await request(app).get('/b');
    expect(ra1.status).toBe(200);
    expect(ra2.status).toBe(429);
    expect(rb1.status).toBe(200); // separate bucket — fresh budget
  });

  it('per-route bucket override consolidates two paths into one budget', async () => {
    const app = express();
    app.use(
      tierRateLimit({
        bucket: 'shared',
        budgets: { anonymous: { windowMs: 60_000, maxRequests: 2 } },
      }),
    );
    app.get('/a', (_req, res) => res.json({ ok: true }));
    app.get('/b', (_req, res) => res.json({ ok: true }));
    await request(app).get('/a');
    await request(app).get('/b');
    const third = await request(app).get('/a');
    expect(third.status).toBe(429);
  });

  it('skip option bypasses the limiter (P99 — Render health probe)', async () => {
    // Reproduces the failure mode that caused the 429 → instance recover
    // loop: 150 successive probes must all flow through untouched.
    const app = express();
    app.use(
      tierRateLimit({
        budgets: { anonymous: { windowMs: 60_000, maxRequests: 2 } },
        skip: (req) => req.path === '/health',
      }),
    );
    app.get('/health', (_req, res) => res.json({ ok: true }));

    let lastStatus = 0;
    for (let i = 0; i < 150; i += 1) {
      const r = await request(app).get('/health');
      lastStatus = r.status;
    }
    expect(lastStatus).toBe(200);
  });
});
