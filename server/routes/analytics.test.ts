/**
 * M2 smoke fix — analytics tracking route tests
 *
 * Verifies:
 *   - text/plain JSON body (navigator.sendBeacon) → 201 and parsed payload
 *     reaches prisma.interaction.create (regression for the silent 400 that
 *     dropped every Web Vitals batch: global express.json only parses
 *     application/json, beacon strings ship as text/plain)
 *   - application/json body → 201 (existing contract unchanged)
 *   - missing sessionId → 400 VALIDATION_ERROR
 *   - malformed text/plain body → 400 INVALID_JSON
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { interactionCreateMock, analyticsCreateMock } = vi.hoisted(() => ({
  interactionCreateMock: vi.fn(async () => ({ id: 'int_test' })),
  analyticsCreateMock: vi.fn(async () => ({ id: 'an_test' })),
}));

vi.mock('../config/db', () => ({
  prisma: {
    interaction: { create: interactionCreateMock },
    analytics: { create: analyticsCreateMock },
  },
}));

// rateLimiter + jwt-blacklist pull in the redis client — stub it
vi.mock('../config/redis', () => ({
  redis: {
    status: 'wait',
    multi: () => ({ incr: () => ({}), pexpire: () => ({}), exec: async () => null }),
    eval: async () => null,
  },
}));

import analyticsRoutes from './analytics';
import { errorHandler } from '../middleware/error';

function makeApp() {
  const app = express();
  // Mirrors production: global parser only accepts application/json
  // (server/index.ts); the text/plain handling under test lives inside
  // the analytics router itself.
  app.use(express.json());
  app.use('/api/analytics', analyticsRoutes);
  app.use(errorHandler);
  return app;
}

const webVitalsPayload = {
  sessionId: 'sid-test-1234',
  type: 'WEB_VITALS',
  target: 'web-vitals-batch',
  metadata: {
    metrics: [{ name: 'LCP', value: 1234, rating: 'good', delta: 1234 }],
    timestamp: 1765500000000,
  },
};

describe('POST /api/analytics/interaction', () => {
  beforeEach(() => {
    interactionCreateMock.mockClear();
    analyticsCreateMock.mockClear();
  });

  it('accepts sendBeacon-style text/plain JSON body with 201', async () => {
    const res = await request(makeApp())
      .post('/api/analytics/interaction')
      .set('Content-Type', 'text/plain;charset=UTF-8')
      .send(JSON.stringify(webVitalsPayload));

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'success' });
    expect(interactionCreateMock).toHaveBeenCalledTimes(1);
    expect(interactionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'sid-test-1234',
        type: 'WEB_VITALS',
        target: 'web-vitals-batch',
      }),
    });
  });

  it('accepts application/json body with 201', async () => {
    const res = await request(makeApp())
      .post('/api/analytics/interaction')
      .send({ sessionId: 'sid-json', type: 'CTA_CLICK', target: 'hero-cta' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'success' });
    expect(interactionCreateMock).toHaveBeenCalledTimes(1);
  });

  it('rejects payload without sessionId with 400 VALIDATION_ERROR', async () => {
    const res = await request(makeApp())
      .post('/api/analytics/interaction')
      .send({ type: 'CTA_CLICK', target: 'hero-cta' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(interactionCreateMock).not.toHaveBeenCalled();
  });

  it('rejects malformed text/plain body with 400 INVALID_JSON', async () => {
    const res = await request(makeApp())
      .post('/api/analytics/interaction')
      .set('Content-Type', 'text/plain;charset=UTF-8')
      .send('not-json{');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
    expect(interactionCreateMock).not.toHaveBeenCalled();
  });
});
