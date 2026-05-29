/**
 * L2-3 — /sentry/health endpoint: echoes active Sentry release tag.
 * Used to verify correct release name is injected at runtime after deploy.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.setConfig({ testTimeout: 10_000 });

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  Handlers: { requestHandler: () => (_: unknown, __: unknown, next: () => void) => next() },
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
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

vi.mock('../config/redis', () => ({
  redis: {
    status: 'ready',
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

vi.mock('../services/telegram', () => ({ sendTelegramAlert: vi.fn() }));
vi.mock('../lib/health', () => ({
  checkAllServices: vi.fn().mockResolvedValue({ overall: 'ok', services: {} }),
}));

vi.mock('../middleware/auth', () => ({
  authenticate: (_: unknown, __: unknown, next: () => void) => next(),
  requireRole: () => (_: unknown, __: unknown, next: () => void) => next(),
}));

async function buildApp() {
  const app = express();
  app.use(express.json());
  const { default: router } = await import('./index');
  app.use('/api', router);
  return app;
}

let app: express.Express;
beforeAll(async () => {
  app = await buildApp();
});

describe('GET /api/sentry/health', () => {
  it('returns ok + release pattern', async () => {
    const res = await request(app).get('/api/sentry/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.release).toBe('string');
    expect(res.body.release).toMatch(/^(ecypro@|unset$)/);
    expect(typeof res.body.sentryConfigured).toBe('boolean');
    expect(typeof res.body.environment).toBe('string');
  });
});
