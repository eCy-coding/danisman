/**
 * Kubernetes-standard health endpoints — Sprint 10 Phase 10B (P46)
 *
 * Two endpoints, two roles:
 *
 *   GET /healthz   — liveness probe. Process responsive? Returns 200 always
 *                    (DB/Redis NOT called). If this 503s, K8s/Render kills
 *                    the pod. Keep cheap, keep deterministic.
 *
 *   GET /readyz    — readiness probe. Critical deps reachable? Returns 503
 *                    when DB is down (rotate pod out of traffic). Optional
 *                    deps degraded → 200 with `status: degraded` envelope.
 *
 * Why the `z` suffix:
 *   Kubernetes uses `/healthz` (Brendan Burns convention) to avoid
 *   collisions with application namespaces. We adopt it alongside the
 *   existing `/health` + `/ready` (which remain for backward compatibility
 *   with our previous Render config and external monitors).
 *
 * Rate-limit bypass: paths are added to `server/middleware/health-probe.ts`
 * `HEALTH_PATHS` Set so platform probes never burn the anonymous tier.
 *
 * Caching: `Cache-Control: no-store` on every response. We never want a CDN
 * to serve a cached "ok" during a real outage.
 */

import { Router } from 'express';
import {
  probeDatabase,
  probeRedis,
  probeSentry,
  aggregateReadiness,
  PROBE_BUDGETS,
  type ProbeResult,
} from '../lib/health/probes';

const router = Router();

const SERVICE_VERSION = process.env.npm_package_version || process.env.RELEASE_VERSION || '1.0.0';

/**
 * Liveness — fast path. NO external calls. If this endpoint can render JSON,
 * the event loop is alive. K8s `livenessProbe` should target this.
 */
router.get('/healthz', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness — DB (critical) + Redis (optional, degrade) + Sentry (presence).
 * Probes run in parallel via Promise.all; total wall-clock is bounded by the
 * slowest probe (DB at PROBE_BUDGETS.db).
 *
 * Response envelope mirrors the existing `/ready` route so observability
 * tooling (Render dashboard, Better Uptime) sees a stable shape across the
 * legacy and K8s-standard paths.
 */
router.get('/readyz', async (_req, res) => {
  const startedAt = Date.now();

  const [db, redisCheck] = await Promise.all([probeDatabase(), probeRedis()]);
  const sentryCheck: ProbeResult = probeSentry();

  const checks = { db, redis: redisCheck, sentry: sentryCheck } as const;
  const { overall, httpStatus } = aggregateReadiness(checks);

  res.setHeader('Cache-Control', 'no-store');
  res.status(httpStatus).json({
    status: overall === 'not_ready' ? 'not_ready' : overall === 'degraded' ? 'degraded' : 'ok',
    service: 'ecypro-api',
    version: SERVICE_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startedAt,
    budgets: PROBE_BUDGETS,
    checks,
  });
});

export default router;
