/**
 * P35-T01: JWT Blacklist
 *
 * Persists revoked token JTI (JWT ID) in Redis with TTL = token's remaining lifetime.
 * Falls back to in-process LRU Map when Redis is unavailable.
 *
 * Architecture:
 *   - Redis key: `jwt:blacklist:{jti}` value: "1", TTL: remaining seconds
 *   - In-memory fallback: Map<jti, expiryTimestamp> — auto-expired on read
 *   - Memory footprint: O(concurrent sessions) — bounded by JWT expiry
 *
 * Usage:
 *   await blacklistToken(jti, expiresAtMs);
 *   const revoked = await isBlacklisted(jti);
 */

import { redis } from '../config/redis';
import { logger } from '../config/logger';

const REDIS_PREFIX = 'jwt:blacklist:';
const MAX_MEMORY_ENTRIES = 10_000;

// In-memory fallback when Redis is down
const memoryBlacklist = new Map<string, number>();

function pruneMemoryBlacklist(): void {
  if (memoryBlacklist.size <= MAX_MEMORY_ENTRIES) return;
  const now = Date.now();
  for (const [jti, exp] of memoryBlacklist.entries()) {
    if (exp < now) memoryBlacklist.delete(jti);
    if (memoryBlacklist.size <= MAX_MEMORY_ENTRIES) break;
  }
}

/**
 * Revoke a token by its JTI.
 * @param jti      JWT ID from token payload
 * @param expiresAtMs  token expiry timestamp in milliseconds
 */
export async function blacklistToken(jti: string, expiresAtMs: number): Promise<void> {
  const ttl = Math.ceil((expiresAtMs - Date.now()) / 1000);
  if (ttl <= 0) return; // already expired — no need to blacklist

  try {
    await redis.set(`${REDIS_PREFIX}${jti}`, '1', 'EX', ttl);
  } catch (err) {
    logger.warn('[JWTBlacklist] Redis unavailable, using memory fallback', {
      message: (err as Error).message,
    });
    pruneMemoryBlacklist();
    memoryBlacklist.set(jti, expiresAtMs);
  }
}

/**
 * Check if a token JTI is blacklisted.
 * @returns true if revoked, false if valid
 */
export async function isBlacklisted(jti: string): Promise<boolean> {
  try {
    const val = await redis.get(`${REDIS_PREFIX}${jti}`);
    return val !== null;
  } catch {
    // Redis down — check memory fallback
    const exp = memoryBlacklist.get(jti);
    if (exp === undefined) return false;
    if (exp < Date.now()) {
      memoryBlacklist.delete(jti);
      return false;
    }
    return true;
  }
}
