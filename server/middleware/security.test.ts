import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { securityHeaders, corsPreflight } from './security';
import { errorHandler } from './error';

function makeApp() {
  const app = express();
  app.use(securityHeaders);
  app.use(corsPreflight);
  app.use(express.json());
  app.get('/test', (_req, res) => res.json({ ok: true }));
  app.post('/test', (req, res) => res.json(req.body));
  app.use(errorHandler);
  return app;
}

describe('securityHeaders', () => {
  const app = makeApp();

  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('sets X-Request-ID as a UUID', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('sets Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('sets Permissions-Policy with camera=() and microphone=()', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['permissions-policy']).toContain('camera=()');
    expect(res.headers['permissions-policy']).toContain('microphone=()');
  });

  it('sets Content-Security-Policy with default-src none', async () => {
    const res = await request(app).get('/test');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('returns 400 for invalid JSON body', async () => {
    const res = await request(app)
      .post('/test')
      .set('Content-Type', 'application/json')
      .send('{not: valid json}');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });
});

describe('corsPreflight', () => {
  const app = makeApp();

  it('sets Access-Control-Max-Age: 86400 on OPTIONS', async () => {
    const res = await request(app).options('/test');
    expect(res.headers['access-control-max-age']).toBe('86400');
  });

  it('passes GET through without affecting status', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });
});
