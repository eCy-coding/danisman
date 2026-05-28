import React from 'react';
import ReactDOM from 'react-dom/client';

import KeystaticPage from './page';
// index.css removed: Keystatic uses its own design system; the CSS import
// caused Vite to emit a shared raw CSS chunk with @import 'tailwindcss' literal
// that triggered a browser MIME error on the main SPA (ecypro.com).

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KeystaticPage />
  </React.StrictMode>,
);
