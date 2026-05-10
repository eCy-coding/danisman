import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRateLimiter } from './rateLimiter';
import { errorHandler } from './error';

// Force in-memory fallback — no Redis available in test environment.
vi.mock('../config/redis', () => ({
  redis: { status: 'end' },
}));

// Each call creates a limiter with a unique keyId to prevent cross-test
// state pollution in the shared module-level fallbackStore.
function makeApp(
  maxRequests: number,
  windowMs = 60_000,
  keyId = Math.random().toString(36).slice(2),
) {
  const limiter = createRateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: () => `test:${keyId}`,
  });
  const app = express();
  app.use(limiter);
  app.get('/', (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe('createRateLimiter — in-memory fallback', () => {
  it('allows requests within the limit', async () => {
    const app = makeApp(3);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 on the first request that exceeds the limit', async () => {
    const app = makeApp(2);
    await request(app).get('/');
    await request(app).get('/');
    const res = await request(app).get('/');
    expect(res.status).toBe(429);
  });

  it('includes X-RateLimit-Limit header', async () => {
    const app = makeApp(10);
    const res = await request(app).get('/');
    expect(res.headers['x-ratelimit-limit']).toBe('10');
  });

  it('decrements X-RateLimit-Remaining on each request', async () => {
    const app = makeApp(5);
    const r1 = await request(app).get('/');
    expect(r1.headers['x-ratelimit-remaining']).toBe('4');
    const r2 = await request(app).get('/');
    expect(r2.headers['x-ratelimit-remaining']).toBe('3');
  });

  it('includes Retry-After header when 429 is returned', async () => {
    const app = makeApp(1);
    await request(app).get('/');
    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('429 response body includes status=error, message, and retryAfter', async () => {
    const app = makeApp(1);
    await request(app).get('/');
    const res = await request(app).get('/');
    expect(res.body).toMatchObject({
      status: 'error',
      retryAfter: expect.any(Number),
      message: expect.any(String),
    });
  });

  it('custom message appears in 429 body', async () => {
    const keyId = Math.random().toString(36).slice(2);
    const limiter = createRateLimiter({
      windowMs: 60_000,
      maxRequests: 1,
      message: 'Custom limit message',
      keyGenerator: () => `test:custom:${keyId}`,
    });
    const app = express();
    app.use(limiter);
    app.get('/', (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);

    await request(app).get('/');
    const res = await request(app).get('/');
    expect(res.body.message).toBe('Custom limit message');
  });

  it('two independent key scopes do not share counters', async () => {
    const app1 = makeApp(1, 60_000, 'scope-alpha');
    const app2 = makeApp(1, 60_000, 'scope-beta');

    await request(app1).get('/');
    const exhausted = await request(app1).get('/');
    expect(exhausted.status).toBe(429);

    const fresh = await request(app2).get('/');
    expect(fresh.status).toBe(200);
  });
});
