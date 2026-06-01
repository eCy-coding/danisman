/**
 * P40-T04: UptimeRobot webhook endpoint tests
 *
 * Coverage:
 *   - 503 when UPTIMEROBOT_WEBHOOK_SECRET unset
 *   - 401 on missing / wrong / length-mismatch secret
 *   - 200 on valid secret + telegram dispatch (mocked)
 *   - severity mapping: alertType 1 → error, 2/3 → warn
 *   - context payload shape (source, monitor, alertType, details)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const telegramSpy = vi.fn();

vi.mock('../lib/telegram-alert', () => ({
  sendTelegramAlert: (...args: unknown[]) => {
    telegramSpy(...args);
    return Promise.resolve();
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

let uptimeRouter: import('express').Router;

beforeEach(async () => {
  telegramSpy.mockClear();
  vi.resetModules();
  // re-import to pick up env var changes per-test
  const mod = await import('./uptime-webhook');
  uptimeRouter = mod.default;
});

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/webhooks', uptimeRouter);
  return app;
}

describe('uptime-webhook', () => {
  it('returns 503 when secret env unset', async () => {
    delete process.env.UPTIMEROBOT_WEBHOOK_SECRET;
    const res = await request(buildApp()).post('/api/webhooks/uptime').send({});
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: 'webhook_not_configured' });
  });

  it('returns 401 on missing query secret', async () => {
    process.env.UPTIMEROBOT_WEBHOOK_SECRET = 'super-secret-32-chars-minimum-len';
    const res = await request(buildApp()).post('/api/webhooks/uptime').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 on wrong-length secret (constant-time guard)', async () => {
    process.env.UPTIMEROBOT_WEBHOOK_SECRET = 'super-secret-32-chars-minimum-len';
    const res = await request(buildApp())
      .post('/api/webhooks/uptime?secret=short')
      .send({});
    expect(res.status).toBe(401);
    expect(telegramSpy).not.toHaveBeenCalled();
  });

  it('returns 200 + forwards DOWN as severity=error', async () => {
    process.env.UPTIMEROBOT_WEBHOOK_SECRET = 'super-secret-32-chars-minimum-len';
    const res = await request(buildApp())
      .post('/api/webhooks/uptime?secret=super-secret-32-chars-minimum-len')
      .send({
        monitorFriendlyName: 'EcyPro Main',
        alertType: 1,
        alertTypeFriendlyName: 'Down',
        alertDetails: 'Connection timeout',
        alertDuration: 30,
        monitorID: 12345,
      });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, monitor: 'EcyPro Main', severity: 'error' });

    // Allow microtask for fire-and-forget dispatch
    await new Promise((r) => setImmediate(r));

    expect(telegramSpy).toHaveBeenCalledTimes(1);
    const [severity, summary, context] = telegramSpy.mock.calls[0];
    expect(severity).toBe('error');
    expect(summary).toContain('EcyPro Main');
    expect(summary).toContain('Down');
    expect(context).toMatchObject({
      source: 'uptimerobot',
      monitor: 'EcyPro Main',
      alertType: 1,
      details: 'Connection timeout',
    });
  });

  it('maps UP recovery (alertType=2) to severity=warn', async () => {
    process.env.UPTIMEROBOT_WEBHOOK_SECRET = 'super-secret-32-chars-minimum-len';
    const res = await request(buildApp())
      .post('/api/webhooks/uptime?secret=super-secret-32-chars-minimum-len')
      .send({ monitorFriendlyName: 'EcyPro Main', alertType: 2, alertTypeFriendlyName: 'Up' });
    expect(res.status).toBe(200);
    await new Promise((r) => setImmediate(r));
    expect(telegramSpy.mock.calls[0][0]).toBe('warn');
  });

  it('falls back gracefully when monitorFriendlyName missing', async () => {
    process.env.UPTIMEROBOT_WEBHOOK_SECRET = 'super-secret-32-chars-minimum-len';
    const res = await request(buildApp())
      .post('/api/webhooks/uptime?secret=super-secret-32-chars-minimum-len')
      .send({ monitorURL: 'https://api.ecypro.com/healthz', alertType: 1 });
    expect(res.status).toBe(200);
    expect(res.body.monitor).toBe('https://api.ecypro.com/healthz');
  });
});
