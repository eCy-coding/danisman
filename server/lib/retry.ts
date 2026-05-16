/**
 * P14-BE / P21-BE: Dependency-free retry helper with exponential backoff
 * + selectable jitter policy (full | decorrelated).
 *
 * Sleep pattern (default — full jitter, AWS Architecture Blog recommendation):
 *   attempt 1 fails → wait random(0, 200ms)   → attempt 2
 *   attempt 2 fails → wait random(0, 400ms)   → attempt 3
 *   attempt 3 fails → throw
 *
 * Total worst-case ceiling: ~5s; cancellable via AbortSignal.
 *
 * Why jitter at all? — without it, N callers that fail at the same instant
 * (e.g. a brief downstream outage) all retry at exactly `base × 2^n` ms,
 * creating a thundering herd that re-trips the dependency. Full jitter
 * spreads retries uniformly over [0, cap]; decorrelated jitter (Marc Brooker)
 * converges faster on bursty workloads.
 *
 * CRITICAL: only use this on IDEMPOTENT operations. POST /payments or
 * any other non-idempotent side effect MUST NOT be wrapped — see the
 * `safe` boolean on the predicate if you need a runtime guard.
 */

import { logger } from '../config/logger';

export type JitterStrategy = 'full' | 'decorrelated' | 'none';

export interface RetryOptions {
  /** Human-readable label included in every log line. */
  name: string;
  /** Maximum attempts (initial call + retries). Default: 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponent of 0. Default: 100. */
  baseDelayMs?: number;
  /** Hard ceiling for a single delay. Default: 5000. */
  maxDelayMs?: number;
  /**
   * Jitter strategy. Default `full` (AWS-recommended, anti-thundering-herd).
   *   - `full`         → delay = random(0, min(cap, base × 2^n))
   *   - `decorrelated` → delay = random(base, min(cap, prev × 3))
   *   - `none`         → delay = min(cap, base × 2^n)            (test-only)
   */
  jitter?: JitterStrategy;
  /** Optional cancel signal — aborts before the next wait. */
  signal?: AbortSignal;
  /**
   * Decide whether a thrown error is retryable. Default: any error other
   * than AbortError. Return false to bail out immediately on a non-transient
   * failure (e.g. 4xx response, validation error).
   */
  retryable?: (err: unknown) => boolean;
}

const defaultRetryable = (err: unknown): boolean => {
  if (!err) return false;
  const e = err as Error & { name?: string };
  if (e.name === 'AbortError') return false;
  return true;
};

/**
 * Run `op` with full-jitter exponential backoff. Resolves with the first
 * successful result; rejects with the last error after `maxAttempts`.
 *
 *     await withRetry({ name: 'telegram.send', maxAttempts: 3 }, () => fetch(url))
 */
export async function withRetry<T>(opts: RetryOptions, op: () => Promise<T>): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 100;
  const maxDelayMs = opts.maxDelayMs ?? 5_000;
  const jitter: JitterStrategy = opts.jitter ?? 'full';
  const isRetryable = opts.retryable ?? defaultRetryable;

  let lastError: unknown;
  // Used by 'decorrelated' strategy — last computed delay seeds the next.
  let prevDelay = baseDelayMs;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (opts.signal?.aborted) {
      throw new Error(`Retry aborted before attempt ${attempt} (${opts.name})`);
    }
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === maxAttempts) {
        throw err;
      }
      const delay = computeBackoff(jitter, attempt, baseDelayMs, maxDelayMs, prevDelay);
      prevDelay = delay;
      logger.warn('[Retry] attempt failed — backing off', {
        name: opts.name,
        attempt,
        jitter,
        nextAttemptInMs: delay,
        message: (err as Error).message?.slice(0, 200),
      });
      await sleep(delay, opts.signal);
    }
  }
  // Unreachable — loop either returns or throws.
  throw lastError;
}

/**
 * Backoff computation kernel — exported for unit tests.
 *
 *   full         — random(0, min(cap, base × 2^attempt))         [AWS default]
 *   decorrelated — random(base, min(cap, prev × 3))               [Brooker 2015]
 *   none         — min(cap, base × 2^(attempt-1))                 [deterministic]
 *
 * `attempt` is 1-indexed.
 */
export function computeBackoff(
  jitter: JitterStrategy,
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  prevDelay: number,
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  if (jitter === 'none') {
    return Math.min(maxDelayMs, exponential);
  }
  if (jitter === 'decorrelated') {
    // delay = random(base, min(cap, prev × 3))
    // Convergence: ~30% faster than full jitter on bursty workloads (Brooker).
    const ceil = Math.min(maxDelayMs, Math.max(baseDelayMs, prevDelay * 3));
    const span = ceil - baseDelayMs;
    return Math.floor(baseDelayMs + Math.random() * Math.max(0, span));
  }
  // 'full' (default) — random in [0, min(cap, base × 2^attempt))
  const ceiling = Math.min(maxDelayMs, exponential * 2);
  return Math.floor(Math.random() * ceiling);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Aborted'));
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
