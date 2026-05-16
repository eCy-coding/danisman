/**
 * P13/1 — Idempotency middleware unit + integration tests.
 * P16/5 — Hardening: redis-backed store + tiered fallback + key charset regex.
 */
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';

// P16/5: Force in-memory fallback path in default tiered store.
vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

import { idempotency, _testing } from './idempotency';

function buildApp(opts?: Parameters<typeof idempotency>[0]) {
  const app = express();
  app.use(express.json());
  app.post('/echo', idempotency(opts), (req, res) => {
    res.status(200).json({ ts: Date.now(), payload: req.body });
  });
  app.post('/strict', idempotency({ ...opts, required: true }), (_req, res) => {
    res.status(201).json({ ok: true });
  });
  return app;
}

describe('idempotency middleware', () => {
  it('passes through write requests without Idempotency-Key (lenient mode)', async () => {
    const app = buildApp();
    const r1 = await request(app).post('/echo').send({ a: 1 });
    expect(r1.status).toBe(200);
    expect(r1.headers['idempotent-replay']).toBeUndefined();
  });

  it('replays same key + same body → cached response', async () => {
    const app = buildApp();
    const key = 'test-key-12345678';
    const r1 = await request(app).post('/echo').set('Idempotency-Key', key).send({ a: 1 });
    expect(r1.status).toBe(200);
    expect(r1.headers['idempotent-replay']).toBeUndefined();

    const r2 = await request(app).post('/echo').set('Idempotency-Key', key).send({ a: 1 });
    expect(r2.status).toBe(200);
    expect(r2.headers['idempotent-replay']).toBe('true');
    expect(r2.body.ts).toBe(r1.body.ts);
  });

  it('rejects same key with different body → 409 IDEMPOTENCY_KEY_MISMATCH', async () => {
    const app = buildApp();
    const key = 'test-key-mismatch';
    await request(app).post('/echo').set('Idempotency-Key', key).send({ a: 1 });
    const r2 = await request(app).post('/echo').set('Idempotency-Key', key).send({ a: 2 });
    expect(r2.status).toBe(409);
    expect(r2.body.code).toBe('IDEMPOTENCY_KEY_MISMATCH');
  });

  it('rejects short / oversized keys → 400 IDEMPOTENCY_KEY_INVALID', async () => {
    const app = buildApp();
    const short = await request(app).post('/echo').set('Idempotency-Key', 'short').send({});
    expect(short.status).toBe(400);
    expect(short.body.code).toBe('IDEMPOTENCY_KEY_INVALID');
  });

  it('strict mode: missing key → 400 IDEMPOTENCY_KEY_REQUIRED', async () => {
    const app = buildApp();
    const r = await request(app).post('/strict').send({});
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('GET requests bypass middleware entirely', async () => {
    const app = express();
    app.use(idempotency());
    app.get('/safe', (_req, res) => res.json({ ok: true }));
    const r = await request(app).get('/safe').set('Idempotency-Key', 'whatever-key');
    expect(r.status).toBe(200);
    expect(r.headers['idempotent-replay']).toBeUndefined();
  });

  it('different routes with same key are isolated', async () => {
    const app = express();
    app.use(express.json());
    app.use(idempotency());
    app.post('/a', (_req, res) => res.json({ from: 'a' }));
    app.post('/b', (_req, res) => res.json({ from: 'b' }));
    const key = 'shared-key-xyz';
    const ra = await request(app).post('/a').set('Idempotency-Key', key).send({});
    const rb = await request(app).post('/b').set('Idempotency-Key', key).send({});
    expect(ra.body.from).toBe('a');
    expect(rb.body.from).toBe('b');
    expect(rb.headers['idempotent-replay']).toBeUndefined();
  });

  // ── P16 BE Track 2 / Aşama 5 — hardening regressions ──────────────────────

  it('P16/5: rejects keys with whitespace / control chars (IDEMPOTENCY_KEY_INVALID)', async () => {
    const app = buildApp();
    const bad = await request(app).post('/echo').set('Idempotency-Key', 'has space here').send({});
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('IDEMPOTENCY_KEY_INVALID');

    const ctrl = await request(app).post('/echo').set('Idempotency-Key', 'key/with/slash').send({});
    expect(ctrl.status).toBe(400);
  });

  it('P16/5: accepts URL-safe alphabet (UUID + dots + colons + underscores)', async () => {
    const app = buildApp();
    const r1 = await request(app)
      .post('/echo')
      .set('Idempotency-Key', '550e8400-e29b-41d4-a716-446655440000')
      .send({});
    expect(r1.status).toBe(200);

    const r2 = await request(app)
      .post('/echo')
      .set('Idempotency-Key', 'stripe:nonce.v1_AbCdEf12345')
      .send({});
    expect(r2.status).toBe(200);
  });

  it('P16/5: RedisIdempotencyStore short-circuits when client is not usable', async () => {
    const store = new _testing.RedisIdempotencyStore();
    // Mocked redis status === 'end' → not usable → get returns null + set no-op.
    expect(await store.get('any-key')).toBeNull();
    await expect(store.set('any-key', { status: 200, body: {}, bodyHash: 'h', storedAt: 0 }, 60_000)).resolves.toBeUndefined();
  });

  it('P16/5: TieredIdempotencyStore writes to volatile even when persistent silently fails', async () => {
    let volatileSet = 0;
    let persistentSet = 0;
    const fakePersistent = {
      async get() {
        return null;
      },
      async set() {
        persistentSet++;
        throw new Error('persistent down');
      },
    };
    const volatile = new _testing.MemoryIdempotencyStore();
    const origSet = volatile.set.bind(volatile);
    volatile.set = async (k, v, ttl) => {
      volatileSet++;
      return origSet(k, v, ttl);
    };
    const tier = new _testing.TieredIdempotencyStore(fakePersistent, volatile);
    await tier.set('k', { status: 200, body: {}, bodyHash: 'h', storedAt: 0 }, 60_000);
    expect(volatileSet).toBe(1);
    expect(persistentSet).toBe(1);
    // And the read path still serves from volatile.
    const got = await tier.get('k');
    expect(got?.status).toBe(200);
  });
});
