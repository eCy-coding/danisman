/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadGA4, unloadGA4 } from '../../lib/ga4-loader';
import { trackEvent as gaTrackEvent } from '../../lib/analytics';

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

const CONSENT_STORAGE_KEY = 'ecypro_cookie_consent';

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  consent: DEFAULT_CONSENT,
});

export const useAnalytics = () => useContext(AnalyticsContext);

function readStoredConsent(): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as { preferences?: Partial<ConsentPreferences> };
    return { ...DEFAULT_CONSENT, ...(parsed.preferences ?? {}) };
  } catch {
    return DEFAULT_CONSENT;
  }
}

interface Props {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<Props> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentPreferences>(readStoredConsent);

  // Sync consent on storage events (e.g. CookieBanner accept/decline in another tab).
  useEffect(() => {
    const handleStorage = () => setConsent(readStoredConsent());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // GA4 lifecycle is driven by analytics consent + measurement id.
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_TRACKING_ID as string | undefined;
    if (!measurementId) return;
    if (consent.analytics) {
      loadGA4(measurementId);
    } else {
      unloadGA4();
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
