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

if (import.meta.env.PROD) {
  initWebVitals();
  scheduleHealthCheck();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// P44: SW registration disabled. Older deployments cached stale lp.js with
// wrong MIME (text/plain), causing dynamic import to fail and ErrorBoundary
// to render the Hizmet Kesintisi screen. Unregister any existing SW on load.
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
