/**
 * P13/5 — Type-safe analytics event taxonomy.
 *
 * Tek kaynak — tüm event'lerin payload şeması burada. Yeni event eklerken:
 *   1. `EventName` union'a ekle
 *   2. `EventMap` interface'ine payload tipini ekle
 *   3. `track()` çağrısı otomatik type-check edilir
 *
 * `_push` legacy helper'ı `src/lib/analytics.ts`'te kalır; bu modül üst
 * katman olarak ona dayanır + compile-time safety + GA4 event taxonomy doc.
 *
 * Naming convention: `<category>_<verb>` snake_case. Reserved GA4 events
 * (`page_view`, `purchase`, `login`, `sign_up`) custom param eklemekten
 * kaçınır — GA4 schema'sını kirletmemek için.
 *
 * Categories (event prefix'i): navigation | engagement | conversion | error | system | consent | pwa
 */

import { Logger } from './logger';

// ── Category & event name union ──────────────────────────────────────────────

export type EventCategory =
  | 'navigation'
  | 'engagement'
  | 'conversion'
  | 'error'
  | 'system'
  | 'consent'
  | 'pwa';

export type EventName =
  // navigation
  | 'page_view'
  | 'route_change'
  | 'breadcrumb_click'
  // engagement
  | 'cta_click'
  | 'scroll_depth'
  | 'time_on_page'
  | 'video_play'
  | 'video_complete'
  | 'faq_expand'
  // conversion
  | 'form_start'
  | 'form_submit'
  | 'form_abandon'
  | 'booking_step'
  | 'roi_calc_step'
  | 'lead_capture'
  | 'newsletter_subscribe'
  // error
  | 'form_error'
  | 'api_error'
  | 'js_error'
  | 'csp_violation'
  // system
  | 'app_loaded'
  | 'web_vital'
  | 'performance_mark'
  // consent
  | 'consent_change'
  | 'consent_revoke'
  // pwa
  | 'pwa_install_prompt'
  | 'pwa_install'
  | 'pwa_install_dismiss'
  | 'pwa_offline_view';

// ── Common context (auto-attached) ───────────────────────────────────────────

export interface EventContext {
  /** ISO timestamp — autoset by emit() */
  timestamp?: string;
  /** Current pathname */
  path?: string;
  /** Active language */
  language?: 'tr' | 'en';
  /** Page title */
  title?: string;
}

// ── Per-event payloads ───────────────────────────────────────────────────────

export interface EventMap {
  // navigation
  page_view: { path: string; title?: string; referrer?: string };
  route_change: { from: string; to: string };
  breadcrumb_click: { from: string; to: string; level: number };

  // engagement
  cta_click: { cta_name: string; cta_location: string; href?: string };
  scroll_depth: { percentage: 25 | 50 | 75 | 100; page: string };
  time_on_page: { seconds: number; page: string };
  video_play: { videoId: string; title?: string };
  video_complete: { videoId: string; durationSeconds: number };
  faq_expand: { faqId: string; question: string };

  // conversion
  form_start: { form_id: string };
  form_submit: { form_id: string; success: boolean };
  form_abandon: { form_id: string; lastField?: string };
  booking_step: {
    step: 1 | 2 | 3 | 'submit' | 'success' | 'error';
    extra?: Record<string, unknown>;
  };
  roi_calc_step: {
    step:
      | 'start'
      | 'input_revenue'
      | 'input_efficiency'
      | 'input_cost'
      | 'result_view'
      | 'cta_click';
    values?: { revenue?: string; efficiencyGain?: string; cost?: string; roiResult?: number };
  };
  lead_capture: { source: string; tier?: 'cold' | 'warm' | 'hot' };
  newsletter_subscribe: { source: string };

  // error
  form_error: { form_id: string; error_type: string; field?: string };
  api_error: { endpoint: string; status: number; code?: string };
  js_error: { message: string; stack?: string; source?: string };
  csp_violation: { directive: string; blockedURI?: string };

