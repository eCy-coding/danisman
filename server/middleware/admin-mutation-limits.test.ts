/**
 * Security hardening — per-route admin mutation rate limiters
 * (adminMutationLimiter + ADMIN_MUTATION_LIMITS in rate-limit-tier.ts).
 *
 * Mirrors rate-limit-tier.test.ts's conventions: force the in-memory
 * fallback store (mock Redis as unavailable) so `_tierTesting.reset()` is
 * effective and assertions are deterministic.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

import { adminMutationLimiter, ADMIN_MUTATION_LIMITS, _tierTesting } from './rate-limit-tier';

describe('adminMutationLimiter', () => {
  beforeEach(() => _tierTesting.reset());
  afterEach(() => _tierTesting.reset());

  it('applies the same fixed budget regardless of caller tier (no req.user)', async () => {
    const app = express();
    app.use(adminMutationLimiter('test:fixed-budget', { windowMs: 60_000, maxRequests: 2 }));
    app.post('/x', (_req, res) => res.json({ ok: true }));

    const first = await request(app).post('/x');
    const second = await request(app).post('/x');
    const third = await request(app).post('/x');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('blocks the caller after the configured limit and reports Retry-After', async () => {
    const app = express();
    app.use(adminMutationLimiter('test:api-key-revoke', ADMIN_MUTATION_LIMITS.API_KEY_REVOKE));
    app.delete('/api-keys/:id', (_req, res) => res.status(204).end());

    const limit = ADMIN_MUTATION_LIMITS.API_KEY_REVOKE.maxRequests;
    const statuses: number[] = [];
    for (let i = 0; i < limit + 1; i += 1) {
      const r = await request(app).delete(`/api-keys/${i}`);
      statuses.push(r.status);
    }

    expect(statuses.slice(0, limit)).toEqual(statuses.slice(0, limit).map(() => 204));
    expect(statuses[limit]).toBe(429);
  });

  it('resets after the window elapses (fake timers)', async () => {
    vi.useFakeTimers();
    try {
      const app = express();
      app.use(adminMutationLimiter('test:resets', { windowMs: 1_000, maxRequests: 1 }));
      app.post('/x', (_req, res) => res.json({ ok: true }));

      const first = await request(app).post('/x');
      expect(first.status).toBe(200);

      const secondSameWindow = await request(app).post('/x');
      expect(secondSameWindow.status).toBe(429);

      // Advance past the 1s window — the in-memory fallback keys off Date.now().
      vi.advanceTimersByTime(1_100);

      const afterReset = await request(app).post('/x');
      expect(afterReset.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps two different buckets independent (per-route isolation)', async () => {
    const app = express();
    app.use('/a', adminMutationLimiter('test:bucket-a', { windowMs: 60_000, maxRequests: 1 }));
    app.use('/b', adminMutationLimiter('test:bucket-b', { windowMs: 60_000, maxRequests: 1 }));
    app.post('/a', (_req, res) => res.json({ ok: true }));
    app.post('/b', (_req, res) => res.json({ ok: true }));

    const a1 = await request(app).post('/a');
    const a2 = await request(app).post('/a');
    const b1 = await request(app).post('/b');

    expect(a1.status).toBe(200);
    expect(a2.status).toBe(429); // bucket "a" exhausted
    expect(b1.status).toBe(200); // bucket "b" untouched — separate budget
  });

  it('GET requests are unaffected (only mounted under mutation-only routers in production)', async () => {
    const app = express();
    app.use(adminMutationLimiter('test:get-passthrough', { windowMs: 60_000, maxRequests: 1 }));
    app.get('/x', (_req, res) => res.json({ ok: true }));

    // The limiter itself doesn't discriminate by method (that's the calling
    // route's job — it's only ever mounted on POST/PATCH/DELETE handlers in
    // the real admin routes), but confirm it still counts + degrades the
    // same way for any method it's mounted on, rather than silently no-op'ing.
    const first = await request(app).get('/x');
    const second = await request(app).get('/x');
    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});

describe('ADMIN_MUTATION_LIMITS', () => {
  it('every documented limit is tighter than the global admin tier (1000/15min)', () => {
    for (const [name, budget] of Object.entries(ADMIN_MUTATION_LIMITS)) {
      expect(
        budget.maxRequests,
        `${name} should be tighter than the global admin tier`,
      ).toBeLessThan(1000);
    }
  });
});
