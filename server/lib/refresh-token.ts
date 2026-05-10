/**
 * P35-T02: Refresh Token Rotation
 *
 * Stateful refresh token with rotation-on-use and reuse-detection:
 *
 *   - Access token:  15 minutes (short-lived)
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

export const ACCESS_TOKEN_EXPIRES_IN = '15m';
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
    // Reuse detected — revoke entire family (all devices)
    logger.warn('[RefreshToken] Reuse detected — revoking family', {
      userId: stored.userId,
      family: stored.family,
    });
    await prisma.refreshToken.updateMany({
      where: { family: stored.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
 * Clean up expired tokens (run as periodic job, e.g. daily cron).
 */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
