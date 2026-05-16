/**
 * P16 BE Track 2 / Aşama 1 — In-process LRU + TTL cache.
 *
 * Dependency-free LRU with TTL eviction, suitable for the cache middleware
 * and any other in-process cache need (geo lookups, content snapshots, etc.).
 *
 * Why custom (not `lru-cache` npm dep):
 *   - Project keeps the dependency surface tight (CLAUDE.md doctrine).
 *   - We only need a Map-with-insertion-order LRU + per-entry TTL + GC tick.
 *   - The behaviour required is small enough that hand-rolling it gives us
 *     a predictable, vendored implementation we can reason about in tests.
 *
 * Eviction rules:
 *   - Read hit on a non-expired entry promotes it to MRU end.
 *   - On `set` of a new key past `maxEntries`, the oldest (LRU) entry is dropped.
 *   - A 60s GC interval sweeps expired entries (also `get` lazily evicts).
 *
 * Observability:
 *   - `stats()` exposes hits / misses / evictions / expirations for
 *     `/api/admin/cache/stats`.
 */

export interface LruCacheStats {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  size: number;
  maxEntries: number;
  hitRate: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class LruCache<V> {
  private store = new Map<string, CacheEntry<V>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;
  private gcTimer?: NodeJS.Timeout;

  constructor(
    public readonly maxEntries = 1_000,
    /**
     * GC interval. 0 disables the timer (caller relies on lazy expiration on
     * get only). Tests pass 0 to avoid leaked timers.
     */
    gcIntervalMs = 60_000,
  ) {
    if (gcIntervalMs > 0) {
      this.gcTimer = setInterval(() => this.gc(), gcIntervalMs);
      this.gcTimer.unref?.();
    }
  }

  /** Stop the GC timer — useful in tests + graceful shutdown. */
  dispose(): void {
    if (this.gcTimer) clearInterval(this.gcTimer);
    this.gcTimer = undefined;
    this.store.clear();
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.expirations++;
      this.misses++;
      return undefined;
    }
    // Promote to MRU end (Map iteration order = insertion order; re-set moves it).
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    if (ttlMs <= 0) return; // ttl=0 means "do not cache" — bail intentionally
    // If the key already exists, deleting first ensures the new entry lands at
    // the MRU end of the iteration order rather than keeping the original slot.
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
      this.evictions++;
    }
  }

  /** Delete a single key. Returns true if anything was deleted. */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete all keys whose stringified name starts with `prefix`. Used by
   * invalidation hooks ("any cached GET under /api/geo/*").
   */
  deletePrefix(prefix: string): number {
    let n = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        n++;
      }
    }
    return n;
  }

  clear(): void {
    this.store.clear();
  }

  /** Lazy + scheduled GC pass. Safe to call manually. */
  gc(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now > v.expiresAt) {
        this.store.delete(k);
        this.expirations++;
      }
    }
  }

  stats(): LruCacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      size: this.store.size,
      maxEntries: this.maxEntries,
      hitRate: total === 0 ? 0 : Math.round((this.hits / total) * 10_000) / 10_000,
    };
  }

  /** Snapshot of current keys (testing / `/admin/cache/stats` deep view). */
  keys(): string[] {
    return Array.from(this.store.keys());
  }
}
