import { readConsent, type ConsentRecord } from './consent-v1';

// Google Tag Manager — marketing rızası gelene kadar script YÜKLEMEZ.
// KVKK m.5 + GDPR Art.7 stricter compliance: load-on-consent flow.
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const GTM_ID = (import.meta.env.VITE_GTM_ID ?? '').trim();

let scriptLoaded = false;
let listenerBound = false;

function loadGtmScript(): void {
  if (scriptLoaded) return;
  if (!GTM_ID || GTM_ID.startsWith('GTM-PLACE')) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);

  scriptLoaded = true;
}

export function initGtm(): void {
  if (typeof window === 'undefined') return;
  if (!GTM_ID || GTM_ID.startsWith('GTM-PLACE')) return;

  const initial = readConsent();
  if (initial?.marketing) {
    loadGtmScript();
  }

  if (listenerBound) return;
  listenerBound = true;
  window.addEventListener('ecypro:consent-changed', (e: Event) => {
    const detail = (e as CustomEvent<ConsentRecord | null>).detail;
    const record = detail ?? readConsent();
    if (record?.marketing) {
      loadGtmScript();
    }
  });
}
