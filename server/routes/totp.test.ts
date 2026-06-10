/**
 * P35-T04: 2FA TOTP Routes — Integration Tests
 *
 * Mirrors the harness in `auth.test.ts`: hoisted module mocks,
 * `vi.mock('../config/db')`, redis mock, supertest `makeApp()`, JWT
 * `makeToken` helper. The route delegates TOTP crypto to `../lib/totp`
 * (which wraps speakeasy); we mock that lib so token validity is
 * deterministic without generating real time-based codes.
 *
 * Coverage:
 *   1. POST /2fa/setup        → returns secret + QR (success)
 *   2. POST /2fa/verify-setup → valid token enables 2FA + backup codes
 *   3. POST /2fa/validate     → wrong token → 401 fail
 *   4. POST /2fa/disable      → valid token disables 2FA
 *   5. POST /2fa/setup        → 401 without auth (auth-failure case)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return { prisma: prismaMock };
});

// The route wraps speakeasy via `../lib/totp`. Mock the lib so TOTP
// verification is deterministic (no real time-based codes needed).
vi.mock('../lib/totp', () => ({
  generateTotpSetup: vi.fn().mockResolvedValue({
    secret: 'JBSWY3DPEHPK3PXP',
    otpauthUrl: 'otpauth://totp/EcyPro:test@example.com?secret=JBSWY3DPEHPK3PXP',
    qrCodeDataUrl: 'data:image/png;base64,FAKEQRDATA',
  }),
  verifyTotpToken: vi.fn(),
  generateBackupCodes: vi.fn(() => ({
    clearCodes: ['AAAA1111', 'BBBB2222'],
    hashedCodes: ['hash-aaaa', 'hash-bbbb'],
  })),
  verifyAndConsumeBackupCode: vi.fn(),
}));

vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
  blacklistToken: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { securityHeaders } from '../middleware/security';
import { errorHandler } from '../middleware/error';
import totpRoutes from './totp';
import { prisma } from '../config/db';
import { verifyTotpToken } from '../lib/totp';

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
  app.use('/auth/2fa', totpRoutes);
  app.use(errorHandler);
  return app;
}

// ── Shared fixtures ───────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-test-1234';
const VALID_CODE = '123456';

// ── POST /auth/2fa/setup ────────────────────────────────────────────────────────

describe('POST /auth/2fa/setup', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns secret + QR code on success', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'test@example.com',
      totpEnabled: false,
    } as never);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.qrCodeDataUrl).toBe('data:image/png;base64,FAKEQRDATA');
    expect(res.body.data.otpauthUrl).toContain('otpauth://');
    expect(res.body.data.manualEntryKey).toBe('JBSWY3DPEHPK3PXP');
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalled();
  });

  it('returns 401 without auth (auth-failure case)', async () => {
    const res = await request(app).post('/auth/2fa/setup').send({});

    expect(res.status).toBe(401);
    expect(vi.mocked(prisma.user.findUnique)).not.toHaveBeenCalled();
  });
});

// ── POST /auth/2fa/verify-setup ─────────────────────────────────────────────────

describe('POST /auth/2fa/verify-setup', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('enables 2FA and returns backup codes for a valid token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: false,
    } as never);
    vi.mocked(verifyTotpToken).mockReturnValue(true);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: VALID_CODE });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.message).toContain('2FA enabled');
    expect(res.body.data.backupCodes).toEqual(['AAAA1111', 'BBBB2222']);
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totpEnabled: true }) }),
    );
  });
});

// ── POST /auth/2fa/validate ─────────────────────────────────────────────────────

describe('POST /auth/2fa/validate', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 401 for a wrong token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: true,
      backupCodes: '[]',
      email: 'test@example.com',
      role: 'USER',
    } as never);
    vi.mocked(verifyTotpToken).mockReturnValue(false);

    const res = await request(app)
      .post('/auth/2fa/validate')
      .send({ userId: USER_ID, token: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOTP');
  });
});

// ── POST /auth/2fa/disable ──────────────────────────────────────────────────────

describe('POST /auth/2fa/disable', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('disables 2FA for a valid token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      totpSecret: 'JBSWY3DPEHPK3PXP',
      totpEnabled: true,
    } as never);
    vi.mocked(verifyTotpToken).mockReturnValue(true);

    const token = makeToken(USER_ID);
    const res = await request(app)
      .post('/auth/2fa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ token: VALID_CODE });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.message).toContain('2FA disabled');
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totpEnabled: false }) }),
    );
  });
});
