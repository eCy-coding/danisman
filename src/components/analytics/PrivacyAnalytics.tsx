
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Note: In a real environment, you would use 'plausible-tracker' or '@vercel/analytics'
// This implementation acts as a robust "Shim" that respects Do Not Track (DNT)
// and prepares the data layer for zero-config integration.

declare global {
  interface Window {
    plausible?: (event: string, options?: Record<string, unknown>) => void;
  }
}

import { Logger } from '@/lib/logger';

export const PrivacyAnalytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. Respect "Do Not Track"
    if (navigator.doNotTrack === '1') {
      Logger.info('Analytics: DNT enabled. Tracking skipped.');
      return;
    }

    // 2. Log Page View (Simulated for Shim)
    // Ideally, this sends a beacon to /api/event without cookies
    const logPageView = () => {
        const _url = window.location.href;
        const _referrer = document.referrer;
        
        // Simulating a lightweight beacon
        // navigator.sendBeacon('/api/analytics', JSON.stringify({ url: _url, referrer: _referrer }));
        
        Logger.info(`[PrivacyAnalytics] PageView: ${location.pathname}`);
    };

    logPageView();

  }, [location]);

  return null; // Renderless component
};
