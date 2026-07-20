/**
 * Security hardening — admin CSRF double-submit middleware tests.
 *
 * Mirrors the conventions in originGuard.test.ts (express + supertest,
 * one throwaway app per scenario).
 *
 * Enforcement is gated on `CSRF_COOKIE_DOMAIN` (see csrf.ts module header),
 * so this file is split into two top-level suites — "enforcement ON" (env
 * var explicitly set, matching a correctly-configured production API) and
 * "enforcement OFF" (env var unset, matching every preview/staging
 * deployment and a not-yet-configured production one) — plus a shared suite
 * for behavior that doesn't depend on the mode (GET passthrough, cookie
 * issuance shape).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  csrfProtection,
  issueCsrfCookie,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_COOKIE_DOMAIN_ENV_VAR,
} from './csrf';
import { withCsrf, TEST_CSRF_TOKEN } from '../test-utils/csrf';

function makeApp(opts?: Parameters<typeof csrfProtection>[0]) {
  const app = express();
  app.use(express.json());
  // Mirrors the real mount shape (server/routes/index.ts): `/issue` (the
  // login/refresh analogue) is deliberately OUTSIDE the csrfProtection
  // mount — it is the one endpoint that must work with no cookie yet.
  app.post('/issue', (_req, res) => {
    issueCsrfCookie(res);
    res.json({ ok: true });
  });
  app.use(csrfProtection(opts));
  app.get('/admin/dashboard', (_req, res) => res.json({ ok: true }));
  app.post('/admin/security/ip-whitelist', (_req, res) => res.status(201).json({ ok: true }));
  app.delete('/admin/security/api-keys/1', (_req, res) => res.status(204).end());
  app.post('/queues/api/jobs/1/retry', (_req, res) => res.json({ ok: true }));
  return app;
}

// Explicit helpers rather than a beforeEach default so every test's mode is
// obvious at the call site.
function setEnforcementOn(): void {
  process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = '.ecypro.com';
}
function setEnforcementOff(): void {
  delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
}

describe('csrfProtection — mode-independent behavior', () => {
  const originalDomain = process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
  afterEach(() => {
    if (originalDomain === undefined) delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
    else process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = originalDomain;
  });

  it('allows GET without any CSRF cookie/header when enforcement is ON', async () => {
    setEnforcementOn();
    const app = makeApp();
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(200);
  });

  it('allows GET without any CSRF cookie/header when enforcement is OFF', async () => {
    setEnforcementOff();
    const app = makeApp();
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(200);
  });

  it('bypasses the check for an exempted prefix regardless of mode (Bull-Board UI)', async () => {
    setEnforcementOn();
    const app = makeApp({ exempt: ['/queues'] });
    const res = await request(app).post('/queues/api/jobs/1/retry').send({});
    expect(res.status).toBe(200);
  });
});

describe('csrfProtection — enforcement ON (CSRF_COOKIE_DOMAIN set)', () => {
  const originalDomain = process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];

  beforeEach(() => setEnforcementOn());
  afterEach(() => {
    if (originalDomain === undefined) delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
    else process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = originalDomain;
  });

  it('rejects POST with neither cookie nor header — 403 CSRF_TOKEN_INVALID', async () => {
    const app = makeApp();
    const res = await request(app).post('/admin/security/ip-whitelist').send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects POST with header but no cookie', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set(CSRF_HEADER_NAME, TEST_CSRF_TOKEN)
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects POST with cookie but no header', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}`)
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects POST when cookie and header values do not match', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', `${CSRF_COOKIE_NAME}=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)
      .set(CSRF_HEADER_NAME, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects when cookie/header differ only in length (no false-positive prefix match)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}`)
      .set(CSRF_HEADER_NAME, TEST_CSRF_TOKEN.slice(0, -1))
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('accepts POST when cookie and header match', async () => {
    const app = makeApp();
    const res = await withCsrf(request(app).post('/admin/security/ip-whitelist')).send({
      ip: '1.2.3.4',
    });
    expect(res.status).toBe(201);
  });

  it('accepts DELETE when cookie and header match', async () => {
    const app = makeApp();
    const res = await withCsrf(request(app).delete('/admin/security/api-keys/1'));
    expect(res.status).toBe(204);
  });

  it('is case-insensitive on the header name (HTTP headers are case-insensitive)', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', `${CSRF_COOKIE_NAME}=${TEST_CSRF_TOKEN}`)
      .set('X-CSRF-TOKEN', TEST_CSRF_TOKEN) // supertest/superagent lower-cases anyway
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(201);
  });

  it('still guards unrelated (non-exempt) paths when an exempt list is configured', async () => {
    const app = makeApp({ exempt: ['/queues'] });
    const res = await request(app).post('/admin/security/ip-whitelist').send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
  });
});

describe('csrfProtection — enforcement OFF (CSRF_COOKIE_DOMAIN unset, e.g. preview deploys)', () => {
  const originalDomain = process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];

  beforeEach(() => setEnforcementOff());
  afterEach(() => {
    if (originalDomain === undefined) delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
    else process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = originalDomain;
  });

  it('allows POST through with no cookie and no header — Origin guard is the active defense', async () => {
    const app = makeApp();
    const res = await request(app).post('/admin/security/ip-whitelist').send({ ip: '1.2.3.4' });
    expect(res.status).toBe(201);
  });

  it('allows DELETE through with no cookie and no header', async () => {
    const app = makeApp();
    const res = await request(app).delete('/admin/security/api-keys/1');
    expect(res.status).toBe(204);
  });

  it('still rejects a PRESENT but mismatched header — a wrong token is always a signal', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', `${CSRF_COOKIE_NAME}=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)
      .set(CSRF_HEADER_NAME, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('still rejects a PRESENT header with no matching cookie', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/admin/security/ip-whitelist')
      .set(CSRF_HEADER_NAME, TEST_CSRF_TOKEN)
      .send({ ip: '1.2.3.4' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('still accepts a matching cookie + header (clients that CAN read the cookie keep working)', async () => {
    const app = makeApp();
    const res = await withCsrf(request(app).post('/admin/security/ip-whitelist')).send({
      ip: '1.2.3.4',
    });
    expect(res.status).toBe(201);
  });
});

describe('issueCsrfCookie', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalDomain = process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalDomain === undefined) delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
    else process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = originalDomain;
  });

  it('sets a non-httpOnly, SameSite=Strict, Path=/ cookie the client can echo back', async () => {
    const app = makeApp();
    const res = await request(app).post('/issue');
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(setCookie).toBeDefined();
    const cookie = setCookie!.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
    expect(cookie).toBeDefined();
    expect(cookie).toContain('Path=/');
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).not.toMatch(/HttpOnly/i);
  });

  it('is issued even when enforcement is OFF (so clients that CAN read it still get checked)', async () => {
    setEnforcementOff();
    const app = makeApp();
    const res = await request(app).post('/issue');
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(setCookie?.some((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))).toBe(true);
  });

  it('round-trips: a token issued by issueCsrfCookie passes csrfProtection when echoed', async () => {
    setEnforcementOn();
    const app = makeApp();
    const issueRes = await request(app).post('/issue');
    const setCookie = issueRes.headers['set-cookie'] as unknown as string[];
    const cookieHeader = setCookie
      .map((c) => c.split(';')[0])
      .find((c) => c!.startsWith(`${CSRF_COOKIE_NAME}=`))!;
    const token = cookieHeader.split('=')[1]!;

    const mutateRes = await request(app)
      .post('/admin/security/ip-whitelist')
      .set('Cookie', cookieHeader)
      .set(CSRF_HEADER_NAME, token)
      .send({ ip: '1.2.3.4' });
    expect(mutateRes.status).toBe(201);
  });
});
