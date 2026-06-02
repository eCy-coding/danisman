/**
 * Sprint 9 P44-T11 — consent.ts v2 must read the canonical v1 record
 * (`ecypro_consent_v1`) that CookieBanner writes today, not just the
 * legacy `ecypro_cookie_consent` payload. PostHog wraps consent.ts and
 * was effectively pinned to opt-out for every user post-banner because
 * the canonical key was being ignored.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  getConsent,
  hasConsent,
  STORAGE_KEY_V1_CANONICAL,
  STORAGE_KEY_V1_LEGACY,
  STORAGE_KEY_V2,
} from './consent';

describe('consent.getConsent — canonical v1 source-of-truth', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads the canonical ecypro_consent_v1 record written by CookieBanner', () => {
    window.localStorage.setItem(
      STORAGE_KEY_V1_CANONICAL,
      JSON.stringify({
        analytics: true,
        marketing: true,
        functional: false,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 1,
      }),
    );

    const record = getConsent();
    expect(record).not.toBeNull();
    expect(record!.preferences.analytics).toBe(true);
    expect(record!.preferences.marketing).toBe(true);
    expect(record!.preferences.necessary).toBe(true);
    expect(record!.source).toBe('migrated_v1');
    // The v2 cache is now populated, so a subsequent getConsent() reads it
    // directly (no migration call needed).
    expect(window.localStorage.getItem(STORAGE_KEY_V2)).not.toBeNull();
  });

  it('still falls back to the legacy ecypro_cookie_consent record', () => {
    window.localStorage.setItem(
      STORAGE_KEY_V1_LEGACY,
      JSON.stringify({
        timestamp: '2026-06-02T00:00:00.000Z',
        type: 'all',
        preferences: { essential: true, analytics: true, marketing: false },
      }),
    );

    const record = getConsent();
    expect(record).not.toBeNull();
    expect(record!.preferences.analytics).toBe(true);
    expect(record!.preferences.marketing).toBe(false);
  });

  it('prefers the canonical v1 record when both legacy AND canonical exist', () => {
    window.localStorage.setItem(
      STORAGE_KEY_V1_LEGACY,
      JSON.stringify({ preferences: { analytics: false, marketing: false } }),
    );
    window.localStorage.setItem(
      STORAGE_KEY_V1_CANONICAL,
      JSON.stringify({
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 1,
      }),
    );

    const record = getConsent();
    expect(record!.preferences.analytics).toBe(true);
    expect(record!.preferences.marketing).toBe(true);
  });

  it('returns null when neither key exists (banner not yet seen)', () => {
    expect(getConsent()).toBeNull();
  });

  it('ignores a canonical v1 record whose version field is not 1', () => {
    window.localStorage.setItem(
      STORAGE_KEY_V1_CANONICAL,
      JSON.stringify({
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 99,
      }),
    );
    expect(getConsent()).toBeNull();
  });

  it('hasConsent(\"analytics\") reflects the canonical v1 record', () => {
    window.localStorage.setItem(
      STORAGE_KEY_V1_CANONICAL,
      JSON.stringify({
        analytics: true,
        marketing: false,
        functional: false,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 1,
      }),
    );

    expect(hasConsent('analytics')).toBe(true);
    expect(hasConsent('marketing')).toBe(false);
    expect(hasConsent('necessary')).toBe(true);
  });
});
