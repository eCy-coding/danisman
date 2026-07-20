/**
 * P35-T02: Refresh Token Rotation
 *
 * Stateful refresh token with rotation-on-use and reuse-detection:
 *
 *   - Access token:  15 minutes by default (short-lived, env-configurable —
 *     see JWT_EXPIRES_IN below)
 *   - Refresh token: 7 days (long-lived, stored DB hashed)
 *
 * Rotation strategy:
 *   1. Login → issue access + refresh, store refresh hash in DB.
 *   2. Refresh → verify DB hash, issue new token pair, revoke old refresh.
 *   3. Reuse detected (same refresh used twice) → revoke ENTIRE family.
 *
 * Token family: UUID grouping all refresh tokens from a single login session.
 * Reuse detection automatically logs out all devices in that family.
 */

import crypto from 'crypto';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { blacklistToken } from './jwt-blacklist';

// Security hardening — was a hardcoded '15m' constant; now reads
// JWT_EXPIRES_IN (default '15m', validated in config/env.ts) so the owner
// can tune access-token TTL per environment without a code change. Default
// intentionally NOT widened to a longer value — 15m was already the live
// production behavior and is more defensible for an admin panel than a
// longer default would be; the refresh-token flow below already covers
// session longevity via rotation + reuse detection.
export const ACCESS_TOKEN_EXPIRES_IN = env.JWT_EXPIRES_IN;
export const REFRESH_TOKEN_EXPIRES_DAYS = 7;

/**
 * Generate a secure random refresh token (opaque, 256-bit entropy).
 * Stored as SHA-256 hash in DB — raw value returned to client only.
 */
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Derive family ID for a new login session.
 */
export function newFamily(): string {
  return crypto.randomUUID();
}

/**
 * Store a new refresh token for a user.
 */
export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  family: string,
  ip?: string,
  userAgent?: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, family, expiresAt, ip, userAgent },
  });
}

interface RotateResult {
  ok: boolean;
  userId?: string;
  reason?: 'NOT_FOUND' | 'REVOKED' | 'EXPIRED' | 'FAMILY_REVOKED';
}

/**
 * Rotate a refresh token:
 *   - Verify the token exists and is not revoked/expired.
 *   - On reuse: revoke entire family and return FAMILY_REVOKED.
 *   - On success: revoke old token, return userId for new token issuance.
 */
export async function rotateRefreshToken(rawToken: string): Promise<RotateResult> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) return { ok: false, reason: 'NOT_FOUND' };

  if (stored.revokedAt !== null) {
    // Reuse detected — revoke entire family (all devices). P14-BE: also
    // revoke every active Session row owned by the user so the access
    // tokens issued alongside the refresh chain stop working immediately
    // (otherwise an attacker would still hold a valid 15-minute access
    // token after the family was nuked).
    logger.warn('[RefreshToken] Reuse detected — revoking family + sessions', {
      userId: stored.userId,
      family: stored.family,
    });

    // P15-BE: Atomic family-revoke. Previously findMany was inside the tx
    // but the follow-up session.updateMany ran OUTSIDE it — a concurrent
    // login could insert a new Session row between the snapshot and the
    // update, leaving an attacker session alive after reuse detection
    // fired. The interactive callback form keeps every write in the same
    // serialisable boundary.
    const sessions = await prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      const liveSessions = await tx.session.findMany({
        where: { userId: stored.userId, revokedAt: null },
        select: { jti: true },
      });
      await tx.session.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return liveSessions;
    });

    // Push every live jti into the blacklist (TTL = remaining refresh
    // window so we never leak a stale entry forever). Blacklist writes
    // intentionally happen OUTSIDE the DB tx because Redis has its own
    // failure modes and we never want to roll back the DB tx on a Redis
    // hiccup — defense-in-depth: DB tutarlılığı > blacklist tutarlılığı.
    const expiresAtMs = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
    await Promise.all(sessions.map((s) => blacklistToken(s.jti, expiresAtMs)));
    return { ok: false, reason: 'FAMILY_REVOKED' };
  }

  if (stored.expiresAt < new Date()) {
    return { ok: false, reason: 'EXPIRED' };
  }

  // Revoke the current token (rotation)
  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });

  return { ok: true, userId: stored.userId };
}

/**
 * Revoke all active refresh tokens for a user (full logout).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * P14-BE: Hard "sign out everywhere" — revoke EVERY refresh token, EVERY
 * Session row, AND push every live access-token jti onto the blacklist.
 *
 * Use this on:
 *   - Password change / reset
 *   - Suspected account compromise
 *   - Admin force-logout from the dashboard
 *
 * The operation is intentionally chatty in the logs because it represents
 * a security-sensitive state change.
 */
export async function revokeAllUserSessions(userId: string, reason: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null },
    select: { jti: true },
  });

  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  // Blacklist outside the tx because the Redis backend has its own
  // failure modes and we don't want to roll back the DB tx on a Redis hiccup.
  //
  // P15-BE bug fix: blacklistToken() expects an ABSOLUTE epoch-ms timestamp
  // (it does `expiresAtMs - Date.now()`). Previously this passed
  // `REFRESH_TOKEN_EXPIRES_DAYS * 86_400_000` which equals 604_800_000 — a
  // duration in ms, not an absolute clock value — so the helper computed a
  // huge negative TTL and short-circuited, silently NEVER blacklisting the
  // jti. The earlier call-site on line 104 already used `Date.now() + …`
  // correctly; this branch was missed during P14-BE Aşama 2.
  const expiresAtMs = Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  await Promise.all(sessions.map((s) => blacklistToken(s.jti, expiresAtMs)));

  logger.warn('[Auth] Full session revocation', {
    userId,
    reason,
    sessionCount: sessions.length,
  });
}

/**
 * Clean up expired tokens (run as periodic job, e.g. daily cron).
 */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
