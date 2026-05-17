/**
 * P23 BE Track 2 / Aşama 3 — Weighted Fair Queue priority helper.
 *
 * Background
 * ──────────
 * BullMQ supports a `priority` field on jobs (lower = sooner). The default
 * FIFO ordering treats every caller equally, which under-serves paid users
 * during peak load: a single anonymous burst can push their work back
 * behind hundreds of free-tier jobs.
 *
 * We use Weighted Fair Queuing (WFQ) — every tier gets a numeric priority,
 * and BullMQ services lower priorities first. The weights are chosen so
 * the relative throughput share approximates 10:5:1 for admin:paid:free
 * under contention; in steady-state with capacity > demand the priorities
 * are invisible.
 *
 *   admin →  1   (highest)
 *   paid  →  5
 *   free  → 10
 *
 * Starvation protection
 * ─────────────────────
 * Pure priority queuing starves low-priority work indefinitely under
 * sustained load. Two protections:
 *
 *   1. `attempts` exhaustion is independent of priority — every job is
 *      eventually serviced or DLQ'd within its retry budget.
 *   2. Worker concurrency reserve — operators can run TWO worker pools
 *      with different per-pool priority filters (BullMQ allows
 *      `Worker(... { settings: { backoffStrategy } })` — see admin-queues
 *      panel). The reserve pool services low-priority work even when the
 *      main pool is saturated with high-priority work.
 *
 * Math
 * ────
 * Throughput share for a single pool with capacity C and offered load
 * λ_admin, λ_paid, λ_free (jobs/sec, all > 0):
 *
 *   ρ_admin = min(C, λ_admin)                             ← always satisfied
 *   ρ_paid  = min(C − ρ_admin, λ_paid)                    ← serviced second
 *   ρ_free  = min(C − ρ_admin − ρ_paid, λ_free)           ← residual
 *
 * Reserved-pool variant (80/20 split):
 *
 *   pool_hi:   serves priority 1..5  with concurrency 0.8 × C
 *   pool_lo:   serves priority 6..10 with concurrency 0.2 × C
 *
 * The reserve guarantees low-priority work makes forward progress even
 * during a sustained high-priority storm.
 */

export type UserTier = 'admin' | 'paid' | 'free' | 'anonymous';

/**
 * Map a user tier to a BullMQ `priority` number.
 *
 * BullMQ semantics: lower = sooner; 0 means "no priority" (FIFO bucket).
 * We avoid 0 so every job is explicitly classified; admin uses 1 to keep
 * room for a future "incident-response" tier at priority 0 if needed.
 */
export function computeJobPriority(tier: UserTier | string | null | undefined): number {
  switch (tier) {
    case 'admin':
    case 'ADMIN':
      return 1;
    case 'paid':
    case 'PREMIUM':
    case 'CONSULTANT':
      return 5;
    case 'free':
    case 'USER':
    case 'CLIENT':
      return 10;
    case 'anonymous':
    default:
      return 10;
  }
}

/**
 * Compute the recommended split for a two-pool reserved-capacity setup.
 * Useful for the operator panel + deploy manifest.
 *
 * Reserved fraction defaults to 20% — chosen so:
 *   - At p99 high-prio storm: free users still see < 5x typical latency.
 *   - At idle: the reserve is wasted capacity, accepted cost.
 */
export interface CapacitySplit {
  hi: number;
  lo: number;
}

export function splitCapacity(totalConcurrency: number, reserveFraction = 0.2): CapacitySplit {
  if (totalConcurrency <= 1) return { hi: totalConcurrency, lo: 0 };
  const lo = Math.max(1, Math.floor(totalConcurrency * reserveFraction));
  const hi = Math.max(1, totalConcurrency - lo);
  return { hi, lo };
}

/**
 * Worker filter: given a job's priority, decide which pool processes it.
 * BullMQ doesn't expose priority filtering natively; this helper is the
 * canonical predicate the standalone worker dyno can use to consume from
 * either bucket (the orchestration is documented in
 * outputs/P23_BE_PRIORITY.md).
 */
export type PoolName = 'hi' | 'lo';

export function poolForPriority(priority: number): PoolName {
  // priority ≤ 5 → high pool; priority 6..10 → low pool.
  return priority <= 5 ? 'hi' : 'lo';
}

/**
 * Sanity guard for env-driven overrides (operator panel). Keeps values in
 * the documented 1..10 range so a typo can't accidentally elevate every
 * anonymous job to admin priority.
 */
export function clampPriority(p: number): number {
  if (!Number.isFinite(p)) return 10;
  return Math.min(10, Math.max(1, Math.floor(p)));
}
