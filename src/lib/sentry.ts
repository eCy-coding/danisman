/**
 * eCyPro — Sentry Error Reporting (Frontend)
 *
 * P76: Converted to dynamic import so the 259KB @sentry/react chunk is NOT
 * loaded until init() is called (via requestIdleCallback in App.tsx).
 * This removes Sentry from the critical rendering path entirely.
 *
 * Sprint 9 P44-T04: PII scrubber extracted to `scrubSentryEvent()` so the
 * KVKK m.4 + m.12 redaction contract is unit-testable. Standards Lead DoD
 * #1 "PII never logged Sentry PII scrubber FE+BE" verifiable in CI.
 */
import { Logger } from './logger';

interface SentryBreadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, unknown>;
}

/**
 * Structural shape of the parts of a Sentry event we redact. Decoupled
 * from `@sentry/react` type imports so the helper stays pure (no chunk
 * pull-in at unit-test time, no lazy-load coupling).
 */
export interface ScrubbableSentryEvent {
  user?: {
    email?: string | null;
    ip_address?: string | null;
    username?: string | null;
    [k: string]: unknown;
  };
  request?: {
    url?: string;
    cookies?: unknown;
    headers?: Record<string, string>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

const REDACTED = '[redacted]' as const;

/**
 * Mutate-and-return the event with PII fields redacted. Wraps the entire
 * body in try/catch so a scrubber bug NEVER drops an event (KVKK m.12
 * "best effort" stance — we'd rather report a partially scrubbed event
 * than lose the incident telemetry).
 *
 * Redaction rules (mirror server/middleware/sentry.ts + 9 §):
 *   • event.user.{email,ip_address,username} → '[redacted]'
 *   • event.request.cookies                  → removed
 *   • event.request.headers.{Authorization,Cookie} (case-insensitive) → '[redacted]'
 *   • event.request.url query string         → '?[redacted]'
 */
export function scrubSentryEvent<T extends ScrubbableSentryEvent>(event: T): T {
  try {
    if (event.user) {
      if (event.user.email) event.user.email = REDACTED;
      if (event.user.ip_address) event.user.ip_address = REDACTED;
      if (event.user.username) event.user.username = REDACTED;
    }
    if (event.request) {
      if (event.request.cookies) delete event.request.cookies;
      if (event.request.headers) {
        const h = event.request.headers;
        if (h.Authorization) h.Authorization = REDACTED;
        if (h.authorization) h.authorization = REDACTED;
        if (h.Cookie) h.Cookie = REDACTED;
        if (h.cookie) h.cookie = REDACTED;
      }
      if (typeof event.request.url === 'string') {
        const idx = event.request.url.indexOf('?');
        if (idx >= 0) event.request.url = event.request.url.slice(0, idx) + '?[redacted]';
      }
    }
  } catch {
    /* never let a scrubber error drop an event */
  }
  return event;
}

// Lazy-loaded Sentry module reference
type SentryModule = typeof import('@sentry/react');
let _Sentry: SentryModule | null = null;

class SentryClient {
  private initialized = false;
  private _initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initialized || this._initPromise) {
      Logger.debug('[Sentry] Already initialized — skipping duplicate init');
      return this._initPromise ?? Promise.resolve();
    }

    // VITE_SENTRY_DSN_FRONTEND is the canonical name; VITE_SENTRY_DSN kept
    // as a legacy alias so prior deploys don't lose error reporting on cut-over.
    const dsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND || import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || dsn === 'https://mock@o0.ingest.sentry.io/0') {
      Logger.debug('[Sentry] No valid DSN configured — error reporting disabled');
      return;
    }

    this._initPromise = this._doInit(dsn);
    return this._initPromise;
  }

  private async _doInit(dsn: string): Promise<void> {
    try {
      const Sentry = await import('@sentry/react');
      _Sentry = Sentry;

      Sentry.init({
        dsn,
        environment: import.meta.env.MODE || 'development',
        release: `ecypro@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.05 : 1.0,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        tracePropagationTargets: [/^\//, /^https:\/\/(www\.|api\.)?ecypro\.com/],
        beforeSend(event) {
          // `@sentry/react` Event type has stricter request shape; the
          // scrubber works on a structural subset to stay unit-testable.
          scrubSentryEvent(event as unknown as ScrubbableSentryEvent);
          return event;
        },
        beforeBreadcrumb(breadcrumb) {
          if (import.meta.env.MODE === 'production' && breadcrumb.category === 'console') {
            return null;
          }
          return breadcrumb;
        },
      });

      this.initialized = true;
      Logger.info(`[Sentry] Initialized for ${import.meta.env.MODE || 'development'}`);

      // CSP violation telemetry
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        document.addEventListener(
          'securitypolicyviolation',
          (e: SecurityPolicyViolationEvent) => {
            Sentry.captureMessage('CSP violation', {
              level: 'warning',
              tags: {
                csp_directive: e.violatedDirective,
                csp_disposition: e.disposition,
              },
              extra: {
                blockedURI: e.blockedURI,
                documentURI: e.documentURI,
                effectiveDirective: e.effectiveDirective,
                originalPolicy: e.originalPolicy?.slice(0, 240),
                sourceFile: e.sourceFile,
                lineNumber: e.lineNumber,
                columnNumber: e.columnNumber,
                sample: e.sample,
              },
            });
          },
          { passive: true },
        );
      }
    } catch (err) {
      Logger.warn('[Sentry] Failed to load @sentry/react:', err);
    }
  }

  /** Returns the lazily-loaded Sentry module (null if not yet loaded). */
  get module(): SentryModule | null {
    return _Sentry;
  }

  captureException(error: Error, extra?: Record<string, unknown>): string {
    if (!this.initialized || !_Sentry) return '';
    const eventId = _Sentry.captureException(error, { extra });
    return eventId;
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized || !_Sentry) return;
    _Sentry.captureMessage(message, level);
  }

  addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!this.initialized || !_Sentry) return;
    _Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level,
      data: breadcrumb.data,
    });
  }

  setUser(user: { id?: string; email?: string } | null): void {
    if (!this.initialized || !_Sentry) return;
    if (user) {
      _Sentry.setUser({ id: user.id });
    } else {
      _Sentry.setUser(null);
    }
  }

  setTag(key: string, value: string): void {
    if (!this.initialized || !_Sentry) return;
    _Sentry.setTag(key, value);
  }

  get isEnabled(): boolean {
    return this.initialized;
  }
}

export const sentry = new SentryClient();
