export interface AnalyticsEvent {
  type: 'click' | 'view' | 'scroll' | 'error' | 'navigation';
  target?: string;
  path: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class MatrixAnalytics {
  private static instance: MatrixAnalytics;
  private buffer: AnalyticsEvent[] = [];

  private constructor() {
    this.hookInteractions();
  }

  public static getInstance(): MatrixAnalytics {
    if (!MatrixAnalytics.instance) {
      MatrixAnalytics.instance = new MatrixAnalytics();
    }
    return MatrixAnalytics.instance;
  }

  // Auto-track clicks via delegation
  private hookInteractions() {
    if (typeof window === 'undefined') return;

    document.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement;
        // Identify clickable elements (heuristics)
        const clickable = target.closest('button, a, [role="button"]');

        if (clickable) {
          const label =
            clickable.getAttribute('aria-label') ||
            clickable.textContent ||
            clickable.id ||
            'unknown';
          this.track({
            type: 'click',
            target: label.substring(0, 50), // Truncate
            path: window.location.pathname,
            timestamp: Date.now(),
          });
        }
      },
      { passive: true },
    );
  }

  public track(event: AnalyticsEvent) {
    this.buffer.push(event);
    // Persist to session for Oracle consumption
    try {
      const history = JSON.parse(sessionStorage.getItem('matrix_events') || '[]');
      // Keep last 100 events
      const newHistory = [...history, event].slice(-100);
      sessionStorage.setItem('matrix_events', JSON.stringify(newHistory));
    } catch (_e) {
      // Storage quota full
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(sessionStorage.getItem('matrix_events') || '[]');
    } catch {
      return [];
    }
  }
}

export const matrixAnalytics = MatrixAnalytics.getInstance();
