/**
 * Health Probes — Sprint 10 Phase 10B (P46)
 *
 * Reusable, typed health probe primitives used by the Kubernetes-standard
 * `/healthz` (liveness) and `/readyz` (readiness) endpoints. Extracted from
 * the inline pattern previously living in `server/routes/index.ts` (`/ready`)
 * so future probe consumers can share a single source of truth.
 *
 * Why this exists:
 *   - K8s/Render style liveness vs readiness separation: liveness must NEVER
 *     hit DB/Redis (a slow probe loops the pod), readiness MAY hit critical
 *     deps (DB is hard requirement, Redis/Sentry/Telegram are optional).
 *   - Latency budgets are deliberately conservative — see PROBE_BUDGETS.
 *   - KVKK m.12 + GDPR Art.32 (availability) — operators need an honest
 *     readiness signal so traffic stops landing on broken instances.
 *
 * Constraints:
 *   - No `any`. `unknown` + type-narrow allowed when bridging external API
 *     shape (e.g. fetch().json()).
 *   - No PII in probe responses (detail strings sliced to 80 chars and
 *     scrubbed of message bodies).
 *   - No side effects beyond network probes (no log writes per-probe inside
 *     critical path — caller decides log policy).
 */

import { prisma } from '../../config/db';
import { redis } from '../../config/redis';

export type ProbeStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';

export interface ProbeResult {
  status: ProbeStatus;
  latencyMs?: number;
  detail?: string;
}

/**
 * Conservative per-probe latency budgets (milliseconds). Tuned so a single
 * `/readyz` call cannot exceed ~3 seconds wall-clock even if every optional
 * dep times out. Liveness has no budget — it must NOT call these.
 */
export const PROBE_BUDGETS = {
  db: 1500,
  redis: 500,
  telegram: 1500,
} as const;

/**
 * Run `fn` with a hard timeout. On timeout, resolve with `timeoutValue` so
 * the caller can decide the resulting `ProbeStatus`. Errors from `fn` are
 * caught and likewise mapped to `timeoutValue` (no rejection propagates).
 *
 * Returns the resolved value together with measured latency for telemetry.
 */
export async function measureWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutValue: T,
): Promise<{ value: T; latencyMs: number }> {
  const start = Date.now();
  const value = await Promise.race([
    fn().catch(() => timeoutValue),
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs)),
  ]);
  return { value, latencyMs: Date.now() - start };
}

/**
 * DB probe — `SELECT 1` via Prisma. Hard requirement for readiness; failure
 * MUST translate to 503 at the route layer so load balancers rotate the pod
 * out of traffic.
 */
export async function probeDatabase(): Promise<ProbeResult> {
  const probe = await measureWithTimeout(
    () => prisma.$queryRaw`SELECT 1`.then(() => 'ok' as const),
    PROBE_BUDGETS.db,
    'down' as const,
  );
  return { status: probe.value, latencyMs: probe.latencyMs };
}

/**
 * Redis probe — `PING`. Optional dependency: session store degrades to
 * in-memory fallback if Redis is unavailable, so a `down` result maps to
 * `degraded` (200 with envelope warning), not 503.
 */
export async function probeRedis(): Promise<ProbeResult> {
  const probe = await measureWithTimeout(
    () => redis.ping().then(() => 'ok' as const),
    PROBE_BUDGETS.redis,
    'degraded' as const,
  );
  return { status: probe.value, latencyMs: probe.latencyMs };
}

/**
 * Sentry probe — presence check only (DSN configured). We deliberately do
 * NOT make a network call to Sentry: it's a telemetry sink, not a critical
 * runtime dep, and adding a TCP roundtrip would inflate `/readyz` latency
 * for zero operational signal.
 */
export function probeSentry(): ProbeResult {
  if (process.env.SENTRY_DSN) return { status: 'ok' };
  return { status: 'unconfigured', detail: 'SENTRY_DSN not set' };
}

/**
 * Aggregate readiness verdict. Critical = DB only. Any optional dep being
 * `down` or `degraded` flips the envelope to `degraded` (still 200) so the
 * load balancer keeps the pod.
 */
export function aggregateReadiness(checks: {
  db: ProbeResult;
  redis: ProbeResult;
  sentry: ProbeResult;
}): { overall: 'ready' | 'degraded' | 'not_ready'; httpStatus: 200 | 503 } {
  if (checks.db.status !== 'ok') return { overall: 'not_ready', httpStatus: 503 };
  const optionalImpaired =
    checks.redis.status === 'down' ||
    checks.redis.status === 'degraded' ||
    checks.sentry.status === 'down';
  return optionalImpaired
    ? { overall: 'degraded', httpStatus: 200 }
    : { overall: 'ready', httpStatus: 200 };
}
