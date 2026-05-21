import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-ext-400.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-ext-600.css';
import '../index.css';
import './styles/print.css';
import './lib/i18n-react';
import i18n from 'i18next';
import { applyRtl } from './lib/rtl';
applyRtl(i18n.language ?? 'tr');
i18n.on('languageChanged', applyRtl);
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import { initWebVitals } from './utils/monitoring';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { AppProviders } from './components/providers/AppProviders';
import { Logger } from './lib/logger';
import { scheduleHealthCheck } from './lib/api';
import posthog from 'posthog-js';

// P97 — PostHog analytics (KVKK strict opt-in).
// Capturing disabled until ConsentBanner records explicit user consent.
// EU host keeps data inside EEA; IP is dropped; DNT is respected.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://eu.posthog.com';

if (POSTHOG_KEY && typeof window !== 'undefined') {
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
}

if (import.meta.env.PROD) {
  initWebVitals();
  scheduleHealthCheck();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// P44: Service Worker registration disabled. Older deployments cached stale
// lp.js with wrong MIME (text/plain), causing dynamic import to fail and the
// ErrorBoundary to render the Hizmet Kesintisi screen. Unregister any existing
// SW on load and skip registration so the app loads from the CDN.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then((results) => {
        if (results && results.length) {
          Logger.info('[Vault] Stale Service Workers unregistered:', results.length);
        }
      })
      .catch((err) => {
        Logger.warn('[Vault] SW cleanup failed:', err);
      });
  });
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <AppProviders>
          <App />
        </AppProviders>
      </GlobalErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
);
