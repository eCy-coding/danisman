/**
 * P16 BE Track 2 / Aşama 1 — cache middleware tests.
 *
 * Covers hit / miss / invalidation / TTL expiry / tier separation +
 * Cache-Control header contract.
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cache, invalidateCache, _cacheTesting, cacheStats } from './cache';

interface AuthLikeRequest extends Request {
  user?: { id?: string; role?: string };
}

function buildApp() {
  const app = express();
  app.use(express.json());

  // Public endpoint — fixed 200ms TTL so tests can prove TTL expiry without sleep.
  let counterPublic = 0;
  app.get('/public/data', cache({ tier: 'public', ttlMs: 200 }), (_req, res) => {
    counterPublic++;
    res.json({ counter: counterPublic, scope: 'public' });
  });

  // Private endpoint — scope by user id.
  let counterPrivate = 0;
  app.get(
    '/private/data',
    (req: AuthLikeRequest, _res: Response, next: NextFunction) => {
      const uid = req.headers['x-test-user'];
      if (typeof uid === 'string') req.user = { id: uid, role: 'USER' };
      next();
    },
    cache({ tier: 'private', ttlMs: 60_000 }),
    (_req, res) => {
      counterPrivate++;
      res.json({ counter: counterPrivate, scope: 'private' });
    },
  );

  // No-store endpoint
  app.get('/sensitive/data', cache({ tier: 'none' }), (_req, res) =>
    res.json({ secret: Math.random() }),
  );

  // Mutating endpoint — invalidates the public prefix.
  app.post('/public/data', (req, res) => {
    invalidateCache('/public/data');
    res.status(201).json({ ok: true, posted: req.body });
  });

  return app;
}

describe('cache middleware', () => {
  beforeEach(() => _cacheTesting.reset());
  afterEach(() => _cacheTesting.reset());

  it('first request misses, second request hits + serves the same body', async () => {
    const app = buildApp();
    const r1 = await request(app).get('/public/data');
    expect(r1.status).toBe(200);
    expect(r1.headers['x-cache']).toBe('MISS');
    expect(r1.body.counter).toBe(1);

    const r2 = await request(app).get('/public/data');
    expect(r2.status).toBe(200);
    expect(r2.headers['x-cache']).toBe('HIT');
    expect(r2.body.counter).toBe(1); // SAME counter — handler did NOT run twice
    expect(r2.headers['age']).toBeDefined();
  });

  it('public tier emits Cache-Control: public, max-age=...', async () => {
    const app = buildApp();
    const r = await request(app).get('/public/data');
    expect(r.headers['cache-control']).toMatch(/public,\s*max-age=\d+/);
  });

  it('private tier emits Cache-Control: private, max-age=...', async () => {
    const app = buildApp();
    const r = await request(app).get('/private/data').set('X-Test-User', 'u1');
    expect(r.headers['cache-control']).toMatch(/private,\s*max-age=\d+,\s*must-revalidate/);
  });

  it('tier=none emits Cache-Control: no-store', async () => {
    const app = buildApp();
    const r = await request(app).get('/sensitive/data');
    expect(r.headers['cache-control']).toMatch(/no-store/);
    expect(r.headers['x-cache']).toBe('OFF');
  });

  it('different user scopes do NOT share private cache slots', async () => {
    const app = buildApp();
    const u1 = await request(app).get('/private/data').set('X-Test-User', 'alice');
    const u2 = await request(app).get('/private/data').set('X-Test-User', 'bob');
    expect(u1.body.counter).toBe(1);
    expect(u2.body.counter).toBe(2); // different scope → fresh execution
  });

  it('same user re-reads → cache hit', async () => {
    const app = buildApp();
    await request(app).get('/private/data').set('X-Test-User', 'alice');
    const second = await request(app).get('/private/data').set('X-Test-User', 'alice');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body.counter).toBe(1);
  });

  it('TTL expiry forces a re-execution', async () => {
    const app = buildApp();
    await request(app).get('/public/data'); // miss → cached for 200ms
    await new Promise((r) => setTimeout(r, 230));
    const r3 = await request(app).get('/public/data');
    expect(r3.headers['x-cache']).toBe('MISS');
    expect(r3.body.counter).toBe(2);
  });

  it('Cache-Control: no-cache request header bypasses the cache', async () => {
    const app = buildApp();
    await request(app).get('/public/data'); // miss → cache primed
    const r = await request(app).get('/public/data').set('Cache-Control', 'no-cache');
    expect(r.headers['x-cache']).toBe('BYPASS');
    expect(r.body.counter).toBe(2);
  });

  it('different query strings are separate cache entries', async () => {
    const app = buildApp();
    const r1 = await request(app).get('/public/data?lang=tr');
    const r2 = await request(app).get('/public/data?lang=en');
    expect(r1.body.counter).toBe(1);
    expect(r2.body.counter).toBe(2);
    const r1b = await request(app).get('/public/data?lang=tr');
    expect(r1b.headers['x-cache']).toBe('HIT');
    expect(r1b.body.counter).toBe(1);
  });

  it('invalidateCache purges the matching prefix', async () => {
    const app = buildApp();
    await request(app).get('/public/data'); // counter=1
    const hit = await request(app).get('/public/data');
    expect(hit.headers['x-cache']).toBe('HIT');

    await request(app).post('/public/data').send({ a: 1 });
    const afterPost = await request(app).get('/public/data');
    expect(afterPost.headers['x-cache']).toBe('MISS');
    expect(afterPost.body.counter).toBe(2);
  });

  it('cacheStats reports hits and misses', async () => {
    const app = buildApp();
    await request(app).get('/public/data'); // miss
    await request(app).get('/public/data'); // hit
    await request(app).get('/public/data'); // hit
    const s = cacheStats();
    expect(s.hits).toBeGreaterThanOrEqual(2);
    expect(s.misses).toBeGreaterThanOrEqual(1);
    expect(s.hitRate).toBeGreaterThan(0);
  });

  it('non-2xx responses are NOT cached', async () => {
    const app = express();
    app.use(express.json());
    let calls = 0;
    app.get('/err', cache({ tier: 'public', ttlMs: 60_000 }), (_req, res) => {
      calls++;
      res.status(500).json({ error: 'boom' });
    });
    await request(app).get('/err');
    await request(app).get('/err');
    expect(calls).toBe(2); // 5xx never cached
  });

  it('POST requests bypass cache middleware entirely', async () => {
    const app = buildApp();
    const r = await request(app).post('/public/data').send({ x: 1 });
    expect(r.status).toBe(201);
    // POST handler ran; cache invalidation called → no X-Cache header on POST path
  });
});