  // system
  app_loaded: { coldStart: boolean; ms: number };
  web_vital: {
    name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  performance_mark: { mark: string; ms: number };

  // consent
  consent_change: {
    category: 'analytics' | 'marketing';
    granted: boolean;
    source: 'banner_accept_all' | 'banner_custom' | 'banner_reject_all' | 'settings_modal';
  };
  consent_revoke: { category: 'analytics' | 'marketing' };

  // pwa
  pwa_install_prompt: { source: string; outcome: 'accepted' | 'dismissed' };
  pwa_install: { source: string; timingSeconds: number };
  pwa_install_dismiss: { source: string };
  pwa_offline_view: { path: string };
}

// ── Event → category mapping (for dashboarding) ──────────────────────────────

export const EVENT_CATEGORY: Record<EventName, EventCategory> = {
  page_view: 'navigation',
  route_change: 'navigation',
  breadcrumb_click: 'navigation',
  cta_click: 'engagement',
  scroll_depth: 'engagement',
  time_on_page: 'engagement',
  video_play: 'engagement',
  video_complete: 'engagement',
  faq_expand: 'engagement',
  form_start: 'conversion',
  form_submit: 'conversion',
  form_abandon: 'conversion',
  booking_step: 'conversion',
  roi_calc_step: 'conversion',
  lead_capture: 'conversion',
  newsletter_subscribe: 'conversion',
  form_error: 'error',
  api_error: 'error',
  js_error: 'error',
  csp_violation: 'error',
  app_loaded: 'system',
  web_vital: 'system',
  performance_mark: 'system',
  consent_change: 'consent',
  consent_revoke: 'consent',
  pwa_install_prompt: 'pwa',
  pwa_install: 'pwa',
  pwa_install_dismiss: 'pwa',
  pwa_offline_view: 'pwa',
};

// ── Type-safe emit ───────────────────────────────────────────────────────────

// Note: `Window.gtag` / `dataLayer` / `_last_analytics_event` global types are
// already declared in `src/lib/analytics.ts` — re-declaring here would conflict
// with the existing `{ action: string; timestamp: string }` shape. We use
// lookups against `window as unknown as { ... }` instead.

function ctx(): EventContext {
  if (typeof window === 'undefined') return {};
  return {
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    title: document.title?.slice(0, 120),
    language: (document.documentElement.lang?.startsWith('en') ? 'en' : 'tr') as 'tr' | 'en',
  };
}

/**
 * Type-safe event emitter.
 *
 * @example
 *   emit('cta_click', { cta_name: 'Hero CTA', cta_location: 'hero' });
 *   emit('form_submit', { form_id: 'contact', success: true });
 */
export function emit<K extends EventName>(name: K, payload: EventMap[K]): void {
  const category = EVENT_CATEGORY[name];
  const fullPayload = {
    event_category: category,
    ...ctx(),
    ...payload,
  };
  const w =
    typeof window !== 'undefined'
      ? (window as unknown as {
          gtag?: (...args: unknown[]) => void;
          _last_analytics_event?: { action: string; timestamp: string; [k: string]: unknown };
        })
      : null;
  if (w?.gtag) {
    w.gtag('event', name, fullPayload);
  }
  if (import.meta.env.DEV) {
    Logger.debug(`[analytics] ${name}`, fullPayload);
    if (w) {
      w._last_analytics_event = {
        action: name,
        timestamp: fullPayload.timestamp ?? new Date().toISOString(),
        ...fullPayload,
      };
    }
  }
}

/**
 * Helper to dispatch raw event without type-checking (escape hatch).
 * AVOID — prefer emit() for new code so taxonomy stays enforced.
 */
export function emitRaw(name: string, payload: Record<string, unknown>): void {
  const w =
    typeof window !== 'undefined'
      ? (window as unknown as { gtag?: (...args: unknown[]) => void })
      : null;
  if (w?.gtag) {
    w.gtag('event', name, { ...ctx(), ...payload });
  }
  if (import.meta.env.DEV) {
    Logger.debug(`[analytics:raw] ${name}`, payload);
  }
}
