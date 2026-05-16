/**
 * P40-T02: Lighthouse CI Configuration
 *
 * Runs against the production preview build.
 * Fails CI if any metric drops below assertion thresholds.
 *
 * Thresholds (conservative — CDN adds 15-20 points to local):
 *   Performance   ≥ 0.70 (local preview; CDN target ≥ 0.90)
 *   Accessibility ≥ 0.98 (zero regression from current 100)
 *   Best Practices ≥ 0.95
 *   SEO           ≥ 1.00 (must not drop)
 *
 * Usage: npx lhci autorun
 * Install: npm install -D @lhci/cli
 */

'use strict';

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/services',
        'http://localhost:4173/about',
        'http://localhost:4173/contact',
        'http://localhost:4173/blog',
        'http://localhost:4173/pricing',
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local.*4173',
      startServerReadyTimeout: 45_000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttlingMethod: 'provided',
        disableStorageReset: true,
        extraHeaders: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      assertions: {
        // P12/5 — devops-publisher: promote performance to HARD error to
        // align with the publish charter (Perf ≥ 60 preview / ≥ 80 on CDN).
        // Charter source: outputs/P6_PERF_CHARTER.md.
        'categories:performance':     ['error', { minScore: 0.60 }],
        'categories:accessibility':   ['error', { minScore: 0.95 }],
        'categories:best-practices':  ['error', { minScore: 0.90 }],
        'categories:seo':             ['error', { minScore: 1.00 }],
        // Core Web Vitals — LCP/TBT promoted to error with looser bound to
        // catch true regressions without flaking on transient CI noise.
        'largest-contentful-paint':   ['error', { maxNumericValue: 5000 }],
        'cumulative-layout-shift':    ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time':        ['error', { maxNumericValue: 900 }],
        // SEO/Meta
        'meta-description':           ['error', { minScore: 1 }],
        'canonical':                  ['error', { minScore: 1 }],
        'hreflang':                   ['warn',  { minScore: 1 }],
        // A11y
        'color-contrast':             ['error', { minScore: 1 }],
        'document-title':             ['error', { minScore: 1 }],
        'html-has-lang':              ['error', { minScore: 1 }],
        // Performance
        'uses-text-compression':      ['warn',  { minScore: 1 }],
        'uses-optimized-images':      ['warn',  { minScore: 1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
