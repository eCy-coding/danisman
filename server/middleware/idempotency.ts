/**
 * P13/1 — Idempotency middleware.
 *
 * Honors the `Idempotency-Key` header (RFC draft + Stripe-style) so retried
 * POST/PUT/PATCH requests resolve to the cached response of the original
 * attempt instead of executing twice. This is critical for /api/contact +
 * /api/gdpr/* where double-clicks or network retries must NOT spawn a
 * duplicate Telegram message or duplicate data-rights ticket.
 *
 * Storage: in-process LRU + TTL with a Redis-ready hook. We deliberately
 * avoid pulling Redis in here to keep the middleware host-agnostic; the
 * `RedisAdapter` interface can be wired up later without touching call sites.
 *
 * Semantics:
 *   1. First call with key K → execute handler, cache `{status, body, headers}` for TTL.
 *   2. Second call with same key + same route + same body hash → 200 cached response with
 *      `Idempotent-Replay: true` header.
 *   3. Second call with same key but DIFFERENT body → 409 IDEMPOTENCY_KEY_MISMATCH
 *      (per RFC: a key must always represent the same request).
 *   4. Key is per-route to prevent collisions across endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CachedResponse {
  status: number;
  body: unknown;
  bodyHash: string;
  storedAt: number;
}

export interface IdempotencyStore {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, value: CachedResponse, ttlMs: number): Promise<void>;
}

// ── In-memory LRU + TTL store (default) ───────────────────────────────────────

class MemoryIdempotencyStore implements IdempotencyStore {
  private cache = new Map<string, { value: CachedResponse; expiresAt: number }>();
  private maxEntries: number;

  constructor(maxEntries = 5_000) {
    this.maxEntries = maxEntries;
    // Periodic GC (idempotent — safe even if interval already ran).
    setInterval(() => this.gc(), 60_000).unref?.();
  }

  async get(key: string): Promise<CachedResponse | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Touch — promote to MRU end.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  async set(key: string, value: CachedResponse, ttlMs: number): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.cache.size > this.maxEntries) {
      // Drop LRU (Map iteration order = insertion order).
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
  }

  private gc(): void {
    const now = Date.now();
    for (const [k, v] of this.cache) {
      if (now > v.expiresAt) this.cache.delete(k);
    }
  }
}

// ── Redis-backed idempotency store (P16 BE Track 2 / Aşama 5) ─────────────────
//
// Why persist?
//   - Original in-memory store loses every key on restart. With rolling
//     deploys, a client retrying within seconds of redeploy executes the
//     mutation twice (the cached response is gone).
//   - Redis already in the project for rate limiting + JWT blacklist; no new
//     infra cost.
//   - Body hash sticks with the persisted entry so the "same key, different
//     payload" 409 holds across restarts too.
//
// Layout: one Redis key per idempotency entry, namespaced + JSON-serialized,
// with PEX (millisecond TTL) so Redis evicts automatically — no cleanup job.

export class RedisIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly client: typeof redis = redis,
    private readonly namespace = 'idemp:',
  ) {}

  private isUsable(): boolean {
    return (
      this.client.status === 'ready' ||
      this.client.status === 'connecting' ||
      this.client.status === 'reconnecting'
    );
  }

  async get(key: string): Promise<CachedResponse | null> {
    if (!this.isUsable()) return null;
    try {
      const raw = await this.client.get(this.namespace + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedResponse;
      // Sanity guard: a corrupted entry shouldn't crash the middleware.
      if (typeof parsed !== 'object' || parsed === null || typeof parsed.status !== 'number') {
        return null;
      }
      return parsed;
    } catch (err) {
      logger.warn('[idempotency/redis] get failed', { message: (err as Error).message });
      return null;
    }
  }

  async set(key: string, value: CachedResponse, ttlMs: number): Promise<void> {
    if (!this.isUsable()) return;
    try {
      await this.client.set(this.namespace + key, JSON.stringify(value), 'PX', ttlMs);
    } catch (err) {
      logger.warn('[idempotency/redis] set failed', { message: (err as Error).message });
    }
  }
}

/**
 * Composite store: try Redis first (persistent across restarts), fall back to
 * in-memory if Redis is down. Writes go to BOTH so a restart between a write
 * and the next read still serves the cached response if Redis is back.
 *
 * Reads:  Redis → memory.  (If Redis hits, we use it; if it misses, memory
 *         may still have the entry from before Redis became usable.)
 * Writes: memory always, Redis if usable.
 */
class TieredIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly persistent: IdempotencyStore,
    private readonly volatile: IdempotencyStore,
  ) {}

  async get(key: string): Promise<CachedResponse | null> {
    const persisted = await this.persistent.get(key);
    if (persisted) return persisted;
    return this.volatile.get(key);
  }

  async set(key: string, value: CachedResponse, ttlMs: number): Promise<void> {
    // Volatile is the always-success leg; persistent is best-effort.
    await this.volatile.set(key, value, ttlMs);
    await this.persistent.set(key, value, ttlMs).catch(() => {
      /* logged inside */
    });
  }
}

const memoryStore = new MemoryIdempotencyStore();
const redisStore = new RedisIdempotencyStore();
const defaultStore: IdempotencyStore = new TieredIdempotencyStore(redisStore, memoryStore);

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashBody(body: unknown): string {
  const serialized = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  return createHash('sha256').update(serialized).digest('hex').slice(0, 32);
}

function isWriteMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

// ── Middleware factory ────────────────────────────────────────────────────────

export interface IdempotencyOptions {
  /** Time-to-live for cached responses. Default 24h. */
  ttlMs?: number;
  /** Header name. Default Idempotency-Key. */
  headerName?: string;
  /** Whether missing header is a 400 (strict) or just bypass (lenient). Default lenient. */
  required?: boolean;
  /** Custom store (e.g. Redis-backed) — defaults to in-process LRU. */
  store?: IdempotencyStore;
}

export function idempotency(options: IdempotencyOptions = {}) {
  const ttlMs = options.ttlMs ?? 24 * 60 * 60 * 1000;
  const headerName = (options.headerName ?? 'idempotency-key').toLowerCase();
  const store = options.store ?? defaultStore;
  const required = options.required === true;

  return async function idempotencyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!isWriteMethod(req.method)) return next();

    const rawKey = req.headers[headerName];
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    if (!key) {
      if (required) {
        res.status(400).json({
          status: 'error',
          code: 'IDEMPOTENCY_KEY_REQUIRED',
          message: `${options.headerName ?? 'Idempotency-Key'} header is required for ${req.method} ${req.path}.`,
        });
        return;
      }
      return next();
    }

    // Validate key shape — length 8..256 AND printable URL-safe alphabet.
    // P16/5 hardening: a key containing newlines / control characters could
    // poison log lines and Redis key patterns. We accept the same character
    // set Stripe + RFC-9457 idempotency drafts converge on:
    //    A-Z a-z 0-9 - _ . :
    // This is liberal enough for UUIDs, ULIDs, and Stripe-style nonces but
    // rejects whitespace, slashes, and binary bytes outright.
    if (
      typeof key !== 'string' ||
      key.length < 8 ||
      key.length > 256 ||
      !/^[A-Za-z0-9._:-]+$/.test(key)
    ) {
      res.status(400).json({
        status: 'error',
        code: 'IDEMPOTENCY_KEY_INVALID',
        message: 'Idempotency-Key must be 8–256 chars and contain only [A-Za-z0-9._:-].',
      });
      return;
    }

    const namespacedKey = `${req.method}:${req.path}:${key}`;
    const bodyHash = hashBody(req.body);

    const cached = await store.get(namespacedKey);
    if (cached) {
      if (cached.bodyHash !== bodyHash) {
        res.status(409).json({
          status: 'error',
          code: 'IDEMPOTENCY_KEY_MISMATCH',
          message: 'This Idempotency-Key was reused with a different payload.',
        });
        return;
      }
      logger.info(`[idempotency] replay key=${key.slice(0, 8)}… status=${cached.status}`);
      res.setHeader('Idempotent-Replay', 'true');
      res.status(cached.status).json(cached.body);
      return;
    }

    // Wrap res.json so we capture the body before it ships.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache 2xx + 4xx (NOT 5xx — those are transient).
      if (res.statusCode >= 200 && res.statusCode < 500) {
        void store
          .set(
            namespacedKey,
            { status: res.statusCode, body, bodyHash, storedAt: Date.now() },
            ttlMs,
          )
          .catch((err) => logger.warn(`[idempotency] store.set failed: ${(err as Error).message}`));
      }
      return originalJson(body);
    };

    next();
  };
}

export const _testing = {
  MemoryIdempotencyStore,
  RedisIdempotencyStore,
  TieredIdempotencyStore,
};
