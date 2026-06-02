/**
 * Sprint 9 P44-T05 — AnalyticsProvider consent wiring tests.
 *
 * Verifies the KVKK m.5 + GDPR Art.7 BLOCKER fix:
 *   1. Provider reads `ecypro_consent_v1` (canonical) — NOT the legacy key
 *   2. Legacy `ecypro_cookie_consent` is one-shot migrated to v1
 *   3. CookieBanner's `ecypro:consent-changed` CustomEvent re-syncs same-tab
 *   4. `storage` event re-syncs cross-tab
 *   5. Default consent (no record) is essential-only (no analytics)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Stub out telemetry side-effects so we can assert consent state without
// pulling GA4/Clarity/GrowthBook network code into the test environment.
vi.mock('../../lib/ga4-loader', () => ({
  loadGA4: vi.fn(),
  unloadGA4: vi.fn(),
}));
vi.mock('../../lib/clarity', () => ({
  loadClarity: vi.fn(),
  unloadClarity: vi.fn(),
}));
vi.mock('../../lib/growthbook', () => ({
  loadGrowthBookFeatures: vi.fn(),
  destroyGrowthBook: vi.fn(),
}));
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

import { AnalyticsProvider, useAnalytics } from './AnalyticsProvider';
import { CONSENT_STORAGE_KEY } from '../../lib/consent-v1';

const LEGACY_KEY = 'ecypro_cookie_consent';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnalyticsProvider>{children}</AnalyticsProvider>
);

describe('AnalyticsProvider — consent wiring (Sprint 9 P44-T05)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to essential-only when no consent record exists', () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    expect(result.current.consent).toEqual({
      essential: true,
      analytics: false,
      marketing: false,
    });
  });

  it('reads the v1 consent key (NOT the legacy key)', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 1,
      }),
    );
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.consent.marketing).toBe(true);
    expect(result.current.consent.essential).toBe(true);
  });

  it('one-shot migrates a legacy `ecypro_cookie_consent` record to v1 on mount', () => {
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        preferences: { analytics: true, marketing: false, functional: true },
      }),
    );
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    const migrated = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(migrated).not.toBeNull();
    const parsed = JSON.parse(migrated as string) as {
      analytics: boolean;
      marketing: boolean;
      functional: boolean;
      version: number;
    };
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(false);
    expect(parsed.version).toBe(1);
    expect(result.current.consent.analytics).toBe(true);
    expect(result.current.consent.marketing).toBe(false);
  });

  it('does NOT overwrite an existing v1 record when a legacy record is also present', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: false,
        marketing: false,
        functional: false,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 1,
      }),
    );
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ preferences: { analytics: true, marketing: true } }),
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.consent.marketing).toBe(false);
  });

  it('re-syncs when `ecypro:consent-changed` CustomEvent fires (same-tab)', () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    expect(result.current.consent.analytics).toBe(false);

    act(() => {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          analytics: true,
          marketing: false,
          functional: false,
          timestamp: '2026-06-02T00:00:00.000Z',
          version: 1,
        }),
      );
      window.dispatchEvent(new CustomEvent('ecypro:consent-changed'));
    });

    expect(result.current.consent.analytics).toBe(true);
  });

  it('re-syncs when a `storage` event fires (cross-tab)', () => {
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    expect(result.current.consent.marketing).toBe(false);

    act(() => {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          analytics: false,
          marketing: true,
          functional: false,
          timestamp: '2026-06-02T00:00:00.000Z',
          version: 1,
        }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_STORAGE_KEY }));
    });

    expect(result.current.consent.marketing).toBe(true);
  });

  it('ignores a v1 record whose version field is not 1 (forward-compat safety)', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: true,
        marketing: true,
        functional: true,
        timestamp: '2026-06-02T00:00:00.000Z',
        version: 99,
      }),
    );
    const { result } = renderHook(() => useAnalytics(), { wrapper });
    expect(result.current.consent.analytics).toBe(false);
    expect(result.current.consent.marketing).toBe(false);
  });
});
