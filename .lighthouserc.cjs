/**
 * P51.2 — Lighthouse CI configuration.
 *
 * Production URL'a karşı her PR'da Lighthouse mobil + desktop.
 * Performance ≥85, A11y ≥95, BP ≥90, SEO ≥95 fail gate.
 *
 * Local manual run: `npx @lhci/cli@latest collect && npx @lhci/cli@latest assert`
 */

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: [
        'https://www.ecypro.com/',
        'https://www.ecypro.com/services',
        'https://www.ecypro.com/services/strategic-transformation',
        'https://www.ecypro.com/about',
        'https://www.ecypro.com/pricing',
        'https://www.ecypro.com/contact',
        'https://www.ecypro.com/blog',
        // P55.D3 — newly published pillar + annual report routes
        'https://www.ecypro.com/pillar/stratejik-donusum',
        'https://www.ecypro.com/annual-report/2025',
        'https://www.ecypro.com/methodology',
      ],
      numberOfRuns: 1, // CI cost-saving; bump to 3 for stable median
      settings: {
        preset: 'desktop',
        // mobile için ayrı job: --collect.settings.preset=mobile
        throttlingMethod: 'simulate',
        screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Score thresholds (0-1 scale)
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Specific audit overrides — Vercel Hobby tier realistic
        'unused-javascript': 'warn',
        'uses-rel-preconnect': 'warn',
        'render-blocking-resources': 'warn',
        'csp-xss': 'warn',
      },
    },
    upload: {
      // Upload to LHCI server if configured; else artifact-only
      target: 'temporary-public-storage',
    },
  },
};
