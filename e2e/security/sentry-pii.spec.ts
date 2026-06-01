/**
 * Sprint 9 P44-T04b — Sentry PII scrubber E2E policy gate.
 *
 * Standards Lead CONVERGENT spec: 6 synthetic PII fixtures driven through
 * the real `scrubSentryEvent()` helper used by `Sentry.init({ beforeSend })`.
 * Verifies the KVKK m.4 + m.12 redaction contract holds at the e2e gate so
 * a future refactor cannot silently leak PII to Sentry without flipping CI.
 *
 * NOTE: This is a Node-side policy gate — no browser navigation is needed
 * (the helper is pure). The Playwright runner is used so the assertion
 * lives in the e2e CI artifact stream alongside other DoD #1 gates.
 */
import { test, expect } from '@playwright/test';

// Import from the pure module (no Vite `import.meta.env` evaluation) so
// the Playwright Node runner can load it without spinning up Vite.
import { scrubSentryEvent, type ScrubbableSentryEvent } from '../../src/lib/sentry-scrubber';

const REDACTED = '[redacted]';

test.describe('Sentry PII scrubber — E2E policy gate', () => {
  test('Fixture 1: full production-shape PII event is fully redacted', () => {
    const event: ScrubbableSentryEvent = {
      user: {
        email: 'real.customer@example.com',
        ip_address: '203.0.113.42',
        username: 'real_customer',
        id: 'usr_keep_this_id',
      },
      request: {
        url: 'https://www.ecypro.com/iletisim?email=leak@bad.com&phone=%2B905551234567',
        method: 'POST',
        cookies: { session: 'leaked-session-cookie', csrf: 'leaked-csrf' },
        headers: {
          Authorization: 'Bearer eyJleaked.token.payload',
          Cookie: 'session=leaked',
          'X-Request-Id': 'req_keep_this',
        },
      },
      tags: { env: 'production', route: '/iletisim' },
    };

    const out = scrubSentryEvent(event);

    expect(out.user?.email).toBe(REDACTED);
    expect(out.user?.ip_address).toBe(REDACTED);
    expect(out.user?.username).toBe(REDACTED);
    // Non-PII fields must be preserved
    expect(out.user?.id).toBe('usr_keep_this_id');
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.headers?.Authorization).toBe(REDACTED);
    expect(out.request?.headers?.Cookie).toBe(REDACTED);
    expect(out.request?.headers?.['X-Request-Id']).toBe('req_keep_this');
    expect(out.request?.url).toBe('https://www.ecypro.com/iletisim?[redacted]');
    expect(out.request?.method).toBe('POST');
    expect(out.tags).toEqual({ env: 'production', route: '/iletisim' });
  });

  test('Fixture 2: lowercase header variants are also redacted', () => {
    const event: ScrubbableSentryEvent = {
      request: {
        headers: {
          authorization: 'Bearer eyJleaked.lower.case',
          cookie: 'leaked=lower',
          'user-agent': 'Mozilla/5.0 (keep)',
        },
      },
    };

    const out = scrubSentryEvent(event);

    expect(out.request?.headers?.authorization).toBe(REDACTED);
    expect(out.request?.headers?.cookie).toBe(REDACTED);
    expect(out.request?.headers?.['user-agent']).toBe('Mozilla/5.0 (keep)');
  });

  test('Fixture 3: partial PII event — only user.email present', () => {
    const event: ScrubbableSentryEvent = {
      user: { email: 'partial@user.com' },
      tags: { env: 'production' },
    };

    const out = scrubSentryEvent(event);

    expect(out.user?.email).toBe(REDACTED);
    expect(out.tags).toEqual({ env: 'production' });
  });

  test('Fixture 4: malformed event (getter throws) degrades gracefully', () => {
    const event = {
      get user(): { email: string } {
        throw new Error('synthetic getter explosion');
      },
      tags: { env: 'production' },
    } as unknown as ScrubbableSentryEvent;

    // Contract: the scrubber MUST NEVER throw — Sentry would otherwise
    // drop the entire event and we'd lose the incident telemetry.
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });

  test('Fixture 5: no-PII event is returned unchanged (idempotent identity)', () => {
    const event: ScrubbableSentryEvent = {
      tags: { env: 'production', release: 'ecypro@1.0.0' },
      request: { url: 'https://www.ecypro.com/services', method: 'GET' },
    };

    const out = scrubSentryEvent(event);

    expect(out).toEqual({
      tags: { env: 'production', release: 'ecypro@1.0.0' },
      request: { url: 'https://www.ecypro.com/services', method: 'GET' },
    });
  });

  test('Fixture 6: request.url without query string is left intact', () => {
    const event: ScrubbableSentryEvent = {
      request: { url: 'https://www.ecypro.com/hakkimizda', method: 'GET' },
    };

    const out = scrubSentryEvent(event);

    expect(out.request?.url).toBe('https://www.ecypro.com/hakkimizda');
    expect(out.request?.method).toBe('GET');
  });
});
