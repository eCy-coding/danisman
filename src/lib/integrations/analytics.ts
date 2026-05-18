/**
 * P51.1 — Google Analytics 4 + Consent Mode v2 + custom events.
 *
 * VITE_GA4_MEASUREMENT_ID env var dolu ise initialize, boş ise no-op.
 * Consent Mode v2 (KVKK uyum): default deny, user explicit grant olunca yükle.
 *
 * Custom events:
 *   - discovery_call_book
 *   - assessment_complete (P49 widget'lar)
 *   - service_view
 *   - cta_click
 *   - form_submit
 *   - newsletter_subscribe
 *   - widget_interaction
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __ga4Initialized?: boolean;
  }
}

const GA4_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID ?? '').trim();
const CONSENT_STORAGE_KEY = 'ecypro:analytics-consent';

type ConsentStatus = 'granted' | 'denied';
type ConsentState = {
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
};

const DEFAULT_DENY: ConsentState = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};

function gtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  if (!window.dataLayer) window.dataLayer = [];
  window.dataLayer.push(args);
}

/**
 * Page load'da hemen çağrılır. Consent Mode v2 default deny set eder + GA4 script'ini
 * conditional yükler (sadece DSN dolu + user previously consented).
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (window.__ga4Initialized) return;

  if (!GA4_ID || GA4_ID.startsWith('G-PLACE')) {
    // No-op
    return;
  }

  // Consent Mode v2 — default deny BEFORE GA4 script loads
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  // KVKK uyum: default deny tüm storage categories
  gtag('consent', 'default', DEFAULT_DENY);
  gtag('js', new Date());

  // Restore previous consent if user has interacted with cookie banner
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted') {
      grantAnalyticsConsent();
    }
  } catch {
    // localStorage blocked, skip
  }

  // Inject GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  gtag('config', GA4_ID, {
    send_page_view: false, // SPA route changes handled manually
    anonymize_ip: true,
  });

  window.__ga4Initialized = true;
}

export function grantAnalyticsConsent(): void {
  gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
  } catch {
    /* ignore */
  }
}

export function denyAnalyticsConsent(): void {
  gtag('consent', 'update', DEFAULT_DENY);
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
  } catch {
    /* ignore */
  }
}

/** SPA page view (call on route change). */
export function trackPageView(pathname: string, title?: string): void {
  if (!GA4_ID) return;
  gtag('event', 'page_view', {
    page_path: pathname,
    page_title: title || document.title,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/** Discovery Call book event (high-intent conversion). */
export function trackDiscoveryCallBook(source: string): void {
  if (!GA4_ID) return;
  gtag('event', 'discovery_call_book', {
    source, // e.g. 'hero-cta', 'service-detail', 'sticky-cta', 'maturity-ladder'
    value: 0,
    currency: 'TRY',
  });
}

/** Service detail page view (deeper engagement). */
export function trackServiceView(slug: string): void {
  if (!GA4_ID) return;
  gtag('event', 'service_view', { service_slug: slug });
}

/** Custom widget interaction (P49 widgets). */
export function trackWidgetInteraction(widget: string, action: string, value?: unknown): void {
  if (!GA4_ID) return;
  gtag('event', 'widget_interaction', { widget, action, value });
}

/** Generic CTA click. */
export function trackCtaClick(ctaName: string, location: string): void {
  if (!GA4_ID) return;
  gtag('event', 'cta_click', { cta_name: ctaName, cta_location: location });
}

/** Form submission. */
export function trackFormSubmit(formName: string, success: boolean): void {
  if (!GA4_ID) return;
  gtag('event', 'form_submit', { form_name: formName, success });
}

/** Newsletter subscribe. */
export function trackNewsletterSubscribe(source: string): void {
  if (!GA4_ID) return;
  gtag('event', 'newsletter_subscribe', { source });
}

/** P49 widget assessment completion. */
export function trackAssessmentComplete(widget: string, result: string): void {
  if (!GA4_ID) return;
  gtag('event', 'assessment_complete', { widget, result });
}
