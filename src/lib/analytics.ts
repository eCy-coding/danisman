declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Enhanced Analytics Wrapper for GA4
 * Supports buffering, type-safety, and environment-aware logging.
 */
export const trackEvent = (category: string, action: string, label?: string) => {
  const payload = {
    event_category: category,
    event_label: label,
    timestamp: new Date().toISOString(),
  };

  // 1. Production Tracking (GA4)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, payload);
  }

  // 2. Development/Test Logging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as any).TEST_MODE)) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics:Telemetri] %c${action}`, 'color: #10b981; font-weight: bold;', payload);
    
    // 3. E2E Verification Bridge
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._last_analytics_event = { action, ...payload };
    }
  }
};
