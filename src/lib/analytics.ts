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

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, payload);
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
