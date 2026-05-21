/**
 * P99 follow-up — integration test for the production mount order.
 *
 * Reproduces the failure mode that caused Render's "Instance failed: HTTP
 * health check failed with status code 429" loop:
 *
 *   1. Per-IP `generalLimiter` mounted at `/api`
 *   2. Tier `tierRateLimiter` mounted at `/api`
 *   3. `/api/v1/health` handler last
 *
 * Without the skip, the tier limiter would 429 after 60 probes per 15min;
 * with the skip + UA detection in place, 150 successive probes (well over
 * any tier budget) must all return 200.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Redis must report not-ready so both limiters fall through to the in-memory
// store — otherwise the test depends on a live Redis container.
vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    eval: vi.fn().mockRejectedValue(new Error('redis disabled in test')),
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

import { generalLimiter, __resetFallbackStoreForTests } from './rateLimiter';
import { tierRateLimiter, _tierTesting } from './rate-limit-tier';

function buildApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use('/api', generalLimiter);
  app.use('/api', tierRateLimiter);
  app.get('/api/v1/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'ok', service: 'ecypro-api' });
  });
  // Sanity foil — a non-health route to confirm the limiter is still active.
  app.get('/api/v1/echo', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('GET /api/v1/health under both rate limiters', () => {
  beforeEach(() => {
    __resetFallbackStoreForTests();
    _tierTesting.reset();
  });
  afterEach(() => {
    __resetFallbackStoreForTests();
    _tierTesting.reset();
  });

  it('survives 150 probes without 429 (path-based skip)', async () => {
    const app = buildApp();
    const statuses: number[] = [];
    for (let i = 0; i < 150; i += 1) {
      const r = await request(app).get('/api/v1/health');
      statuses.push(r.status);
    }
    const nonOk = statuses.filter((s) => s !== 200);
    expect(nonOk).toEqual([]);
  });

  it('survives 150 probes with query string appended (?cb=N)', async () => {
    const app = buildApp();
    const statuses: number[] = [];
    for (let i = 0; i < 150; i += 1) {
      const r = await request(app).get(`/api/v1/health?cb=${i}`);
      statuses.push(r.status);
    }
    expect(statuses.filter((s) => s !== 200)).toEqual([]);
  });

  it('survives 150 probes from Render Go-http-client/1.1 UA on a non-health path', async () => {
    // Render occasionally probes the root path or a fixed URL; the UA-based
    // bypass is the second line of defense.
    const app = buildApp();
    const statuses: number[] = [];
    for (let i = 0; i < 150; i += 1) {
      const r = await request(app).get('/api/v1/echo').set('User-Agent', 'Go-http-client/1.1');
      statuses.push(r.status);
    }
    expect(statuses.filter((s) => s !== 200)).toEqual([]);
  });

  it('STILL throttles ordinary browser traffic (the limiter is not disabled)', async () => {
    const app = buildApp();
    // generalLimiter default is 100/15min; tierRateLimiter anonymous is 60/15min
    // → after ~60 requests we should see a 429 on the non-health route.
    let throttled = false;
    for (let i = 0; i < 200; i += 1) {
      const r = await request(app).get('/api/v1/echo').set('User-Agent', 'Mozilla/5.0 ChromeTest');
      if (r.status === 429) {
        throttled = true;
        break;
      }
    }
    expect(throttled).toBe(true);
  });
});
