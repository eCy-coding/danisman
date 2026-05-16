import { Logger } from '../logger';

export interface Metric {
  name: 'LCP' | 'CLS' | 'INP' | 'FID' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export class MatrixObserver {
  private static instance: MatrixObserver;
  private metrics: Metric[] = [];
  private observer: PerformanceObserver | null = null;
  private memoryInterval: NodeJS.Timeout | null = null;
  private readonly REPORT_URL = '/api/matrix/telemetry'; // Placeholder for local endpoint

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initPerformanceObserver();
      this.startMemoryMonitoring();
      this.hookVisibilityChange();
    }
  }

  public static getInstance(): MatrixObserver {
    if (!MatrixObserver.instance) {
      MatrixObserver.instance = new MatrixObserver();
    }
    return MatrixObserver.instance;
  }

  private initPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Handle LCP
          if (entry.entryType === 'largest-contentful-paint') {
            const value = entry.startTime;
            this.logMetric('LCP', value);
          }
          // Handle CLS
          if (entry.entryType === 'layout-shift') {
            // @ts-expect-error - 'hadRecentInput' exists on LayoutShiftEntry but types might be outdated
            if (!entry.hadRecentInput) {
               // @ts-expect-error - 'value' exists on LayoutShiftEntry
              this.logMetric('CLS', entry.value);
            }
          }
          // Handle INP (approximate via first-input or event duration)
          if (entry.entryType === 'first-input') {
             this.logMetric('FID', entry.duration);
          }
        }
      });

      this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observer.observe({ type: 'layout-shift', buffered: true });
      this.observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // Observer init failed - browser compatibility or permission issue
    }
  }

  private logMetric(name: Metric['name'], value: number) {
    let rating: Metric['rating'] = 'good';
    // Basic Web Vitals thresholds
    if (name === 'LCP') {
      if (value > 2500) rating = 'needs-improvement';
      if (value > 4000) rating = 'poor';
    } else if (name === 'CLS') {
      if (value > 0.1) rating = 'needs-improvement';
      if (value > 0.25) rating = 'poor';
    } else if (name === 'INP' || name === 'FID') {
       if (value > 200) rating = 'needs-improvement';
       if (value > 500) rating = 'poor';
    }

    const metric: Metric = { name, value, rating };
    this.metrics.push(metric);
    
    // In dev, log specific poor metrics
    if (rating === 'poor') {
        Logger.warn(`[Matrix] Poor Performance Detected: ${name} = ${value.toFixed(2)}`);
    }
  }

  private startMemoryMonitoring() {
    // Check every 10 seconds in dev/preview
    this.memoryInterval = setInterval(() => {
        // @ts-expect-error - performance.memory is generic chrome extension
        const memory = performance.memory;
        if (memory) {
            const usedMB = memory.usedJSHeapSize / 1048576;
            // Leak detection heuristic: sustained growth > 200MB is potential concern
             if (usedMB > 200) {
                 // Silent log for Oracle dashboard
             }
        }
    }, 10000);
  }

  // P14 — store handler so dispose() can detach it (HMR-safe).
  private visibilityHandler: (() => void) | null = null;

  private hookVisibilityChange() {
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.flushData();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Release observers, timers, and listeners. Safe in HMR / test teardown.
   */
  public dispose() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private flushData() {
    if (this.metrics.length > 0) {
        // Use sendBeacon for reliability during unload
        const _blob = new Blob([JSON.stringify(this.metrics)], { type: 'application/json' });
        // navigator.sendBeacon(this.REPORT_URL, _blob); 
        // For now, we just keep it in memory for the Oracle dashboard or local storage
        try {
            const history = JSON.parse(sessionStorage.getItem('matrix_metrics') || '[]');
            sessionStorage.setItem('matrix_metrics', JSON.stringify([...history, ...this.metrics]));
        } catch (_e) {/* Ignore storage quota */}
        this.metrics = [];
    }
  }

  public getMetrics() {
      return [...JSON.parse(sessionStorage.getItem('matrix_metrics') || '[]'), ...this.metrics];
  }
}

export const matrixObserver = MatrixObserver.getInstance();
