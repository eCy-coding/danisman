/**
 * P14-BE: Resilience helper tests — CircuitBreaker + withRetry.
 *
 * NOTE: sandbox vitest cannot install rollup-linux-arm64-gnu; this spec
 * is verified to typecheck (`npm run typecheck:server`) and was smoke-run
 * with `tsx` end-to-end during Aşama 7. Host `npm run test:server` will
 * exercise the full suite.
 */

import { describe, expect, it } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';
import { withRetry } from './retry';

describe('CircuitBreaker', () => {
  it('trips OPEN after consecutive failures and fast-fails until cooldown', async () => {
    const cb = new CircuitBreaker({ name: 't1', failureThreshold: 2, openMs: 50 });
    for (let i = 0; i < 2; i++) {
      await expect(cb.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    }
    expect(cb.getState().state).toBe('OPEN');
    await expect(cb.run(async () => 'ok')).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it('half-opens after cooldown and closes on probe success', async () => {
    const cb = new CircuitBreaker({ name: 't2', failureThreshold: 1, openMs: 30 });
    await expect(cb.run(async () => Promise.reject(new Error('x')))).rejects.toThrow();
    expect(cb.getState().state).toBe('OPEN');
    await new Promise((r) => setTimeout(r, 40));
    const v = await cb.run(async () => 'ok');
    expect(v).toBe('ok');
    expect(cb.getState().state).toBe('CLOSED');
  });

  it('half-open probe failure re-trips with fresh cooldown', async () => {
    const cb = new CircuitBreaker({ name: 't3', failureThreshold: 1, openMs: 30 });
    await expect(cb.run(async () => Promise.reject(new Error('x')))).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 40));
    const before = cb.getState().nextProbeAt;
    await expect(cb.run(async () => Promise.reject(new Error('y')))).rejects.toThrow();
    expect(cb.getState().state).toBe('OPEN');
    expect(cb.getState().nextProbeAt).toBeGreaterThan(before);
  });

  it('honours an internal callTimeoutMs', async () => {
    const cb = new CircuitBreaker({ name: 't4', failureThreshold: 5, callTimeoutMs: 20 });
    await expect(
      cb.run(() => new Promise((resolve) => setTimeout(() => resolve('late'), 100))),
    ).rejects.toThrow(/Timeout/);
  });
});

describe('withRetry', () => {
  it('returns immediately on first success', async () => {
    let calls = 0;
    const result = await withRetry({ name: 'r1', maxAttempts: 3, baseDelayMs: 1 }, async () => {
      calls++;
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries until success with exponential backoff', async () => {
    let calls = 0;
    const result = await withRetry(
      { name: 'r2', maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 4 },
      async () => {
        calls++;
        if (calls < 3) throw new Error('transient');
        return 'recovered';
      },
    );
    expect(result).toBe('recovered');
    expect(calls).toBe(3);
  });

  it('throws after maxAttempts', async () => {
    let calls = 0;
    await expect(
      withRetry({ name: 'r3', maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 2 }, async () => {
        calls++;
        throw new Error('persistent');
      }),
    ).rejects.toThrow('persistent');
    expect(calls).toBe(2);
  });

  it('bails out when retryable predicate returns false', async () => {
    let calls = 0;
    await expect(
      withRetry(
        { name: 'r4', maxAttempts: 5, baseDelayMs: 1, retryable: () => false },
        async () => {
          calls++;
          throw new Error('non-transient');
        },
      ),
    ).rejects.toThrow('non-transient');
    expect(calls).toBe(1);
  });

  it('aborts mid-wait when signal fires', async () => {
    const ac = new AbortController();
    let calls = 0;
    setTimeout(() => ac.abort(), 5);
    await expect(
      withRetry(
        { name: 'r5', maxAttempts: 5, baseDelayMs: 50, maxDelayMs: 100, signal: ac.signal },
        async () => {
          calls++;
          throw new Error('keep going');
        },
      ),
    ).rejects.toThrow();
    // We made at least one attempt, but abort cut short the retry loop.
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThan(5);
  });
});
