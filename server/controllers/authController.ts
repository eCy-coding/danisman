import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { HttpError } from '../middleware/error';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-dev-only-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

function sanitizeUser(user: { id: string; email: string; name: string | null; role: string; avatarUrl?: string | null }) {
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

    // ALWAYS run verifyPassword once, even when user is missing, to equalize timings.
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await verifyPassword(password, hashToCompare);

    if (!user || !user.passwordHash || !isValid) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id, user.role);
    res.json({
      status: 'success',
      data: { token, user: sanitizeUser(user) },
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

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name: name ?? null, passwordHash },
    });

    const token = generateToken(user.id, user.role);
    res.status(201).json({
      status: 'success',
      data: { token, user: sanitizeUser(user) },
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
