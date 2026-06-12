import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

// P27 BE Track 2: register() now wraps user + refreshToken + session
// writes in `prisma.$transaction(async (tx) => …)`. Without a
// $transaction mock the controller throws "prisma.$transaction is not
// a function" → 500. Wire it as a pass-through that re-uses the same
// mock as `tx` so `tx.user.create` etc. resolve to our fakes.
vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    session: {
      upsert: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    },
    emailVerification: {
      create: vi.fn().mockResolvedValue({}),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
  prismaMock.$transaction = vi.fn(async (cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock));
  return { prisma: prismaMock };
});

vi.mock('../lib/hibp', () => ({
  checkPasswordBreached: vi.fn().mockResolvedValue({ breached: false, count: 0 }),
}));

vi.mock('../lib/email', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/refresh-token', () => ({
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  // P27 BE Track 2: register() now reads this constant to compute the
  // refresh-token expiry inside the $transaction. Omitting it surfaces
  // a vitest "no export defined" error from the mocked module → 500.
  REFRESH_TOKEN_EXPIRES_DAYS: 7,
  generateRefreshToken: vi.fn(() => ({ raw: 'test-refresh-raw-token', hash: 'test-refresh-hash' })),
  newFamily: vi.fn(() => 'test-family-uuid'),
  storeRefreshToken: vi.fn().mockResolvedValue(undefined),
  rotateRefreshToken: vi.fn(),
  revokeAllUserTokens: vi.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
  blacklistToken: vi.fn().mockResolvedValue(undefined),
}));

// Bypass rate limiting — rate limit behavior is tested in rateLimiter.test.ts
vi.mock('../middleware/rateLimiter', () => ({
  authLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  refreshLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  contactLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  generalLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  createRateLimiter: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { securityHeaders } from '../middleware/security';
import { errorHandler } from '../middleware/error';
import authRoutes from './auth';
import { prisma } from '../config/db';
import { rotateRefreshToken } from '../lib/refresh-token';
import { checkPasswordBreached } from '../lib/hibp';
import { hashPassword } from '../controllers/authController';

// ── Test utilities ────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';

function makeToken(userId: string, role = 'USER') {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);
}

function makeApp() {
  const app = express();
  app.use(securityHeaders);
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

// ── Shared fixtures ───────────────────────────────────────────────────────────

const FAKE_USER = {
  id: 'user-uuid-test-1234',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  passwordHash: null as string | null,
  avatarUrl: null,
  lastLoginAt: null,
  emailVerified: false,
};

// ── POST /auth/register ───────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('creates user and returns 201 with accessToken + refreshToken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: 'hashed',
    } as never);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'SecurePass123!' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBe('test-refresh-raw-token');
  });

  it('does NOT expose passwordHash in the response', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: 'should-never-be-leaked',
    } as never);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'SecurePass123!' });

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('should-never-be-leaked');
  });

  it('returns 409 for duplicate email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: 'hash',
    } as never);

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'existing@example.com', password: 'SecurePass123!' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/register').send({ password: 'SecurePass123!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('returns 422 when password is in HIBP breach database', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(checkPasswordBreached).mockResolvedValue({ breached: true, count: 123_456 });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'breach@example.com', password: 'breached-password-123' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PASSWORD_BREACHED');
    expect(res.body.message).toContain('123,456');
  });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  let app: express.Express;
  let validPasswordHash: string;

  beforeAll(async () => {
    // Pre-compute hash once — PBKDF2 100k iterations is slow per call.
    validPasswordHash = await hashPassword('SecurePass123!');
  });

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with tokens for valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: validPasswordHash,
    } as never);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBe('test-refresh-raw-token');
    expect(res.body.data.user.id).toBe(FAKE_USER.id);
  });

  it('returns 401 for wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: validPasswordHash,
    } as never);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for unknown email (timing-safe — same code path)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'AnyPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/login').send({ password: 'SecurePass123!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'SecurePass123!' });

    expect(res.status).toBe(400);
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with new token pair for a valid refresh token', async () => {
    vi.mocked(rotateRefreshToken).mockResolvedValue({
      ok: true,
      userId: FAKE_USER.id,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: 'hash',
    } as never);

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
  });

  it('returns 401 for expired or invalid refresh token', async () => {
    vi.mocked(rotateRefreshToken).mockResolvedValue({
      ok: false,
      reason: 'NOT_FOUND',
    });

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'expired-or-invalid' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with security alert on token reuse (family revoked)', async () => {
    vi.mocked(rotateRefreshToken).mockResolvedValue({
      ok: false,
      reason: 'FAMILY_REVOKED',
    });

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'reused-stolen-token' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Security alert');
  });

  it('returns 400 when refreshToken field is missing', async () => {
    const res = await request(app).post('/auth/refresh').send({});

    expect(res.status).toBe(400);
  });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

describe('GET /auth/me', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed Bearer token', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not.a.valid.jwt');

    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header missing Bearer prefix', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', makeToken(FAKE_USER.id));

    expect(res.status).toBe(401);
  });

  it('returns 200 for a valid JWT', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...FAKE_USER,
      passwordHash: 'hash',
    } as never);

    const token = makeToken(FAKE_USER.id);
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
