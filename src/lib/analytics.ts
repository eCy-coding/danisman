import { Logger } from './logger';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    TEST_MODE?: boolean;
    _last_analytics_event?: { action: string; timestamp: string; [key: string]: unknown };
  }
}

// ─── Internal push helper ──────────────────────────────────────────────────
function _push(eventName: string, params: Record<string, unknown>): void {
  const payload = { ...params, timestamp: new Date().toISOString() };

  // GA4 direct (gtag.js)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, payload);
  }

  // GTM dataLayer parallel push (P34-T01) — keeps GTM containers in sync
  // when both gtag.js and GTM are loaded; harmless when only one is present.
  if (typeof window !== 'undefined') {
    if (!Array.isArray(window.dataLayer)) window.dataLayer = [];
    window.dataLayer.push({ event: eventName, ...payload });
  }

  if (import.meta.env.DEV || (typeof window !== 'undefined' && window.TEST_MODE)) {
    Logger.debug(`[Analytics] ${eventName}`, payload);
    if (typeof window !== 'undefined') {
      window._last_analytics_event = { action: eventName, ...payload };
    }
  }
}

// ─── Legacy wrapper (backwards-compatible) ─────────────────────────────────
export const trackEvent = (category: string, action: string, label?: string): void => {
  _push(action, { event_category: category, event_label: label });
};

// ─── P31-T05: Specialized GA4 event helpers ────────────────────────────────

/**
 * CTA click tracking — Hero, Navbar, Pricing, any call-to-action.
 * @param label  Human-readable CTA label, e.g. "Hero Primary", "Navbar Book"
 * @param location  Where on the page, e.g. "hero", "navbar", "pricing"
 */
export const trackCTA = (label: string, location: string): void => {
  _push('cta_click', { cta_label: label, cta_location: location });
};

/**
 * Scroll depth milestones — 25 / 50 / 75 / 100 percent.
 * Should be called at most once per milestone per page load.
 * @param percentage  25 | 50 | 75 | 100
 * @param page  Current pathname, e.g. "/services"
 */
export const trackScrollDepth = (percentage: 25 | 50 | 75 | 100, page: string): void => {
  _push('scroll_depth', { scroll_percentage: percentage, page_path: page });
};

/**
 * Form lifecycle — start, submit success, submit error, abandon.
 * @param formId  e.g. "contact", "newsletter", "booking"
 * @param event   "start" | "submit_success" | "submit_error" | "abandon"
 * @param extra   Optional extra context (e.g. last field name on abandon)
 */
export const trackForm = (
  formId: string,
  event: 'start' | 'submit_success' | 'submit_error' | 'abandon',
  extra?: Record<string, unknown>,
): void => {
  _push(`form_${event}`, { form_id: formId, ...extra });
};

/**
 * Page view with enhanced context (locale, persona, referrer).
 * Supplement GA4's automatic page_view with richer data.
 */
export const trackPageView = (page: string, extra?: Record<string, unknown>): void => {
  _push('page_view_enhanced', { page_path: page, ...extra });
};

/**
 * Booking flow step tracking (3-step wizard).
 * @param step  1 | 2 | 3 | "submit" | "success" | "error"
 */
export const trackBooking = (
  step: 1 | 2 | 3 | 'submit' | 'success' | 'error',
  extra?: Record<string, unknown>,
): void => {
  _push('booking_flow', { booking_step: step, ...extra });
};

/**
 * P31-T05 / P34-T02 — ROI Calculator interaction tracking.
 *
 * Call on each meaningful interaction: field change (debounced 500ms),
 * calculation complete, and CTA click from results view.
 *
 * @param step   "start" | "input_change" | "calculated" | "cta_click"
 * @param values Partial calc inputs — company_size, revenue_band, scope, timeline, roi_result
 */
export const trackROICalc = (
  step: 'start' | 'input_change' | 'calculated' | 'cta_click',
  values?: {
    company_size?: string;
    revenue_band?: string;
    scope?: string;
    timeline?: string;
    roi_result?: number;
  },
): void => {
  _push('roi_calc_interaction', { roi_step: step, ...values });
};

// ─── P34-T01: GA4 Conversion Goals ────────────────────────────────────────
//
// GA4 conversion events follow Google's recommended naming so they map
// 1:1 to "Conversions" in GA4 Admin → Events panel without renaming.
//
// Mark these as Conversions in GA4 UI:
//   - generate_lead     (booking submit_success + contact form submit)
//   - sign_up           (newsletter subscribe)
//   - quote_request     (quick-check chain submit)
//
// Each helper emits BOTH the canonical event AND the legacy event for
// backwards-compatible dashboards (transition period). When all dashboards
// migrate, the legacy event can be removed.

/**
 * Contact form successful submission (P34-T01 conversion).
 * @param formId  Form identifier — "contact" | "discovery" | "callback" | "rfq"
 * @param extra   Optional extras: source page, lead score, etc.
 */
export const trackContactConversion = (
  formId: 'contact' | 'discovery' | 'callback' | 'rfq',
  extra?: Record<string, unknown>,
): void => {
  _push('generate_lead', {
    form_id: formId,
    method: 'contact_form',
    value: 1,
    currency: 'TRY',
    ...extra,
  });
  // Legacy parallel (P34-T01 transition window)
  trackForm(formId, 'submit_success', extra);
};

/**
 * Newsletter subscription success (P34-T01 conversion).
 * @param source  Origin of the signup — "footer" | "popup" | "inline" | "blog"
 * @param locale  "tr" | "en"
 */
export const trackNewsletterConversion = (
  source: 'footer' | 'popup' | 'inline' | 'blog' | 'pillar',
  locale: 'tr' | 'en',
  extra?: Record<string, unknown>,
): void => {
  _push('sign_up', {
    method: 'newsletter',
    source,
    locale,
    value: 1,
    currency: 'TRY',
    ...extra,
  });
  // Legacy parallel
  _push('newsletter_signup', { source, locale, ...extra });
};

/**
 * Booking confirmation success (P34-T01 conversion).
 * Routed via trackBooking('success', ...) helper too; this fires the
 * GA4-canonical `generate_lead` event with booking-scoped params.
 * @param bookingType  e.g. "intro_call" | "strategy_session" | "audit"
 * @param value        Optional booking value (TRY) for revenue attribution
 */
export const trackBookingConversion = (
  bookingType: string,
  value?: number,
  extra?: Record<string, unknown>,
): void => {
  _push('generate_lead', {
    form_id: 'booking',
    method: 'booking_flow',
    booking_type: bookingType,
    value: value ?? 1,
    currency: 'TRY',
    ...extra,
  });
  // Legacy parallel (booking_flow event is preserved through trackBooking)
};

/**
 * Quick-Check / Quote request submission (P34-T01 conversion).
 */
export const trackQuoteRequest = (
  source: 'quick_check' | 'pricing_calculator' | 'rfq',
  extra?: Record<string, unknown>,
): void => {
  _push('quote_request', { source, value: 1, currency: 'TRY', ...extra });
};
