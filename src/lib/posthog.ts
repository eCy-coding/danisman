import posthog from 'posthog-js';
import { readConsent, type ConsentRecord } from './consent-v1';

// PostHog EU host — KVKK/GDPR uyumu için tüm event'ler eu.i.posthog.com'da
// kalır. opt_out_capturing_by_default=true → kullanıcı analytics rızası
// verene kadar hiçbir event ağa çıkmaz.
const POSTHOG_KEY = (import.meta.env.VITE_POSTHOG_KEY ?? '').trim();
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST ?? '').trim() || 'https://eu.i.posthog.com';

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY || POSTHOG_KEY.startsWith('phc_PLACE')) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    opt_out_capturing_by_default: true,
    persistence: 'localStorage',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    ip: false,
    respect_dnt: true,
  });
  initialized = true;

  // Restore consent from storage on init.
  applyConsent(readConsent());

  // React to consent changes from CookieBanner.
  window.addEventListener('ecypro:consent-changed', (e: Event) => {
    const detail = (e as CustomEvent<ConsentRecord | null>).detail;
    applyConsent(detail ?? readConsent());
  });
}

function applyConsent(record: ConsentRecord | null): void {
  if (!initialized) return;
  try {
    if (record?.analytics) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  } catch {
    /* posthog may be disabled (no key) — silent */
  }
}

export { posthog };
