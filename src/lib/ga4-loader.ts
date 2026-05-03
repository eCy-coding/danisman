/**
 * src/lib/ga4-loader.ts — Phase 20.5 R3
 *
 * Consent-gated, idempotent GA4 (`gtag.js`) loader.
 *
 * Contract:
 *   - `loadGA4(measurementId)` injects the GA4 script + bootstraps
 *     `window.dataLayer` and `window.gtag`. Idempotent: a second call with the
 *     same id is a no-op; a different id swaps the script.
 *   - `unloadGA4()` removes the injected script tag, deletes
 *     `window.gtag`, clears `window.dataLayer`, and (best-effort) revokes the
 *     `_ga*` cookies. Safe to call when GA4 was never loaded.
 *   - The loader is browser-only; it short-circuits during SSR/build/test
 *     when `window` is undefined.
 *
 * Caller is responsible for honoring consent (KVKK / GDPR). This module is a
 * primitive — see `AnalyticsProvider.tsx` for the consent-aware wiring.
 */

const SCRIPT_DATA_ATTR = 'data-ecypro-ga4';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function findExistingScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLScriptElement>(`script[${SCRIPT_DATA_ATTR}]`);
}

export function isLoaded(measurementId?: string): boolean {
  const existing = findExistingScript();
  if (!existing) return false;
  if (!measurementId) return true;
  return existing.dataset.measurementId === measurementId;
}

export function loadGA4(measurementId: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!measurementId) return;

  const existing = findExistingScript();
  if (existing && existing.dataset.measurementId === measurementId) return; // idempotent
  if (existing) existing.remove(); // swap

  // Bootstrap dataLayer + gtag stub before script load (Google's recommended pattern).
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.setAttribute(SCRIPT_DATA_ATTR, '');
  script.dataset.measurementId = measurementId;
  document.head.appendChild(script);
}

export function unloadGA4(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const existing = findExistingScript();
  if (existing) existing.remove();

  // Reset gtag state. We zero out dataLayer to drop any queued events that
  // could otherwise be sent if the script were ever re-injected.
  window.dataLayer = [];
  try {
    delete window.gtag;
  } catch {
    window.gtag = undefined;
  }

  // Best-effort cookie cleanup (GA4 default cookies). Same-domain only.
  if (typeof document !== 'undefined') {
    const host = window.location?.hostname ?? '';
    document.cookie.split(';').forEach((raw) => {
      const name = raw.split('=')[0]?.trim();
      if (!name) return;
      if (name.startsWith('_ga') || name === '_gid' || name === '_gat') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  }
}
