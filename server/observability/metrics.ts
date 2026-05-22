/**
 * P18 BE Track 2 / Aşama 2 — Prometheus metrics registry.
 *
 * Exposes the canonical `/metrics` scrape endpoint and a small set of
 * typed helpers (`metrics.incHttpRequests`, `metrics.observeHttpDuration`,
 * `metrics.incCache`, `metrics.observeBullmq`) that the rest of the
 * server emits to.
 *
 * Design:
 *   - `prom-client` is loaded dynamically (`require`) so the file
 *     compiles cleanly when the dep isn't installed. When missing the
 *     helpers degrade to no-ops and the `/metrics` endpoint returns
 *     a tiny synthetic exposition so an operator can still confirm
 *     the route is wired.
 *   - Default metrics (process_*, nodejs_heap_*) are collected via
 *     `collectDefaultMetrics({ register })` so the scrape covers the
 *     usual SRE staples.
 *   - Custom metrics:
 *       http_requests_total{method, route, status}
 *       http_request_duration_seconds{method, route} histogram
 *       cache_hits_total{cache_name}
 *       cache_misses_total{cache_name}
 *       bullmq_jobs_total{queue, status}     status ∈ enqueued|done|failed
 *       bullmq_jobs_pending{queue}            gauge, sampled at scrape time
 *       db_pool_active                        gauge
 *       db_pool_idle                          gauge
 *
 *   - Route label cardinality is bounded by the route normaliser
 *     (`normaliseRouteLabel`) — UUIDs/integers in the path become `:id`
 *     so we don't blow up Prometheus cardinality.
 *
 * Authentication for the scrape endpoint is wired by the caller via
 * the existing tier-rate-limiter middleware + an optional bearer token
 * env (METRICS_BEARER). Both checks live in `server/routes/metrics.ts`.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { logger } from '../config/logger';

// ── prom-client loader ───────────────────────────────────────────────────────

interface PromCounter {
  inc(labels: Record<string, string | number>, value?: number): void;
  inc(value?: number): void;
}
interface PromHistogram {
  observe(labels: Record<string, string | number>, value: number): void;
  observe(value: number): void;
}
interface PromGauge {
  set(labels: Record<string, string | number>, value: number): void;
  set(value: number): void;
}

interface PromClientModule {
  Registry: new () => {
    metrics(): Promise<string>;
    contentType: string;
    registerMetric(metric: unknown): void;
  };
  collectDefaultMetrics(opts: { register: unknown; prefix?: string }): void;
  Counter: new (cfg: {
    name: string;
    help: string;
    labelNames?: string[];
    registers?: unknown[];
  }) => PromCounter;
  Histogram: new (cfg: {
    name: string;
    help: string;
    labelNames?: string[];
    buckets?: number[];
    registers?: unknown[];
  }) => PromHistogram;
  Gauge: new (cfg: {
    name: string;
    help: string;
    labelNames?: string[];
    registers?: unknown[];
    collect?: () => void | Promise<void>;
  }) => PromGauge;
}

let promMod: PromClientModule | null | undefined;

function loadProm(): PromClientModule | null {
  if (promMod !== undefined) return promMod;
  try {
    promMod = require('prom-client') as PromClientModule;
  } catch {
    promMod = null;
  }
  return promMod;
}

// ── Registry + metric handles ────────────────────────────────────────────────

interface MetricHandles {
  registry: InstanceType<PromClientModule['Registry']> | null;
  httpRequestsTotal: PromCounter | null;
  httpRequestDurationSeconds: PromHistogram | null;
  cacheHitsTotal: PromCounter | null;
  cacheMissesTotal: PromCounter | null;
  bullmqJobsTotal: PromCounter | null;
  bullmqJobsPending: PromGauge | null;
  dbPoolActive: PromGauge | null;
  dbPoolIdle: PromGauge | null;
}

let handles: MetricHandles | null = null;

function ensureRegistry(): MetricHandles {
  if (handles) return handles;
  const mod = loadProm();
  if (!mod) {
    handles = {
      registry: null,
      httpRequestsTotal: null,
      httpRequestDurationSeconds: null,
      cacheHitsTotal: null,
      cacheMissesTotal: null,
      bullmqJobsTotal: null,
      bullmqJobsPending: null,
      dbPoolActive: null,
      dbPoolIdle: null,
    };
    logger.warn('[metrics] prom-client unavailable — /metrics emits synthetic output');
    return handles;
  }

  const registry = new mod.Registry();
  mod.collectDefaultMetrics({ register: registry, prefix: 'ecypro_' });

  const httpRequestsTotal = new mod.Counter({
    name: 'http_requests_total',
    help: 'HTTP requests served, by method/route/status',
    labelNames: ['method', 'route', 'status'],
    registers: [registry],
  });

  const httpRequestDurationSeconds = new mod.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency in seconds, by method/route',
    labelNames: ['method', 'route'],
    // Tuned for an HTTP API: 10ms .. 5s. Anything past 5s should bucket high.
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const cacheHitsTotal = new mod.Counter({
    name: 'cache_hits_total',
    help: 'In-process cache hits, by cache name',
    labelNames: ['cache_name'],
    registers: [registry],
  });
  const cacheMissesTotal = new mod.Counter({
    name: 'cache_misses_total',
    help: 'In-process cache misses, by cache name',
    labelNames: ['cache_name'],
    registers: [registry],
  });

  const bullmqJobsTotal = new mod.Counter({
    name: 'bullmq_jobs_total',
    help: 'BullMQ jobs lifecycle counter, by queue + status',
    labelNames: ['queue', 'status'],
    registers: [registry],
  });
  const bullmqJobsPending = new mod.Gauge({
    name: 'bullmq_jobs_pending',
    help: 'Pending BullMQ jobs (waiting + delayed) by queue',
    labelNames: ['queue'],
    registers: [registry],
  });

  const dbPoolActive = new mod.Gauge({
    name: 'db_pool_active',
    help: 'pg pool: active connections in use',
    registers: [registry],
  });
  const dbPoolIdle = new mod.Gauge({
    name: 'db_pool_idle',
    help: 'pg pool: idle connections',
    registers: [registry],
  });

  handles = {
    registry,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    cacheHitsTotal,
    cacheMissesTotal,
    bullmqJobsTotal,
    bullmqJobsPending,
    dbPoolActive,
    dbPoolIdle,
  };
  return handles;
}

// ── Label sanitisation ──────────────────────────────────────────────────────

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const NUMERIC_RE = /^\d+$/;
const HEX_RE = /^[0-9a-f]{12,}$/i;

/**
 * Collapses dynamic path segments to placeholders so route cardinality
 * stays bounded. The Express layer hands us `req.route?.path` (e.g.
 * `/admin/api-keys/:id`) when available; we still strip any concrete
 * IDs that leaked through when no matching route was hit (404s).
 */
