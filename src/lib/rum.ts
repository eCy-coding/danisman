/**
 * P13/2 — Real User Monitoring (RUM).
 *
 * P76: Converted to use lazy Sentry reference from sentry.ts instead of
 * eagerly importing @sentry/react. This prevents the 259KB Sentry chunk
 * from being pulled into the initial bundle via rum.ts.
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { Logger } from './logger';
import { initRumStats, recordVitalSample, setRumRoute } from './rum-stats';
import { sentry } from './sentry';

// ── Sample rate ──────────────────────────────────────────────────────────────

function rumSampleRate(): number {
  const raw = import.meta.env.VITE_RUM_SAMPLE_RATE;
  if (raw !== undefined) {
    const n = Number.parseFloat(String(raw));
    if (!Number.isNaN(n) && n >= 0 && n <= 1) return n;
  }
  return import.meta.env.MODE === 'production' ? 0.1 : 1.0;
}

const sampled = Math.random() < rumSampleRate();

// ── Web Vital → Sentry measurement ──────────────────────────────────────────

const VITAL_UNIT: Record<string, string> = {
  CLS: '',
  FCP: 'millisecond',
  INP: 'millisecond',
  LCP: 'millisecond',
  TTFB: 'millisecond',
};

function reportToSentry(metric: Metric): void {
  if (!sampled) return;
  const Sentry = sentry.module;
  if (!Sentry) return; // Sentry not yet loaded — skip silently

  recordVitalSample(metric);

  try {
    Sentry.setMeasurement(
      metric.name.toLowerCase(),
      metric.value,
      VITAL_UNIT[metric.name] ?? 'millisecond',
    );
  } catch {
    /* setMeasurement throws if no active transaction */
  }

  Sentry.addBreadcrumb({
    category: 'web-vital',
    message: `${metric.name}=${Math.round(metric.value)}`,
    level: metric.rating === 'poor' ? 'warning' : 'info',
    data: {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    },
  });

  if (metric.rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name}`, {
      level: 'warning',
      tags: { vital: metric.name, rating: metric.rating },
      contexts: {
        vital: {
          value: metric.value,
          delta: metric.delta,
          id: metric.id,
          route: window.location.pathname,
        },
      },
    });
  }
}

// ── Public init ──────────────────────────────────────────────────────────────

let initialized = false;

export function initRUM(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window === 'undefined') return;

  Logger.debug(`[RUM] init — sampled=${sampled} mode=${import.meta.env.MODE}`);

  if (sampled) {
    initRumStats();
  }

  onCLS(reportToSentry);
  onFCP(reportToSentry);
  onINP(reportToSentry);
  onLCP(reportToSentry);
  onTTFB(reportToSentry);
}

/** Router route-change hook */
export function notifyRouteChange(pathname: string): void {
  setRumRoute(pathname);
}

// ── Critical-path custom transactions ────────────────────────────────────────

/**
 * Wrap a critical async op so it appears as a Sentry transaction.
 * P76: Uses lazy Sentry ref; falls back to plain execution if not loaded.
 */
export async function tracedOp<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  const Sentry = sentry.module;
  if (!Sentry) return fn();
  return Sentry.startSpan({ name, op }, async () => fn());
}

/** Sync variant. */
export function tracedSync<T>(name: string, op: string, fn: () => T): T {
  const Sentry = sentry.module;
  if (!Sentry) return fn();
  return Sentry.startSpan({ name, op }, () => fn());
}
