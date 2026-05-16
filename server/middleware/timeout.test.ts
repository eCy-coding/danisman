/**
 * P13/1 — Request timeout middleware tests.
 */
import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { requestTimeout } from './timeout';

describe('requestTimeout middleware', () => {
  it('returns 504 when handler exceeds deadline', async () => {
    const app = express();
    app.use(requestTimeout({ ms: 50 }));
    app.get('/slow', async (_req, res) => {
      await new Promise((r) => setTimeout(r, 150));
      // headersSent will be true; res.json would throw — guard:
      if (!res.headersSent) res.json({ ok: true });
    });
    const r = await request(app).get('/slow');
    expect(r.status).toBe(504);
    expect(r.body.code).toBe('REQUEST_TIMEOUT');
  });

  it('passes through fast handlers', async () => {
    const app = express();
    app.use(requestTimeout({ ms: 1000 }));
    app.get('/fast', (_req, res) => res.json({ ok: true }));
    const r = await request(app).get('/fast');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it('skips /api/sse and /api/health by default', async () => {
    const app = express();
    app.use(requestTimeout({ ms: 50 }));
    app.get('/api/health', async (_req, res) => {
      await new Promise((r) => setTimeout(r, 120));
      res.json({ status: 'ok' });
    });
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });

  it('uses uploadMs for multipart requests', async () => {
    const app = express();
    app.use(requestTimeout({ ms: 30, uploadMs: 500 }));
    app.post('/upload', async (_req, res) => {
      await new Promise((r) => setTimeout(r, 100));
      res.json({ uploaded: true });
    });
    const r = await request(app)
      .post('/upload')
      .set('Content-Type', 'multipart/form-data; boundary=xx')
      .send('--xx--');
    expect(r.status).toBe(200);
    expect(r.body.uploaded).toBe(true);
  });
});