export function normaliseRouteLabel(path: string): string {
  if (!path) return '<unmatched>';
  // Already a parameterised path (`/admin/api-keys/:id`) — leave it.
  if (path.includes('/:')) return path;
  const parts = path.split('/').map((seg) => {
    if (!seg) return seg;
    if (UUID_RE.test(seg)) return ':uuid';
    if (NUMERIC_RE.test(seg)) return ':num';
    if (HEX_RE.test(seg)) return ':hex';
    return seg;
  });
  return parts.join('/');
}

// ── Public helper API ───────────────────────────────────────────────────────

export const metrics = {
  /** Emit a request lifecycle increment + duration sample. Safe under
   *  prom-client-absent (no-op). */
  observeHttpRequest(method: string, route: string, status: number, durationSeconds: number): void {
    const h = ensureRegistry();
    if (!h.httpRequestsTotal || !h.httpRequestDurationSeconds) return;
    const labels = { method, route, status: String(status) };
    h.httpRequestsTotal.inc(labels);
    h.httpRequestDurationSeconds.observe({ method, route }, durationSeconds);
  },

  incCache(name: string, kind: 'hit' | 'miss'): void {
    const h = ensureRegistry();
    if (kind === 'hit') h.cacheHitsTotal?.inc({ cache_name: name });
    else h.cacheMissesTotal?.inc({ cache_name: name });
  },

  incBullmq(queue: string, status: 'enqueued' | 'done' | 'failed' | 'inline' | 'dropped'): void {
    const h = ensureRegistry();
    h.bullmqJobsTotal?.inc({ queue, status });
  },

  setBullmqPending(queue: string, value: number): void {
    const h = ensureRegistry();
    h.bullmqJobsPending?.set({ queue }, value);
  },

  setDbPool(active: number, idle: number): void {
    const h = ensureRegistry();
    h.dbPoolActive?.set(active);
    h.dbPoolIdle?.set(idle);
  },

  /** Render the full Prometheus text exposition (or a synthetic one when
   *  prom-client is unavailable). */
  async render(): Promise<{ body: string; contentType: string }> {
    const h = ensureRegistry();
    if (!h.registry) {
      const synthetic = [
        '# prom-client not installed — synthetic exposition only',
        '# HELP ecypro_metrics_backend Whether the prom-client backend is wired',
        '# TYPE ecypro_metrics_backend gauge',
        'ecypro_metrics_backend{backend="synthetic"} 0',
      ].join('\n');
      return { body: synthetic + '\n', contentType: 'text/plain; version=0.0.4' };
    }
    const body = await h.registry.metrics();
    return { body, contentType: h.registry.contentType };
  },
};

// ── Test seam ───────────────────────────────────────────────────────────────

export const _metricsTesting = {
  reset(): void {
    handles = null;
    promMod = undefined;
  },
};
