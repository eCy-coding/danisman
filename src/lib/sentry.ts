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
          // P8 — privacy hardening: session replay must NOT capture user-visible
          // text or form inputs. Otherwise EmailJS forms / login fields leak.
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
      // P21-BE: Sentry billing optimization. Team plan ≈ $26/100K events/mo.
      //   1M page-views/mo × tracesSampleRate 0.10 = 100K txn events = $26
      //   1M page-views/mo × tracesSampleRate 0.05 = 50K  txn events = $13
      // RUM coverage for p95/p99 latency stays statistically sufficient at 5%
      // (Sentry recommends ≥ 1% for hot paths). Errors are NEVER sampled —
      // every captured exception is forwarded. See outputs/P21_BE_CACHE_SENTRY.md.
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.05 : 1.0,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      // P8 — restrict trace propagation to first-party origins so cross-origin
      // 3rd-parties (EmailJS, GA, Sentry CDN) don't receive sentry-trace headers.
      tracePropagationTargets: [
        /^\//,
        /^https:\/\/(www\.|api\.)?ecypro\.com/,
      ],
      // P8 — scrub PII before any event leaves the browser.
      // Strategy: keep error fingerprint useful but strip anything that could
      // identify a real user (email, IP, auth tokens, full URL with query).
      beforeSend(event) {
        try {
          if (event.user) {
            if (event.user.email) event.user.email = '[redacted]';
            if (event.user.ip_address) event.user.ip_address = '[redacted]';
            if (event.user.username) event.user.username = '[redacted]';
          }
          if (event.request) {
            if (event.request.cookies) delete event.request.cookies;
            if (event.request.headers) {
              const h = event.request.headers as Record<string, string>;
              if (h.Authorization) h.Authorization = '[redacted]';
              if (h.authorization) h.authorization = '[redacted]';
              if (h.Cookie) h.Cookie = '[redacted]';
              if (h.cookie) h.cookie = '[redacted]';
            }
            // Drop query string — may contain reset tokens, OAuth state etc.
            if (typeof event.request.url === 'string') {
              const idx = event.request.url.indexOf('?');
              if (idx >= 0) event.request.url = event.request.url.slice(0, idx) + '?[redacted]';
            }
          }
        } catch {
          /* never let a scrubber error drop an event */
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Drop console.* breadcrumbs in prod — they may contain debug strings
        // with PII or tokens. Network/UI breadcrumbs are kept.
        if (import.meta.env.MODE === 'production' && breadcrumb.category === 'console') {
          return null;
        }
        return breadcrumb;
      },
    });

    this.initialized = true;
    Logger.info(`[Sentry] Initialized for ${import.meta.env.MODE || 'development'}`);

    // P12/3 — CSP violation telemetry. Browsers fire securitypolicyviolation
    // before any report-uri / report-to round-trip; capturing here gives us
    // per-user visibility even when the network report is blocked (e.g. by
    // strict adblockers or corporate proxies).
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
    // P8 — never send raw email/username to Sentry; only opaque id.
    // beforeSend hook redacts these anyway, but we save the bandwidth + risk.
    if (user) {
      Sentry.setUser({ id: user.id });
    } else {
      Sentry.setUser(null);
    }
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
