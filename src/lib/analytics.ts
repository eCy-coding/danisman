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
    // eslint-disable-next-line no-console
    console.log(`[Analytics] %c${eventName}`, 'color:#10b981;font-weight:bold;', payload);
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
 * ROI Calculator funnel step tracking.
 * @param step  "start" | "input_revenue" | "input_efficiency" | "input_cost" | "result_view" | "cta_click"
 * @param values  Current calculator values snapshot (debounced, no PII)
 */
export const trackROICalc = (
  step: 'start' | 'input_revenue' | 'input_efficiency' | 'input_cost' | 'result_view' | 'cta_click',
  values?: { revenue?: string; efficiencyGain?: string; cost?: string; roiResult?: number },
): void => {
  _push('roi_calculator', { roi_step: step, ...values });
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
