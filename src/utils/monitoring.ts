import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Performance Monitoring Utility
 * Tracks Core Web Vitals and sends to analytics endpoint
 *
 * Note: FID (First Input Delay) has been replaced with INP (Interaction to Next Paint)
 * in web-vitals v4 as a more comprehensive responsiveness metric.
 */

interface AnalyticsPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Send metric to analytics endpoint
 * Replace with your actual analytics service (Google Analytics, Plausible, etc.)
 */
function sendToAnalytics(_payload: AnalyticsPayload): void {
  // In production, send to your analytics service
  if (import.meta.env.PROD) {
    // Example: navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
  }
}

/**
 * Format metric for analytics
 */
function formatMetric({ name, value, rating, delta, id }: Metric): AnalyticsPayload {
  return {
    name,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    rating,
    delta: Math.round(name === 'CLS' ? delta * 1000 : delta),
    id,
  };
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app entry point (e.g., index.tsx)
 */
export function initWebVitals(): void {
  // Cumulative Layout Shift
  onCLS((metric) => sendToAnalytics(formatMetric(metric)));

  // First Contentful Paint
  onFCP((metric) => sendToAnalytics(formatMetric(metric)));

  // Interaction to Next Paint (replaces FID in web-vitals v4)
  onINP((metric) => sendToAnalytics(formatMetric(metric)));

  // Largest Contentful Paint
  onLCP((metric) => sendToAnalytics(formatMetric(metric)));

  // Time to First Byte
  onTTFB((metric) => sendToAnalytics(formatMetric(metric)));
}

/**
 * Custom error boundary logger
 * Use this in React Error Boundaries to track unhandled errors
 */
export function logError(_error: Error, _errorInfo?: { componentStack?: string }): void {
  if (import.meta.env.PROD) {
    // Send to error tracking service (Sentry, Rollbar, etc.)
  }
}
