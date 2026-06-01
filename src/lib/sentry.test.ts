/**
 * Sprint 9 P44-T04 — PII scrubber unit tests.
 *
 * Covers `scrubSentryEvent()` against the KVKK m.4 + m.12 redaction
 * contract documented in `sentry.ts`. Standards Lead DoD #1 verifiable
 * in CI; Playwright E2E with synthetic PII follows in a subsequent
 * atomic PR.
 */
import { describe, it, expect } from 'vitest';

import { scrubSentryEvent } from './sentry';

const REDACTED = '[redacted]';

describe('scrubSentryEvent', () => {
  it('redacts user.email', () => {
    const event = { user: { email: 'ahmet@ecypro.com' } };
    expect(scrubSentryEvent(event).user?.email).toBe(REDACTED);
  });

  it('redacts user.ip_address', () => {
    const event = { user: { ip_address: '192.0.2.1' } };
    expect(scrubSentryEvent(event).user?.ip_address).toBe(REDACTED);
  });

  it('redacts user.username', () => {
    const event = { user: { username: 'ahmet.yilmaz' } };
    expect(scrubSentryEvent(event).user?.username).toBe(REDACTED);
  });

  it('redacts all three user fields together', () => {
    const event = {
      user: { email: 'a@b.com', ip_address: '1.2.3.4', username: 'u' },
    };
    const out = scrubSentryEvent(event);
    expect(out.user?.email).toBe(REDACTED);
    expect(out.user?.ip_address).toBe(REDACTED);
    expect(out.user?.username).toBe(REDACTED);
  });

  it('removes request.cookies entirely', () => {
    const event = { request: { cookies: { sessionId: 'abc123' } } };
    const out = scrubSentryEvent(event);
    expect(out.request?.cookies).toBeUndefined();
  });

  it('redacts request.headers.Authorization (PascalCase)', () => {
    const event = {
      request: { headers: { Authorization: 'Bearer eyJ.token', 'X-Trace': 'keep' } },
    };
    const out = scrubSentryEvent(event);
    expect(out.request?.headers?.Authorization).toBe(REDACTED);
    expect(out.request?.headers?.['X-Trace']).toBe('keep');
  });

  it('redacts request.headers.authorization (lowercase)', () => {
    const event = { request: { headers: { authorization: 'Bearer eyJ.token' } } };
    expect(scrubSentryEvent(event).request?.headers?.authorization).toBe(REDACTED);
  });

  it('redacts request.headers.Cookie (both cases)', () => {
    const event = {
      request: { headers: { Cookie: 'session=abc', cookie: 'tracker=xyz' } },
    };
    const out = scrubSentryEvent(event);
    expect(out.request?.headers?.Cookie).toBe(REDACTED);
    expect(out.request?.headers?.cookie).toBe(REDACTED);
  });

  it('redacts the request.url query string but keeps the path', () => {
    const event = { request: { url: 'https://ecypro.com/contact?email=a@b.com&phone=555' } };
    expect(scrubSentryEvent(event).request?.url).toBe('https://ecypro.com/contact?[redacted]');
  });

  it('leaves request.url unchanged when there is no query string', () => {
    const event = { request: { url: 'https://ecypro.com/contact' } };
    expect(scrubSentryEvent(event).request?.url).toBe('https://ecypro.com/contact');
  });

  it('leaves an event without user/request untouched', () => {
    const event = { tags: { env: 'prod' } };
    expect(scrubSentryEvent(event)).toEqual({ tags: { env: 'prod' } });
  });

  it('never throws when the event shape is malformed (graceful degrade)', () => {
    // Force a getter to throw to verify the try/catch swallow contract.
    const badEvent = {
      get user() {
        throw new Error('boom');
      },
    } as unknown as { user: { email: string } };
    expect(() => scrubSentryEvent(badEvent)).not.toThrow();
  });

  it('redacts only the PII fields without touching other event keys', () => {
    const event = {
      user: { email: 'a@b.com', id: 'u-1' },
      request: { url: 'https://ecypro.com/x', method: 'POST' },
      tags: { env: 'prod' },
    };
    const out = scrubSentryEvent(event);
    expect(out.user?.email).toBe(REDACTED);
    expect(out.user?.id).toBe('u-1');
    expect(out.request?.url).toBe('https://ecypro.com/x');
    expect(out.request?.method).toBe('POST');
    expect(out.tags).toEqual({ env: 'prod' });
  });
});
