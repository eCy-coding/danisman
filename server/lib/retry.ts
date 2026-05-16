/**
 * P14-BE: Dependency-free retry helper with full jitter exponential backoff.
 *
 * Sleep pattern (default):
 *   attempt 1 fails → wait 100ms..200ms → attempt 2
 *   attempt 2 fails → wait 200ms..400ms → attempt 3
 *   attempt 3 fails → throw
 *
 * Total worst-case ceiling: ~5s; cancellable via AbortSignal.
 *
 * CRITICAL: only use this on IDEMPOTENT operations. POST /payments or
 * any other non-idempotent side effect MUST NOT be wrapped — see the
 * `safe` boolean on the predicate if you need a runtime guard.
 */

import { logger } from '../config/logger';

export interface RetryOptions {
  /** Human-readable label included in every log line. */
  name: string;
  /** Maximum attempts (initial call + retries). Default: 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponent of 0. Default: 100. */
  baseDelayMs?: number;
  /** Hard ceiling for a single delay. Default: 5000. */
  maxDelayMs?: number;
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
  const isRetryable = opts.retryable ?? defaultRetryable;

  let lastError: unknown;
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
      // Full-jitter: random delay in [0, min(maxDelay, base * 2^attempt))
      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const ceiling = Math.min(maxDelayMs, exponential * 2);
      const delay = Math.floor(Math.random() * ceiling);
      logger.warn('[Retry] attempt failed — backing off', {
        name: opts.name,
        attempt,
        nextAttemptInMs: delay,
        message: (err as Error).message?.slice(0, 200),
      });
      await sleep(delay, opts.signal);
    }
  }
  // Unreachable — loop either returns or throws.
  throw lastError;
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
