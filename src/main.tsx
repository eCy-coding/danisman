import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '../index.css';
import './styles/print.css';
import './lib/i18n-react'; // Phase 20 B2: bootstrap react-i18next once
import i18n from 'i18next';
import { applyRtl } from './lib/rtl';
// P39-T09: Apply dir attribute on locale change (RTL scaffold)
applyRtl(i18n.language ?? 'tr');
i18n.on('languageChanged', applyRtl);
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import { initWebVitals } from './utils/monitoring';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { AppProviders } from './components/providers/AppProviders';
import { Logger } from './lib/logger';

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  initWebVitals();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

// Phase 31: The Sovereign Vault - Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        Logger.info('[Vault] Service Worker registered in scope: ', registration?.scope);
      })
      .catch((error) => {
        Logger.error('[Vault] Service Worker registration failed: ', error);
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
