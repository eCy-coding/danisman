/**
 * P34 — GA4 noop adapter (static-only emergency mode).
 *
 * `VITE_GA_TRACKING_ID` boş ise analytics çağrıları console.debug'a düşer.
 * Production'da silent (NODE_ENV === 'production' && DEBUG=0).
 *
 * Kullanım:
 *   import { trackEventSafe } from '@/lib/analytics-noop';
 *   trackEventSafe('contact_submit', { source: 'footer' });
 *
 * `analytics.ts` (gerçek GA4 wrapper) zaten var; bu modül onun fallback'i.
 * Çağıran tarafta env check yapılır:
 *   const id = import.meta.env.VITE_GA_TRACKING_ID;
 *   if (id) trackEvent(...) else trackEventSafe(...)
 */

import { Logger } from './logger';

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

let warned = false;

/**
 * GA4 olmadan event göndermek için noop adapter.
 * - SSR güvenli (window check)
 * - İlk çağrıda bir kez warning logla; sonraki çağrılarda sessiz
 * - Param shape doğrulaması yapmaz; tip seviyesinde garantili
 */
export function trackEventSafe(eventName: string, params?: AnalyticsParams): void {
  if (typeof window === 'undefined') return;
  if (!warned) {
    Logger.warn('[analytics-noop] GA4 disabled (VITE_GA_TRACKING_ID empty) — events going to /dev/null');
    warned = true;
  }
  if (import.meta.env.DEV) {
    // Dev'de görünür; production'da `Logger.debug` config'e bağlı.
    Logger.debug(`[analytics-noop] ${eventName}`, params ?? {});
  }
}

/**
 * Page view noop. Production'da silent, dev'de görünür.
 */
export function trackPageViewSafe(path: string): void {
  trackEventSafe('page_view', { page_path: path });
}

/**
 * GA4 yüklenip yüklenmediğini sorgu. `analytics.ts` orchestrator
 * loader ile entegre edilebilir.
 */
export function isAnalyticsDisabled(): boolean {
  const id = (import.meta.env.VITE_GA_TRACKING_ID as string | undefined) ?? '';
  return id.trim().length === 0;
}
