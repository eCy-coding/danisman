/**
 * EcyPro — Sentry Error Reporting (Frontend)
 *
 * Initializes Sentry for production-grade error tracking, 
 * performance monitoring, and session replay.
 */
import * as Sentry from '@sentry/react';
import { Logger } from './logger';

interface SentryBreadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, unknown>;
}

class SentryClient {
  private initialized = false;

  init(): void {
    // Guard: prevent double initialization (React StrictMode calls useEffect twice)
    if (this.initialized) {
      Logger.debug('[Sentry] Already initialized — skipping duplicate init');
      return;
    }

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || dsn === 'https://mock@o0.ingest.sentry.io/0') {
      Logger.debug('[Sentry] No valid DSN configured — error reporting disabled');
      this.initialized = false;
      return;
    }

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: `ecypro@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    this.initialized = true;
    Logger.info(`[Sentry] Initialized for ${import.meta.env.MODE || 'development'}`);
  }

  captureException(error: Error, extra?: Record<string, unknown>): string {
    if (!this.initialized) return '';
    const eventId = Sentry.captureException(error, { extra });
    return eventId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized) return;
    Sentry.captureMessage(message, level);
  }

  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!this.initialized) return;
    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }

  setUser(user: { id?: string; email?: string } | null): void {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }

  setTag(key: string, value: string): void {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  get isEnabled(): boolean {
    return this.initialized;
  }
}

export const sentry = new SentryClient();
