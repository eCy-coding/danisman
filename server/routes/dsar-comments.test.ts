/**
 * DSAR comments route tests (KVKK Madde 11 — veri sahibi hakları)
 *
 * Cases:
 *   1. GET  /api/v1/dsar/comments → 200 list (admin)
 *   2. GET  without email param → 400
 *   3. GET  as self (non-admin) → 200 list
 *   4. DELETE /api/v1/dsar/comments → 200 erasure (admin)
 *   5. DELETE as non-admin → 403
 *   6. DELETE without email param → 400
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { withCsrf } from '../test-utils/csrf';
import { CSRF_COOKIE_DOMAIN_ENV_VAR } from '../middleware/csrf';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    comment: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Bypass Redis dependency
vi.mock('../config/redis', () => ({ redis: { status: 'end' } }));

// Silence winston logger
vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Auth bypass: authenticate injects a user derived from the `x-test-role`
// header so individual cases can exercise the route's ADMIN / self branches.
// A header value of `none` skips injection to assert the unauthorized path.
vi.mock('../middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const role = (req.headers['x-test-role'] as string | undefined) ?? 'ADMIN';
    if (role !== 'none') {
      (req as express.Request & { user?: { id: string; role: string } }).user = {
        id: 'test-user-id',
        role,
      };
    }
    next();
  },
}));

import dsarCommentsRouter from './dsar-comments';
import { errorHandler } from '../middleware/error';

// ── App factory ────────────────────────────────────────────────────────────────

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', dsarCommentsRouter);
  app.use(errorHandler);
  return app;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeComment = {
  id: 'comment-id-1',
  bodyMd: 'Harika bir yazı.',
  status: 'APPROVED',
  createdAt: new Date(),
  post: { slug: 'ornek-yazi', titleTr: 'Örnek Yazı' },
};

const TEST_EMAIL = 'ilgili@ornek.com';

// ── GET /api/v1/dsar/comments ──────────────────────────────────────────────────

describe('GET /api/v1/dsar/comments', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with the caller comments when admin', async () => {
    prismaMock.comment.findMany.mockResolvedValue([fakeComment]);

    const res = await request(app)
      .get('/api/v1/dsar/comments')
      .query({ email: TEST_EMAIL })
      .set('x-test-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.email).toBe(TEST_EMAIL);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.comments[0].id).toBe('comment-id-1');
    expect(prismaMock.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorEmail: TEST_EMAIL } }),
    );
  });

  it('returns 200 for an authenticated self (non-admin) user', async () => {
    prismaMock.comment.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/dsar/comments')
      .query({ email: TEST_EMAIL })
      .set('x-test-role', 'USER');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.count).toBe(0);
  });

  it('returns 400 when the email query parameter is missing', async () => {
    const res = await request(app).get('/api/v1/dsar/comments').set('x-test-role', 'ADMIN');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(prismaMock.comment.findMany).not.toHaveBeenCalled();
  });
});

// ── DELETE /api/v1/dsar/comments ────────────────────────────────────────────────

describe('DELETE /api/v1/dsar/comments', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('erases comments and returns 200 with the deleted count when admin', async () => {
    prismaMock.comment.deleteMany.mockResolvedValue({ count: 3 });

    const res = await withCsrf(
      request(app).delete('/api/v1/dsar/comments').query({ email: TEST_EMAIL }),
    ).set('x-test-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.deleted).toBe(3);
    expect(prismaMock.comment.deleteMany).toHaveBeenCalledWith({
      where: { authorEmail: TEST_EMAIL },
    });
  });

  it('returns 403 for a non-admin user (erasure is admin-only)', async () => {
    const res = await withCsrf(
      request(app).delete('/api/v1/dsar/comments').query({ email: TEST_EMAIL }),
    ).set('x-test-role', 'USER');

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(prismaMock.comment.deleteMany).not.toHaveBeenCalled();
  });

  it('returns 400 when the email query parameter is missing', async () => {
    const res = await withCsrf(request(app).delete('/api/v1/dsar/comments')).set(
      'x-test-role',
      'ADMIN',
    );

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(prismaMock.comment.deleteMany).not.toHaveBeenCalled();
  });

  // CSRF enforcement is gated on CSRF_COOKIE_DOMAIN (see csrf.ts module
  // header) — unset by default (server/test-utils/setup.ts doesn't set it),
  // matching every preview deployment. A request with no CSRF header at all
  // must still succeed in that mode; a PRESENT-but-wrong token is always
  // rejected regardless of mode.
  it('proceeds without a CSRF header/cookie when CSRF_COOKIE_DOMAIN is unset (default)', async () => {
    prismaMock.comment.deleteMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .delete('/api/v1/dsar/comments')
      .query({ email: TEST_EMAIL })
      .set('x-test-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(3);
  });

  it('still rejects a PRESENT but mismatched CSRF header even with enforcement off', async () => {
    const res = await request(app)
      .delete('/api/v1/dsar/comments')
      .query({ email: TEST_EMAIL })
      .set('x-test-role', 'ADMIN')
      .set('Cookie', 'ecypro_csrf=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      .set('X-CSRF-Token', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    expect(prismaMock.comment.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects a missing CSRF header when CSRF_COOKIE_DOMAIN is explicitly set (enforcement on)', async () => {
    process.env[CSRF_COOKIE_DOMAIN_ENV_VAR] = '.ecypro.com';
    try {
      const res = await request(app)
        .delete('/api/v1/dsar/comments')
        .query({ email: TEST_EMAIL })
        .set('x-test-role', 'ADMIN');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
      expect(prismaMock.comment.deleteMany).not.toHaveBeenCalled();
    } finally {
      delete process.env[CSRF_COOKIE_DOMAIN_ENV_VAR];
    }
  });
});
