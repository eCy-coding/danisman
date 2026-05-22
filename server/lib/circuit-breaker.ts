/**
 * P14-BE: Minimal, dependency-free circuit breaker.
 *
 * State machine:
 *   CLOSED   → request flows through, failures counted.
 *   OPEN     → request rejected immediately (fail-fast), zero downstream traffic.
 *   HALF_OPEN → one probe allowed through; success → CLOSED, failure → OPEN.
 *
 * Defaults are tuned for "external 3rd-party HTTP call" workloads:
 *   - failureThreshold: 5 consecutive failures before tripping
 *   - openMs: 30s cooldown before allowing a probe
 *   - probeTimeoutMs: an additional safety cap on the probe call
 *
 * No process-wide singleton — each external dependency creates its own
 * breaker instance with a label that ends up in logs and metrics. This
 * way a Telegram outage cannot also fail Sentry calls.
 *
 * Why hand-rolled rather than `opossum`?
 *   - 7-line implementation, zero npm install
 *   - No native bindings (sandbox-safe, arm64-safe)
 *   - Fully typed, no `any`, no `@types/opossum` shim
 */

import { logger } from '../config/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Human-readable label included in every log line. */
  name: string;
  /** Consecutive failures before tripping. Default: 5. */
  failureThreshold?: number;
  /** Milliseconds the breaker stays OPEN before allowing a probe. Default: 30_000. */
  openMs?: number;
  /** Optional per-call timeout enforced on top of any caller timeout. */
  callTimeoutMs?: number;
  /**
   * P21-BE: jitter ratio applied to the OPEN→HALF_OPEN cooldown.
   * `0` reproduces the deterministic legacy behaviour; default `0.2` (±20%)
   * is the AWS-recommended setting for anti-thundering-herd.
   */
  cooldownJitterRatio?: number;
}

export class CircuitOpenError extends Error {
  readonly code = 'CIRCUIT_OPEN';
  constructor(name: string) {
    super(`Circuit "${name}" is OPEN`);
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private nextProbeAt = 0;
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly openMs: number;
  private readonly callTimeoutMs: number | undefined;

  /**
   * P21-BE: jitter ratio applied to the half-open cooldown. 0 = deterministic
   * (legacy behaviour), 0.2 = uniform ±20% noise. Eliminates the case where
   * N independent breakers, all tripped by the same downstream outage, probe
   * at exactly the same instant and re-trip the dependency (thundering herd).
   */
  private readonly jitterRatio: number;

  constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.openMs = opts.openMs ?? 30_000;
    this.callTimeoutMs = opts.callTimeoutMs;
    this.jitterRatio = clampRatio(opts.cooldownJitterRatio ?? 0.2);
  }

  /**
   * Run `op` through the breaker. If the circuit is OPEN and the cooldown
   * has not yet elapsed, throws CircuitOpenError immediately (fail-fast).
   * Otherwise runs the op and updates state based on the outcome.
   */
  async run<T>(op: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now < this.nextProbeAt) {
        throw new CircuitOpenError(this.name);
      }
      // Cooldown elapsed — allow a single probe.
      this.state = 'HALF_OPEN';
      logger.info('[CircuitBreaker] HALF_OPEN — probing', { name: this.name });
    }

    try {
      const result =
        this.callTimeoutMs != null
          ? await withTimeout(op(), this.callTimeoutMs, this.name)
          : await op();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state !== 'CLOSED') {
      logger.info('[CircuitBreaker] CLOSED — probe succeeded', { name: this.name });
    }
    this.state = 'CLOSED';
    this.failures = 0;
  }

  private onFailure(err: unknown): void {
    this.failures++;
    if (this.state === 'HALF_OPEN') {
      // Probe failed — back to OPEN with a fresh cooldown.
      this.trip(err);
      return;
    }
    if (this.failures >= this.failureThreshold) {
      this.trip(err);
    }
  }

  private trip(err: unknown): void {
    this.state = 'OPEN';
    // P21-BE: ±jitterRatio × openMs noise on the cooldown so that N breakers
    // tripped by the same upstream outage don't probe in lock-step.
    const noise =
      this.jitterRatio === 0 ? 0 : (Math.random() * 2 - 1) * this.jitterRatio * this.openMs;
    const cooldown = Math.max(0, Math.round(this.openMs + noise));
    this.nextProbeAt = Date.now() + cooldown;
    logger.warn('[CircuitBreaker] OPEN — tripping', {
      name: this.name,
      failures: this.failures,
      openMs: this.openMs,
      cooldownMs: cooldown,
      lastError: (err as Error).message?.slice(0, 200),
    });
  }

  /** Test-only: inspect current state. */
  getState(): { state: CircuitState; failures: number; nextProbeAt: number } {
    return { state: this.state, failures: this.failures, nextProbeAt: this.nextProbeAt };
  }

  /** Test-only: reset to closed state. */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextProbeAt = 0;
  }
}

function clampRatio(r: number): number {
  if (!Number.isFinite(r) || r < 0) return 0;
  if (r > 1) return 1;
  return r;
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
