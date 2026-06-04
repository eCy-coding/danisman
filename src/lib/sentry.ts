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
import { scrubSentryEvent, type ScrubbableSentryEvent } from './sentry-scrubber';

// Sprint 9 P44-T04b: scrubber lives in a pure ESM module so Node-only
// runners (Playwright e2e CI gate) can import it without pulling Logger
// + Sentry-init code. Re-exported here for backward-compat with existing
// imports such as `src/lib/sentry.test.ts` and `import.meta.env`-free
// downstream consumers.
export { scrubSentryEvent, type ScrubbableSentryEvent };

interface SentryBreadcrumb {
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, unknown>;
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
        // S13-R2-P4 — production homepage was emitting 3 envelopes per
        // visit and hitting sentry.io's 503 ceiling (quota / rate limit).
        // Halving production trace sample rate (0.05 → 0.02) cuts traffic
        // without losing meaningful error signal: errors and unhandled
        // rejections always emit at 100% regardless of trace rate. Replay
        // rates already conservative; left untouched.
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.02 : 1.0,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        // Skip telemetry for third-party scripts we don't own — these
        // errors aren't actionable and inflate our org quota. Sentry's
        // `denyUrls` matches the script source URL of the exception
        // (substring or regex).
        denyUrls: [
          /clarity\.ms/i,
          /googletagmanager\.com/i,
          /google-analytics\.com/i,
          /posthog\.com/i,
          /calendly\.com/i,
        ],
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
