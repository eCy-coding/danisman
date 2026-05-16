/**
 * P13/2 — Real User Monitoring (RUM).
 *
 * Web Vitals çıktısını TEK boru üzerinden hem (1) Sentry'ye custom
 * measurement olarak hem de (2) backend beacon kanalına (`/api/analytics/interaction`)
 * gönderir. Mevcut `src/lib/monitor.ts` beacon path'ini koruyoruz; bu modül
 * onu Sentry tarafıyla zenginleştiriyor + sample rate kontrolü ekliyor.
 *
 * Tasarım kararları:
 *   - Sample rate prod %10, dev %100 — `VITE_RUM_SAMPLE_RATE` env override.
 *   - Custom transaction'lar: route change, form submit, hero render — Sentry
 *     trace dashboard'unda P75/P95 alarm tetiklemesi için.
 *   - Sentry zaten `browserTracingIntegration()` çalıştırıyor (sentry.ts); biz
 *     ona sadece `setMeasurement` ile Web Vital sayılarını ekliyoruz.
 *   - Consent-aware: AnalyticsProvider'daki cookie consent inactive ise
 *     beacon atılmaz (RUM Sentry ile zaten kullanıcı izinli).
 */

import * as Sentry from '@sentry/react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { Logger } from './logger';

// ── Sample rate ───────────────────────────────────────────────────────────────

function rumSampleRate(): number {
  const raw = import.meta.env.VITE_RUM_SAMPLE_RATE;
  if (raw !== undefined) {
    const n = Number.parseFloat(String(raw));
    if (!Number.isNaN(n) && n >= 0 && n <= 1) return n;
  }
  return import.meta.env.MODE === 'production' ? 0.1 : 1.0;
}

const sampled = Math.random() < rumSampleRate();

// ── Web Vital → Sentry measurement ────────────────────────────────────────────

const VITAL_UNIT: Record<string, string> = {
  CLS: '', // unit-less ratio
  FCP: 'millisecond',
  INP: 'millisecond',
  LCP: 'millisecond',
  TTFB: 'millisecond',
};

function reportToSentry(metric: Metric): void {
  if (!sampled) return;

  // 1) Send as measurement on the current transaction so the Sentry
  //    Performance tab tags route loads with vital numbers.
  try {
    Sentry.setMeasurement(
      metric.name.toLowerCase(),
      metric.value,
      VITAL_UNIT[metric.name] ?? 'millisecond',
    );
  } catch {
    /* setMeasurement throws if no active transaction — safe to ignore */
  }

  // 2) Emit a typed event so we can dashboard / alert independent of trace
  //    sampling (transactions get pruned at high traffic; events don't).
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

  // 3) Poor-rating spike → captureMessage so on-call sees it without
  //    drilling into traces.
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

// ── Public init ───────────────────────────────────────────────────────────────

let initialized = false;

export function initRUM(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window === 'undefined') return;

  Logger.debug(`[RUM] init — sampled=${sampled} mode=${import.meta.env.MODE}`);

  onCLS(reportToSentry);
  onFCP(reportToSentry);
  onINP(reportToSentry);
  onLCP(reportToSentry);
  onTTFB(reportToSentry);
}

// ── Critical-path custom transactions ─────────────────────────────────────────

/**
 * Wrap a critical async op so it appears as a Sentry transaction with custom
 * `op` for dashboard filtering. Used by Contact form submit, ROI calc, etc.
 */
export async function tracedOp<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Sentry v8 API — startSpan returns the callback's value.
  return Sentry.startSpan({ name, op }, async () => fn());
}

/** Sync variant. */
export function tracedSync<T>(name: string, op: string, fn: () => T): T {
  return Sentry.startSpan({ name, op }, () => fn());
}
