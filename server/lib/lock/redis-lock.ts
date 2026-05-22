/**
 * P23 BE Track 2 / Aşama 4 — Redis-backed distributed lock.
 *
 * Pattern: single-key SETNX + TTL, lua-scripted release for ownership check.
 * Conceptually a slim subset of Redlock (Antirez, 2014) — we only run one
 * Redis instance, so the multi-node quorum is N/A; the ownership token is
 * the safety net that prevents one instance from releasing another's lock
 * if the original holder fell asleep past the TTL.
 *
 * Use case (this sprint): multi-instance deploy where every API/worker dyno
 * registers the same cron job. Without leader election the audit-archive
 * cron would run N times in parallel, exhausting DB write capacity.
 *
 * Why not Postgres advisory locks?
 *   - Audit cron runs once per week — burning a Postgres connection slot
 *     just to hold a lock for 60s is wasteful, and the advisory lock dies
 *     with the connection (no TTL safety).
 *   - We already require Redis for rate limiting + BullMQ + sessions, so
 *     no new infra surface.
 *
 * Renewal: long-running tasks should call `renewLock()` at ~half-TTL to
 * keep the lock alive without holding an oversized initial TTL. If the
 * caller crashes the lock auto-expires.
 *
 * Fallback behaviour (no Redis):
 *   - Single-instance deployments (NODE_ENV=development, sandbox/CI):
 *     no contention possible → `withLock()` always grants. Safe.
 *   - Multi-instance with Redis down: the implementation logs an explicit
 *     warning and ALLOWS the operation. This is intentional — refusing
 *     would cause the cron to never run, which is worse than running
 *     twice. The operator should be alerted via /metrics.
 */

import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { randomBytes } from 'node:crypto';

/**
 * Lua script for safe release: only DEL the key if the value still matches
 * the caller's token. This avoids the classic race:
 *
 *   t=0   A acquires "lock:x" with TTL 30s
 *   t=29  A is paused by GC
 *   t=30  Redis expires the key
 *   t=31  B acquires "lock:x"
 *   t=32  A resumes, calls DEL — would have deleted B's lock without this guard.
 *
 * The atomic EVAL block guarantees check-and-delete is a single Redis op.
 */
const RELEASE_LUA = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

/** Same idea but for atomic renew. */
const RENEW_LUA = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
else
  return 0
end
`;

export interface Lock {
  key: string;
  token: string;
  ttlMs: number;
  acquiredAt: number;
}

/**
 * Attempt to acquire `key` with the given TTL. Returns the Lock handle on
 * success or null when contended. Always returns a Lock when Redis is
 * unavailable (see fallback rationale above).
 */
export async function acquireLock(key: string, ttlMs: number): Promise<Lock | null> {
  const token = randomBytes(16).toString('hex');
  try {
    // ioredis `set(key, value, 'PX', ttlMs, 'NX')` returns 'OK' on success
    // and null when the key already exists.
    const r = await (
      redis as unknown as {
        set: (k: string, v: string, m1: 'PX', ms: number, m2: 'NX') => Promise<string | null>;
      }
    ).set(key, token, 'PX', ttlMs, 'NX');
    if (r === 'OK') {
      return { key, token, ttlMs, acquiredAt: Date.now() };
    }
    return null;
  } catch (err) {
    logger.warn('[lock] Redis SETNX failed — fallback to local grant', {
      key,
      message: (err as Error).message,
    });
    // Fallback: pretend we got the lock so the operation can proceed.
    // The token still uniquely identifies this caller for release().
    return { key, token, ttlMs, acquiredAt: Date.now() };
  }
}

export async function renewLock(lock: Lock): Promise<boolean> {
  try {
    const r = await (
      redis as unknown as {
        eval: (script: string, numKeys: number, key: string, ...args: string[]) => Promise<number>;
      }
    ).eval(RENEW_LUA, 1, lock.key, lock.token, String(lock.ttlMs));
    return r === 1;
  } catch (err) {
    logger.warn('[lock] renew failed', { key: lock.key, message: (err as Error).message });
    return false;
  }
}

export async function releaseLock(lock: Lock): Promise<boolean> {
  try {
    const r = await (
      redis as unknown as {
        eval: (script: string, numKeys: number, key: string, ...args: string[]) => Promise<number>;
      }
    ).eval(RELEASE_LUA, 1, lock.key, lock.token);
    return r === 1;
  } catch (err) {
    logger.warn('[lock] release failed', { key: lock.key, message: (err as Error).message });
    return false;
  }
}

/**
 * Convenience wrapper — acquire, run the task with auto-renew, then release.
 *
 * Auto-renew interval is set to ttlMs / 3, giving the task ~2 missed renews
 * before the lock would actually expire under network blip conditions.
 *
 * If the lock can't be acquired the task is SKIPPED — returns
 * { acquired: false } so the caller can decide whether to alert.
 */
export async function withLock<T>(
  key: string,
  ttlMs: number,
  task: () => Promise<T>,
): Promise<{ acquired: true; value: T } | { acquired: false }> {
  const lock = await acquireLock(key, ttlMs);
  if (!lock) {
    logger.info('[lock] contended — skipping task', { key });
    return { acquired: false };
  }

  // Set up the renew timer. unref() so it doesn't keep Node alive during
  // shutdown if the task throws and we forget to clear.
  const renewInterval = Math.max(1_000, Math.floor(ttlMs / 3));
  const timer = setInterval(() => {
    void renewLock(lock).catch(() => undefined);
  }, renewInterval);
  if (typeof timer.unref === 'function') timer.unref();

  try {
    const value = await task();
    return { acquired: true, value };
  } finally {
    clearInterval(timer);
    await releaseLock(lock).catch(() => undefined);
  }
}

/**
 * Diagnostic — peek a lock's current state. Returns null when the key is
 * not held. Used by /metrics + admin "who owns this cron?" view.
 */
export async function inspectLock(key: string): Promise<{ token: string; ttlMs: number } | null> {
  try {
    const [val, ttl] = await Promise.all([
      (redis as unknown as { get: (k: string) => Promise<string | null> }).get(key),
      (redis as unknown as { pttl: (k: string) => Promise<number> }).pttl(key),
    ]);
    if (!val) return null;
    return { token: val, ttlMs: ttl };
  } catch (err) {
    logger.warn('[lock] inspect failed', { key, message: (err as Error).message });
    return null;
  }
}
