import React from 'react';
import ReactDOM from 'react-dom/client';
// P17 — Font subset optimisation. Previously each weight CSS file (e.g.
// `@fontsource/inter/400.css`) declared 7 `@font-face` blocks: cyrillic,
// cyrillic-ext, greek, greek-ext, vietnamese, latin, latin-ext. The
// browser never DOWNLOADED the unused subsets (unicode-range gating),
// but every @font-face block costs CSS parse + font-matching cycles,
// and stale subset files still shipped via the asset pipeline (~500KB
// of dead .woff/.woff2 in `dist/fonts/`).
//
// Switching to subset-specific imports (`latin-400.css` +
// `latin-ext-400.css`) keeps full TR + EN coverage (latin-ext supplies
// ı, ş, ğ, ç, ö, ü) and drops:
//   - 5 Inter subsets × 5 weights × (woff2 + woff) = 50 files
//   - 5 Playfair subsets × 3 weights × (woff2 + woff) = 30 files
//   - 5–7 @font-face blocks per weight from the rendered CSS.
//
// All @fontsource subset stylesheets ship `font-display: swap` by default,
// so FOIT is avoided on first paint (verified in node_modules).
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-ext-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-ext-400.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-ext-600.css';
import '@fontsource/playfair-display/latin-700.css';
import '@fontsource/playfair-display/latin-ext-700.css';
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
import { scheduleHealthCheck } from './lib/api';

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  initWebVitals();
  // Plan C hybrid: probe api.ecypro.com once after hydration so operators see
  // a clear breadcrumb when the backend is unreachable. No-ops in simulation
  // mode (VITE_API_URL unset) or in DEV.
  scheduleHealthCheck();
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
