/**
 * Web Vitals → PostHog bridge.
 * Captures CLS, FCP, INP, LCP, TTFB only when analytics consent is active.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { getPostHog } from '../posthog';

export const VITAL_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITAL_THRESHOLDS[name];
  if (!threshold) return 'needs-improvement';
  if (value <= threshold.good) return 'good';
  if (value > threshold.poor) return 'poor';
  return 'needs-improvement';
}

export function initWebVitalsPostHog(): void {
  const handleMetric = async (metric: Metric): Promise<void> => {
    try {
      const ph = await getPostHog();
      if (!ph) return;
      if (!ph.has_opted_in_capturing()) return;
      ph.capture('web_vital', {
        name: metric.name,
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        id: metric.id,
      });
    } catch {
      // Silently swallow — vitals reporting must never break the host feature
    }
  };

  try {
    onCLS(handleMetric);
  } catch {
    /* ignore registration failure */
  }
  try {
    onFCP(handleMetric);
  } catch {
    /* ignore registration failure */
  }
  try {
    onINP(handleMetric);
  } catch {
    /* ignore registration failure */
  }
  try {
    onLCP(handleMetric);
  } catch {
    /* ignore registration failure */
  }
  try {
    onTTFB(handleMetric);
  } catch {
    /* ignore registration failure */
  }
}
