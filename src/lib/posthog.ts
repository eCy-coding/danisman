/**
 * Lazy PostHog wrapper — dynamic import defers the ~100KB posthog-js chunk
 * until first use (idle callback), keeping it off the critical rendering path.
 * Consent-v1 integration preserved: analytics opt-in/out reacts to
 * ecypro:consent-changed events from CookieBanner.
 */
import { readConsent, type ConsentRecord } from './consent-v1';

type PostHogModule = typeof import('posthog-js');

const POSTHOG_KEY = (import.meta.env.VITE_POSTHOG_KEY ?? '').trim();
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST ?? '').trim() || 'https://eu.i.posthog.com';

let _instance: PostHogModule['default'] | null = null;
let _initPromise: Promise<PostHogModule['default'] | null> | null = null;

function applyConsent(ph: PostHogModule['default'], record: ConsentRecord | null): void {
  try {
    if (record?.analytics) {
      ph.opt_in_capturing();
    } else {
      ph.opt_out_capturing();
    }
  } catch {
    /* posthog may be disabled (no key) — silent */
  }
}

/**
 * Lazily load posthog-js and call .init(). Safe to call multiple times —
 * subsequent calls return the cached instance.
 */
export function initPostHog(): void {
  if (_instance || _initPromise) return;
  if (typeof window === 'undefined') return;
  if (!POSTHOG_KEY || POSTHOG_KEY.startsWith('phc_PLACE')) return;

  _initPromise = (async () => {
    try {
      const { default: posthog } = await import('posthog-js');
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
      _instance = posthog;

      // Restore consent from storage on init.
      applyConsent(posthog, readConsent());

      // React to consent changes from CookieBanner.
      window.addEventListener('ecypro:consent-changed', (e: Event) => {
        const detail = (e as CustomEvent<ConsentRecord | null>).detail;
        applyConsent(posthog, detail ?? readConsent());
      });

      return posthog;
    } catch {
      // eslint-disable-next-line no-console -- bootstrap path, Logger may not be ready
      console.warn('[PostHog] Failed to load posthog-js');
      return null;
    }
  })();
}

/**
 * Get the cached PostHog instance. Returns null if not yet loaded.
 * For components (ContactForm, etc.) that fire analytics events.
 */
export async function getPostHog(): Promise<PostHogModule['default'] | null> {
  if (_instance) return _instance;
  if (_initPromise) return _initPromise;
  return null;
}
