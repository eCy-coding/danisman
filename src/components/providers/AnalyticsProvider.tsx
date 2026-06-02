/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadGA4, unloadGA4 } from '../../lib/ga4-loader';
import { trackEvent as gaTrackEvent } from '../../lib/analytics';
import { loadClarity, unloadClarity } from '../../lib/clarity';
import { loadGrowthBookFeatures, destroyGrowthBook } from '../../lib/growthbook';
import {
  CONSENT_STORAGE_KEY as CONSENT_V1_KEY,
  readConsent as readConsentV1,
} from '../../lib/consent-v1';

// Missing-key warnings: emit once per process so a misconfigured Vercel ENV
// surfaces in the console instead of silently disabling telemetry on launch.
let warnedGA4 = false;
let warnedClarity = false;
let warnedGrowthBook = false;

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface AnalyticsContextType {
  trackEvent: (category: string, action: string, label?: string) => void;
  consent: ConsentPreferences;
}

const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

/**
 * Sprint 9 P44-T05 (KVKK m.5 + GDPR Art.7 BLOCKER fix):
 *
 * The old provider read `ecypro_cookie_consent` while `CookieBanner` writes
 * `ecypro_consent_v1`. Result: a user who clicked "Accept All" still saw
 * no analytics load, and the consent UI was effectively a no-op. We now
 * source consent from the v1 schema (single source of truth) and listen
 * to the `ecypro:consent-changed` CustomEvent the banner dispatches on the
 * same tab, plus `storage` events for cross-tab sync. The legacy key is
 * one-shot migrated so users who consented before the fix do not have to
 * re-accept.
 */
const LEGACY_CONSENT_KEY = 'ecypro_cookie_consent';

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  consent: DEFAULT_CONSENT,
});

export const useAnalytics = () => useContext(AnalyticsContext);

function migrateLegacyConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    // Only migrate if v1 record is missing AND a legacy one exists.
    if (window.localStorage.getItem(CONSENT_V1_KEY)) return;
    const raw = window.localStorage.getItem(LEGACY_CONSENT_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      preferences?: { analytics?: boolean; marketing?: boolean; functional?: boolean };
    };
    const prefs = parsed.preferences ?? {};
    const record = {
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing),
      functional: Boolean(prefs.functional),
      timestamp: new Date().toISOString(),
      version: 1,
    };
    window.localStorage.setItem(CONSENT_V1_KEY, JSON.stringify(record));
    // Leave the legacy key in place — non-destructive migration so a user
    // can still recover their original record manually if needed.
  } catch {
    /* localStorage unavailable — silently degrade */
  }
}

function readStoredConsent(): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  const v1 = readConsentV1();
  if (v1) {
    return {
      essential: true,
      analytics: v1.analytics,
      marketing: v1.marketing,
    };
  }
  return DEFAULT_CONSENT;
}

interface Props {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<Props> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentPreferences>(() => {
    migrateLegacyConsent();
    return readStoredConsent();
  });

  // Sync consent on:
  //   • storage events (CookieBanner accept/decline in another tab)
  //   • ecypro:consent-changed CustomEvent (CookieBanner same-tab writeConsent)
  useEffect(() => {
    const refresh = () => setConsent(readStoredConsent());
    window.addEventListener('storage', refresh);
    window.addEventListener('ecypro:consent-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('ecypro:consent-changed', refresh);
    };
  }, []);

  // GA4 lifecycle — consent-gated, idempotent
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_TRACKING_ID as string | undefined;
    if (!measurementId) {
      if (!warnedGA4) {
        // eslint-disable-next-line no-console
        console.warn(
          '[analytics] VITE_GA_TRACKING_ID missing — GA4 disabled. Set the env var in Vercel → Project Settings → Environment Variables.',
        );
        warnedGA4 = true;
      }
      return;
    }
    if (consent.analytics) {
      loadGA4(measurementId);
    } else {
      unloadGA4();
    }
  }, [consent.analytics]);

  // P34-T05: Microsoft Clarity — consent-gated session recording
  useEffect(() => {
    const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
    if (!clarityId) {
      if (!warnedClarity) {
        // eslint-disable-next-line no-console
        console.warn(
          '[analytics] VITE_CLARITY_PROJECT_ID missing — Clarity disabled. Set the env var in Vercel.',
        );
        warnedClarity = true;
      }
      return;
    }
    if (consent.analytics) {
      loadClarity(clarityId);
    } else {
      unloadClarity();
    }
  }, [consent.analytics]);

  // P34-T04: GrowthBook A/B Testing — consent-gated feature loading
  useEffect(() => {
    const clientKey = import.meta.env.VITE_GROWTHBOOK_CLIENT_KEY as string | undefined;
    if (!clientKey) {
      if (!warnedGrowthBook) {
        // eslint-disable-next-line no-console
        console.warn(
          '[analytics] VITE_GROWTHBOOK_CLIENT_KEY missing — A/B testing disabled. Set the env var in Vercel.',
        );
        warnedGrowthBook = true;
      }
      return;
    }
    if (consent.analytics) {
      void loadGrowthBookFeatures();
    } else {
      destroyGrowthBook();
    }
  }, [consent.analytics]);

  const trackEvent = (category: string, action: string, label?: string) => {
    if (!consent.analytics) return; // honour consent, no telemetry, no logs
    gaTrackEvent(category, action, label);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, consent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
