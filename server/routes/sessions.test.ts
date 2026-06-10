/**
 * P35-T09 — session management route tests
 *
 * Verifies:
 *   - GET    /api/sessions       → 200 lists own non-revoked sessions, marks isCurrent
 *   - DELETE /api/sessions/:id   → 200 revokes a specific session + blacklists its jti
 *   - DELETE /api/sessions/:id   → 404 when session not found / not owned
 *   - DELETE /api/sessions       → 200 revokes all sessions except current
 *   - GET    /api/sessions       → 401 when no/invalid Authorization header
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    session: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return { prisma: prismaMock };
});

vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
  blacklistToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/refresh-token', () => ({
  REFRESH_TOKEN_EXPIRES_DAYS: 7,
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { errorHandler } from '../middleware/error';
import sessionRoutes from './sessions';
import { prisma } from '../config/db';
import { blacklistToken } from '../lib/jwt-blacklist';

// ── Test utilities ────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';

function makeToken(userId: string, jti: string, role = 'USER') {
  return jwt.sign({ id: userId, role, jti }, JWT_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionRoutes);
  app.use(errorHandler);
  return app;
}

// ── Shared fixtures ───────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-test-1234';
const CURRENT_JTI = 'current-jti-1111';

// ── GET /api/sessions ───────────────────────────────────────────────────────

describe('GET /api/sessions', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with own sessions and marks the current one', async () => {
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      {
        id: 'sess-1',
        jti: CURRENT_JTI,
        userAgent: 'Chrome',
        ip: '127.0.0.1',
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
      {
        id: 'sess-2',
        jti: 'other-jti-2222',
        userAgent: 'Firefox',
        ip: '10.0.0.2',
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
    ] as never);

    const token = makeToken(USER_ID, CURRENT_JTI);
    const res = await request(app).get('/api/sessions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].isCurrent).toBe(true);
    expect(res.body.data[1].isCurrent).toBe(false);
    expect(vi.mocked(prisma.session.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, revokedAt: null } }),
    );
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(401);
    expect(vi.mocked(prisma.session.findMany)).not.toHaveBeenCalled();
  });
});

// ── DELETE /api/sessions/:id ──────────────────────────────────────────────────

describe('DELETE /api/sessions/:id', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('revokes a specific session and blacklists its jti', async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue({
      id: 'sess-2',
      jti: 'other-jti-2222',
    } as never);

    const token = makeToken(USER_ID, CURRENT_JTI);
    const res = await request(app)
      .delete('/api/sessions/sess-2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.message).toBe('Session revoked');
    expect(vi.mocked(prisma.session.update)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sess-2' } }),
    );
    expect(vi.mocked(blacklistToken)).toHaveBeenCalledWith('other-jti-2222', expect.any(Number));
  });

  it('returns 404 when the session is not found or not owned', async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);

    const token = makeToken(USER_ID, CURRENT_JTI);
    const res = await request(app)
      .delete('/api/sessions/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SESSION_NOT_FOUND');
    expect(vi.mocked(prisma.session.update)).not.toHaveBeenCalled();
    expect(vi.mocked(blacklistToken)).not.toHaveBeenCalled();
  });
});

// ── DELETE /api/sessions (revoke all except current) ──────────────────────────

describe('DELETE /api/sessions', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('revokes all other sessions and blacklists their jtis', async () => {
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { id: 'sess-2', jti: 'other-jti-2222' },
      { id: 'sess-3', jti: 'other-jti-3333' },
    ] as never);

    const token = makeToken(USER_ID, CURRENT_JTI);
    const res = await request(app).delete('/api/sessions').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.revoked).toBe(2);
    expect(vi.mocked(prisma.session.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, revokedAt: null, jti: { not: CURRENT_JTI } },
      }),
    );
    expect(vi.mocked(blacklistToken)).toHaveBeenCalledTimes(2);
  });
});
