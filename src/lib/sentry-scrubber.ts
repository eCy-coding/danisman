/**
 * eCyPro — Sentry PII Scrubber (pure, framework-agnostic)
 *
 * Sprint 9 P44-T04 / P44-T04b. Extracted from `sentry.ts` so the helper
 * has ZERO Vite (`import.meta.env`) coupling and can be imported from
 * Node-only runners (Playwright e2e, future server-side mirror, future
 * vitest in `node` environment) without pulling Logger/Sentry init code.
 *
 * Redaction contract (mirror server/middleware/sentry.ts + WEB_STANDARDS §9):
 *   • event.user.{email,ip_address,username} → '[redacted]'
 *   • event.request.cookies                  → removed
 *   • event.request.headers.{Authorization,Cookie} (case-insensitive) → '[redacted]'
 *   • event.request.url query string         → '?[redacted]'
 *
 * Wraps the entire body in try/catch so a scrubber bug NEVER drops an
 * event (KVKK m.12 "best effort" stance — we'd rather report a partially
 * scrubbed event than lose the incident telemetry).
 */

/**
 * Structural shape of the parts of a Sentry event we redact. Intentionally
 * decoupled from `@sentry/react` type imports so the helper stays pure.
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

/** Mutate-and-return the event with PII fields redacted. */
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
