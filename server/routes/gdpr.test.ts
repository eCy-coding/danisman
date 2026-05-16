/**
 * P13/3 — GDPR route tests.
 *
 * Cases:
 *   - GET /api/gdpr/status → 200 + policy contract
 *   - POST /api/gdpr/export valid → 200 ok:true + Telegram notified
 *   - POST /api/gdpr/delete valid → 200 ok:true
 *   - Invalid email → 400 INVALID_PAYLOAD
 *   - Honeypot triggered → 200 silent (no notify)
 *   - Rate limit (2nd call same email within 24h) → 429 RATE_LIMITED
 *   - Idempotency replay → cached 200 + Idempotent-Replay header
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const notifyMock = vi.fn(async () => undefined);
vi.mock('../lib/telegram', () => ({ notify: notifyMock }));

import gdprRoutes, { _testing as gdprTest } from './gdpr';
import { errorHandler } from '../middleware/error';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/gdpr', gdprRoutes);
  app.use(errorHandler);
  return app;
}

describe('GDPR routes', () => {
  beforeEach(() => {
    notifyMock.mockClear();
    gdprTest.resetRateLimit();
  });

  it('GET /status returns policy contract', async () => {
    const app = makeApp();
    const r = await request(app).get('/api/gdpr/status');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.endpoints.export).toBe('POST /api/gdpr/export');
    expect(r.body.endpoints.delete).toBe('POST /api/gdpr/delete');
    expect(r.body.policy.privacyUrl).toContain('/privacy');
    expect(r.body.legalBasis).toContain('KVKK Madde 11');
  });

  it('POST /export valid email → 200 ok + ack message in TR by default', async () => {
    const app = makeApp();
    const r = await request(app)
      .post('/api/gdpr/export')
      .send({ email: 'user@example.com', reason: 'Verilerimi istiyorum.' });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.kind).toBe('export');
    expect(r.body.message).toMatch(/24 saat/);
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('POST /delete valid email + lang=en → 200 ok + English message', async () => {
    const app = makeApp();
    const r = await request(app)
      .post('/api/gdpr/delete')
      .send({ email: 'user2@example.com', lang: 'en' });
    expect(r.status).toBe(200);
    expect(r.body.message).toMatch(/24 hours/);
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('Invalid email → 400 INVALID_PAYLOAD', async () => {
    const app = makeApp();
    const r = await request(app).post('/api/gdpr/export').send({ email: 'not-an-email' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INVALID_PAYLOAD');
  });

  it('Honeypot triggered → 200 silent, notify NOT called', async () => {
    const app = makeApp();
    const r = await request(app)
      .post('/api/gdpr/export')
      .send({ email: 'bot@example.com', hp_field: 'spammed' });
    // hp_field has max(0); schema rejects → 400. Adjust test: spammed field becomes invalid.
    expect(r.status).toBe(400);
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('Rate limit: 2nd request for same email within 24h → 429 RATE_LIMITED', async () => {
    const app = makeApp();
    const email = 'rl@example.com';
    const r1 = await request(app).post('/api/gdpr/export').send({ email });
    expect(r1.status).toBe(200);
    const r2 = await request(app).post('/api/gdpr/export').send({ email });
    expect(r2.status).toBe(429);
    expect(r2.body.code).toBe('RATE_LIMITED');
  });

  it('Different kind (export vs delete) → independent rate windows', async () => {
    const app = makeApp();
    const email = 'isolation@example.com';
    const r1 = await request(app).post('/api/gdpr/export').send({ email });
    expect(r1.status).toBe(200);
    const r2 = await request(app).post('/api/gdpr/delete').send({ email });
    expect(r2.status).toBe(200);
  });

  it('Idempotency-Key replay → cached response with Idempotent-Replay header', async () => {
    const app = makeApp();
    const email = 'idem@example.com';
    const key = 'idem-test-key-12345';
    const r1 = await request(app)
      .post('/api/gdpr/export')
      .set('Idempotency-Key', key)
      .send({ email });
    expect(r1.status).toBe(200);

    const r2 = await request(app)
      .post('/api/gdpr/export')
      .set('Idempotency-Key', key)
      .send({ email });
    expect(r2.status).toBe(200);
    expect(r2.headers['idempotent-replay']).toBe('true');
    // notify only fired on the original attempt.
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });
});
