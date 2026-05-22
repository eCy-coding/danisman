import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { HttpError } from '../middleware/error';
import { blacklistToken } from '../lib/jwt-blacklist';
import { sendEmailVerification } from '../lib/email';
import { checkPasswordBreached } from '../lib/hibp';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
  generateRefreshToken,
  newFamily,
  rotateRefreshToken,
  revokeAllUserTokens,
  revokeAllUserSessions,
  storeRefreshToken,
} from '../lib/refresh-token';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-dev-only-change-in-prod';
const JWT_EXPIRES_IN = ACCESS_TOKEN_EXPIRES_IN;

// ─── Input Schemas ───────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

// ─── Password Hashing (Node.js native crypto — no external dep) ──

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100_000;
const DIGEST = 'sha512';

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${ITERATIONS}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a candidate password against a stored PBKDF2-SHA512 hash.
 *
 * Phase 20 C3: defensive parsing — corrupted hashes (legacy 2-part format,
 * empty strings, NaN iterations) used to throw and bubble up a 500. Now we
 * resolve `false` instead and emit a structured warning. This:
 *   - Keeps the constant-time login behavior intact (caller still throws
 *     INVALID_CREDENTIALS, no info leak via 500 vs 401);
 *   - Uses `crypto.timingSafeEqual` over plain string `===` to neutralize
 *     comparison-timing side-channels.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 3) {
    return false;
  }
  const [salt, iterStr, hash] = parts as [string, string, string];
  const iterations = Number.parseInt(iterStr, 10);
  if (!salt || !hash || !Number.isFinite(iterations) || iterations < 1) {
    return false;
  }
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      const candidate = derivedKey.toString('hex');
      // Buffers must be the same length for timingSafeEqual; on mismatch we still
      // need to consume time, so do an equal-length comparison against a placeholder.
      const a = Buffer.from(candidate, 'hex');
      const b = Buffer.from(hash, 'hex');
      if (a.length !== b.length) return resolve(false);
      resolve(crypto.timingSafeEqual(a, b));
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────

