/**
 * TDD RED phase — tests for captureWithConsent() + email PII hashing.
 * These MUST FAIL before implementation (captureWithConsent does not exist yet).
 *
 * KVKK CRITICAL fixes:
 *   1. Server-side analytics consent gate (returns early if analytics opt-out)
 *   2. Email PII hashing — raw email NEVER sent to PostHog as distinctId
 */

import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hashEmail = (email: string) =>
  createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

describe('captureWithConsent — consent gate', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', mockFetch.mockResolvedValue({ ok: true, status: 200 }));
    process.env.POSTHOG_API_KEY = 'phc_test_key_12345';
    process.env.POSTHOG_HOST = 'https://eu.i.posthog.com';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mockFetch.mockReset();
    delete process.env.POSTHOG_API_KEY;
  });

  it('does NOT capture when analytics consent is false', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const result = await captureWithConsent({
      event: 'discovery_submitted',
      email: 'test@example.com',
      consent: { analytics: false, kvkk: true },
    });
    expect(result.captured).toBe(false);
    expect(result.reason).toBe('analytics_opt_out');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does NOT capture when kvkk consent is false', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const result = await captureWithConsent({
      event: 'discovery_submitted',
      email: 'test@example.com',
      consent: { analytics: true, kvkk: false },
    });
    expect(result.captured).toBe(false);
    expect(result.reason).toBe('kvkk_missing');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('captures when both kvkk and analytics consent are true', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const result = await captureWithConsent({
      event: 'discovery_submitted',
      email: 'test@example.com',
      consent: { analytics: true, kvkk: true },
    });
    expect(result.captured).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('uses SHA-256 hashed email as distinctId — never raw email', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const email = 'user@example.com';
    const expectedHash = hashEmail(email);

    const result = await captureWithConsent({
      event: 'discovery_submitted',
      email,
      consent: { analytics: true, kvkk: true },
    });

    expect(result.distinctId).toBe(expectedHash);
    expect(result.distinctId).toMatch(/^[a-f0-9]{64}$/);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(body.distinct_id).toBe(expectedHash);
    expect(body.distinct_id).not.toBe(email);
  });

  it('normalizes email before hashing (lowercase + trim)', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const r1 = await captureWithConsent({
      event: 'test',
      email: 'user@example.com',
      consent: { analytics: true, kvkk: true },
    });
    mockFetch.mockClear();
    const r2 = await captureWithConsent({
      event: 'test',
      email: '  USER@EXAMPLE.COM  ',
      consent: { analytics: true, kvkk: true },
    });
    expect(r1.distinctId).toBe(r2.distinctId);
  });

  it('does not include raw email in event properties', async () => {
    const { captureWithConsent } = await import('./posthog-server');
    const email = 'user@ecypro.com';

    await captureWithConsent({
      event: 'contact_submit',
      email,
      properties: { kind: 'booking', company: 'Acme' },
      consent: { analytics: true, kvkk: true },
    });

    const bodyStr = mockFetch.mock.calls[0][1].body as string;
    expect(bodyStr).not.toContain(email);
  });
});
