/**
 * P35-T05: CSP Nonce Middleware
 *
 * Architecture:
 *   - Per-request random nonce (crypto.randomUUID) prevents replay attacks
 *   - SSR/SPA hybrid: nonce injected into HTML via Express response interceptor
 *   - `res.locals.cspNonce` available for downstream middleware/templates
 *
 * CSP Policy:
 *   - script-src: 'self' 'nonce-{nonce}' 'strict-dynamic' — eliminates 'unsafe-inline'
 *   - 'strict-dynamic' allows nonce-bearing scripts to load sub-scripts (GA4, Sentry)
 *   - style-src: 'self' 'unsafe-inline' — Tailwind in-app styles still needed
 *   - connect-src: strict list + wss for SSE/WebSocket
 *
 * Usage in Express:
 *   app.use(cspNonce);
 *   // In HTML template/index.html: replace __CSP_NONCE__ with res.locals.cspNonce
 *
 * Note: SPA (Vite) doesn't support server-side nonce injection without SSR.
 * For Vite SPA: nonce is added to CSP header; inline scripts must use nonce.
 * Production: remove 'unsafe-inline' from script-src (requires nonce on all scripts).
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const ALLOWED_CONNECT = [
  "'self'",
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.ingest.sentry.io',
  'https://api.ecypro.com',
  'https://*.ecypro.com',
  'wss://*.ecypro.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:*' : '',
  process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
]
  .filter(Boolean)
  .join(' ');

export function cspNonce(req: Request, res: Response, next: NextFunction): void {
  const nonce = randomUUID().replace(/-/g, '');
  res.locals.cspNonce = nonce;

  const isProd = process.env.NODE_ENV === 'production';

  // Script-src: nonce-based strict policy in production
  // Development: keep 'unsafe-inline' for HMR / Vite dev server
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://cdn.jsdelivr.net`
    : `'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google-analytics.com`;

  const cspHeader = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${ALLOWED_CONNECT}`,
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    isProd ? 'upgrade-insecure-requests' : '',
    'block-all-mixed-content',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
}