function generateToken(userId: string, role: string): string {
  const jti = crypto.randomUUID();
  return jwt.sign({ id: userId, role, jti }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function decodeTokenUnsafe(token: string): { jti?: string; exp?: number; id?: string } | null {
  try {
    return jwt.decode(token) as { jti?: string; exp?: number; id?: string };
  } catch {
    return null;
  }
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

// ─── Controllers ─────────────────────────────────────────

/**
 * Timing-safe dummy hash used to equalize compute cost on both
 * "user does not exist" and "user exists / wrong password" paths.
 * Prevents user enumeration via response-time side-channel.
 */
const DUMMY_HASH = `${'0'.repeat(64)}:${ITERATIONS}:${'0'.repeat(KEY_LENGTH * 2)}`;

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await verifyPassword(password, hashToCompare);

    if (!user || !user.passwordHash || !isValid) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken = generateToken(user.id, user.role);
    const decoded = jwt.decode(accessToken) as { jti?: string } | null;
    const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();
    const family = newFamily();
    await storeRefreshToken(
      user.id,
      refreshHash,
      family,
      req.ip ?? undefined,
      req.headers['user-agent'] ?? undefined,
    );

    // P35-T09: upsert Session record for session management dashboard
    if (decoded?.jti) {
      await prisma.session.upsert({
        where: { jti: decoded.jti },
        create: {
          userId: user.id,
          jti: decoded.jti,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
        update: { lastSeenAt: new Date() },
      });
    }

    res.json({
      status: 'success',
      data: { token: accessToken, refreshToken: refreshRaw, user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
    }

    // P35-T08: HIBP breach check — fail-open (does not block registration if API down)
    const { breached, count } = await checkPasswordBreached(password);
    if (breached) {
      throw new HttpError(
        422,
        'PASSWORD_BREACHED',
        `This password has appeared in ${count.toLocaleString()} data breaches. Please choose a different password.`,
      );
    }

    const passwordHash = await hashPassword(password);

    // P15-BE: Atomic user + refresh-token + session creation.
    // Previously these were three independent writes — if user.create
    // succeeded but session.create failed (DB hiccup / network), the
    // platform was left with an orphan account the user could never log
    // back into. Wrapping in $transaction guarantees all-or-nothing.
    const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();
    const family = newFamily();
    const refreshExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    const { user, accessToken } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, name: name ?? null, passwordHash },
      });

      const token = generateToken(createdUser.id, createdUser.role);
      const decoded = jwt.decode(token) as { jti?: string } | null;

      await tx.refreshToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: refreshHash,
          family,
          expiresAt: refreshExpiresAt,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      });

      // P35-T09: create Session record inside same tx
      if (decoded?.jti) {
        await tx.session.create({
          data: {
            userId: createdUser.id,
            jti: decoded.jti,
            ip: req.ip ?? null,
            userAgent: req.headers['user-agent'] ?? null,
          },
        });
      }

      return { user: createdUser, accessToken: token };
    });

    // P35-T03: send email verification (non-blocking, fail-open)
    void sendVerificationEmail(user.id, user.email);

    // P17 BE Track 2 / Aşama 2: queued welcome email — moved off the
    // request hot path so a Resend hiccup never blocks signup. Inline
    // execution falls back when Redis/BullMQ are unavailable.
    void import('../lib/mailer')
      .then(({ queueWelcome }) => {
        const displayName = user.name ?? user.email.split('@')[0] ?? user.email;
        return queueWelcome(user.email, displayName, 'tr');
      })
      .catch(() => {
        /* mailer fallback already logs; never throw out of signup */
      });

    res.status(201).json({
      status: 'success',
      data: { token: accessToken, refreshToken: refreshRaw, user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// P35-T01: Logout — blacklist access token + revoke all refresh tokens
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = decodeTokenUnsafe(token);
      if (decoded?.jti && decoded.exp) {
        await blacklistToken(decoded.jti, decoded.exp * 1000);
      }
      if (decoded?.id) {
        await revokeAllUserTokens(decoded.id);
      }
    }
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// P35-T02: Refresh token rotation
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = z.string().min(1).parse(req.body.refreshToken);
    const result = await rotateRefreshToken(rawToken);

    if (!result.ok) {
      const msg =
        result.reason === 'FAMILY_REVOKED'
          ? 'Security alert: refresh token reuse detected. All sessions revoked.'
          : 'Refresh token invalid or expired. Please log in again.';
      throw new HttpError(401, result.reason ?? 'INVALID_TOKEN', msg);
    }

    const user = await prisma.user.findUnique({ where: { id: result.userId! } });
    if (!user) throw new HttpError(401, 'USER_NOT_FOUND', 'User no longer exists');

    const accessToken = generateToken(user.id, user.role);
    const { raw: refreshRaw, hash: refreshHash } = generateRefreshToken();

    // Inherit same family for chain tracking
    const oldDecoded = decodeTokenUnsafe(rawToken) ?? {};
    const family = (oldDecoded as { family?: string }).family ?? newFamily();
    await storeRefreshToken(
      user.id,
      refreshHash,
      family,
      req.ip ?? undefined,
      req.headers['user-agent'] ?? undefined,
    );

    res.json({
      status: 'success',
      data: { token: accessToken, refreshToken: refreshRaw, user: sanitizeUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── P35-T03: Email Verification ────────────────────────

async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerification.create({ data: { userId, tokenHash, expiresAt } });

  const prodUrl = process.env.VITE_PROD_URL ?? 'https://www.ecypro.com';
  const verifyUrl = `${prodUrl}/verify-email?token=${raw}`;
  await sendEmailVerification(email, verifyUrl);
}

export const sendVerifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Not authenticated');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });
    if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    if (user.emailVerified) throw new HttpError(409, 'ALREADY_VERIFIED', 'Email already verified');

    await sendVerificationEmail(userId, user.email);
    res.json({ status: 'success', message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.query as { token?: string };
    if (!token || typeof token !== 'string') {
      throw new HttpError(400, 'MISSING_TOKEN', 'Verification token required');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.emailVerification.findUnique({ where: { tokenHash } });

    if (!record) throw new HttpError(400, 'INVALID_TOKEN', 'Invalid or expired token');
    if (record.usedAt) throw new HttpError(409, 'TOKEN_USED', 'Token already used');
    if (new Date() > record.expiresAt)
      throw new HttpError(400, 'TOKEN_EXPIRED', 'Token expired — request a new one');

    await prisma.$transaction([
      prisma.emailVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    ]);

    res.json({ status: 'success', message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── P14-BE: Password Change ────────────────────────────────
// Requires the current password (not just a valid JWT — defense in depth
// against stolen-laptop / unlocked-tab scenarios) and revokes EVERY
// session and refresh token the user owns, including the calling one.
// The client must re-login after this call returns 200.

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password required'),
  newPassword: z
    .string()
    .min(12, 'New password must be at least 12 characters')
    .max(256, 'New password too long'),
});

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Not authenticated');

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    if (currentPassword === newPassword) {
      throw new HttpError(
        422,
        'PASSWORD_UNCHANGED',
        'New password must differ from current password',
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      // OAuth-only accounts cannot use this endpoint
      throw new HttpError(400, 'NO_PASSWORD_SET', 'Password change unavailable for this account');
    }

    const validCurrent = await verifyPassword(currentPassword, user.passwordHash);
    if (!validCurrent) {
      // Match login's 401 error code so the client can reuse its UX
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    // HIBP gate on the new password too
    const { breached, count } = await checkPasswordBreached(newPassword);
    if (breached) {
      throw new HttpError(
        422,
        'PASSWORD_BREACHED',
        `This password has appeared in ${count.toLocaleString()} data breaches. Please choose another.`,
      );
    }

    const newHash = await hashPassword(newPassword);

    // P15-BE: Atomic password rotation. Previously user.update succeeded
    // and revokeAllUserSessions ran as a separate awaited call — if the
    // DB connection dropped between the two, the password changed but
    // sessions stayed valid, leaving a window where a stolen access
    // token would keep working against the new password. Wrapping both
    // writes inside the same $transaction keeps the invariant
    // "password rotated ⇒ every session revoked" atomic.
    //
    // Note: jti blacklist (Redis) writes are deliberately kept outside
    // this tx — they have an independent failure mode that should not
    // roll back the DB. revokeAllUserSessions handles that split.
    const liveSessions = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
      const sessions = await tx.session.findMany({
        where: { userId, revokedAt: null },
        select: { jti: true },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return sessions;
    });

    // Blacklist outside the tx (Redis hiccup must not roll back DB).
    const expiresAtMs = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
    await Promise.all(liveSessions.map((s) => blacklistToken(s.jti, expiresAtMs)));
    void revokeAllUserSessions; // kept exported for admin-force-logout path

    res.json({
      status: 'success',
      message: 'Password changed. All sessions have been signed out — please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Not authenticated');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({ status: 'success', data: { user: sanitizeUser(user) } });
  } catch (error) {
    next(error);
  }
};
