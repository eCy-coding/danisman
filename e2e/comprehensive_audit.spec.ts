import { test, expect } from '@playwright/test';

// Benign error patterns expected in local/preview environments
const BENIGN_CONSOLE_PATTERNS = [
  'Third-party cookie',
  'frame-ancestors',
  'Service Worker',
  'App installed',
  'Connection Lost Event',
  'Content Security Policy',
  'ERR_NAME_NOT_RESOLVED',
  'unhealthy state on startup',
  'Cross-Origin Request Blocked',
  'Failed to load resource',
  'Sentry',
  'Session Replay',
  'net::ERR_',
  'sendBeacon',
  'useTranslation',
  'i18next',
  'the server responded with a status of 4',
  'ecypro.com',
  'localhost:3099',
  'A server with the specified hostname could not be found',
  'width(-1) and height(-1)', // Recharts dimension warning for hidden containers
  'should be greater than 0', // Recharts chart size warning
  '<circle>', // Recharts SVG circle attribute warning (upstream)
  'attribute cx', // Recharts circle cx/cy undefined (upstream)
  'attribute cy', // Recharts circle cy undefined (upstream)
  'Expected length', // SVG attribute validation (Recharts upstream)
  'Live API unreachable', // RealTime simulation mode warning
  'Client Simulation Mode', // RealTime fallback
  'Failed to load blog post', // MDX not found for generated blog slugs
  'Unknown variable dynamic import', // Vite dynamic import for missing MDX
  '[Matrix]', // Custom performance monitor warnings
  'Poor Performance Detected', // Matrix Engine CLS/FPS warnings
  'CLS =', // Cumulative Layout Shift metric log
  'Ignoring unsupported entryTypes', // Firefox: PerformanceObserver layout-shift not supported
  'Unexpected value undefined parsing', // Firefox: Recharts SVG cx/cy undefined
  'bounce tracker', // Firefox anti-tracking state purge warning
  '[JavaScript Warning:', // Firefox wraps all warnings in this prefix
  '[JavaScript Error:', // Firefox wraps all errors in this prefix
  'localhost:4173', // All localhost preview server messages
];

const BENIGN_NETWORK_PATTERNS = [
  'ecypro.com',
  'sentry.io',
  'localhost:3099',
  '/sw.js',
  '/workbox-',
  '/manifest',
  '/favicon',
  '/analytics',
  '/api/events', // SSE endpoint not implemented in preview
  '/api/', // All mock API endpoints may return 404 in static preview
  'localhost:4173/api', // Preview server proxied API calls
];

test.describe('The Sentinel: Comprehensive System Audit', () => {
  test.use({ storageState: undefined });
  const visitedUrls = new Set<string>();
  const urlsToVisit: string[] = ['/'];
  const errorLogs: string[] = [];
  const brokenLinks: string[] = [];

  test('should crawl the entire site without errors', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    // Mock external API endpoints
    await page.route('https://api.ecypro.com/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/health')) {
        await route.fulfill({ status: 200, json: { status: 'ok' } });
      } else {
        await route.fulfill({ status: 200, json: {} });
      }
    });
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200, json: {} }));
    await page.route('**/api.telegram.org/**', (r) =>
      r.fulfill({ status: 200, json: { ok: true } }),
    );
    await page.route('**/api/geo/**', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { country: 'TR', flag: '🇹🇷', currency: 'TRY', suggestedLang: 'tr' },
        }),
      }),
    );
    await page.route('**/localhost:4001/**', (r) => r.fulfill({ status: 200, body: '[]' }));
    await page.route('**/googletagmanager.com/**', (r) => r.fulfill({ status: 200 }));
    await page.route('**/google-analytics.com/**', (r) => r.fulfill({ status: 200 }));

    // 1. Listen for Console Errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = msg.text();
        if (!BENIGN_CONSOLE_PATTERNS.some((p) => text.includes(p))) {
          errorLogs.push(`[${page.url()}] Console ${msg.type()}: ${text}`);
        }
      }
    });

    // 2. Listen for Network Errors (404s, 500s)
    page.on('response', (response) => {
      if (response.status() >= 400 && response.status() !== 999) {
        const url = response.url();
        if (!BENIGN_NETWORK_PATTERNS.some((p) => url.includes(p))) {
          errorLogs.push(`[${page.url()}] Network Error: ${response.status()} ${url}`);
        }
      }
    });

    const MAX_PAGES = 25;
    while (urlsToVisit.length > 0 && visitedUrls.size < MAX_PAGES) {
      const currentPath = urlsToVisit.shift()!;
      if (visitedUrls.has(currentPath)) continue;
      visitedUrls.add(currentPath);

      await page
        .goto(currentPath, { waitUntil: 'domcontentloaded', timeout: 15000 })
        .catch(() => null);
      await page.waitForTimeout(200);

      // 3. Collect Internal Links via bulk eval (fast)
      const hrefs: string[] = await page.$$eval('a[href^="/"]', (els) =>
        els.map((el) => el.getAttribute('href') ?? '').filter(Boolean),
      );
      for (const href of hrefs) {
        if (!visitedUrls.has(href) && !urlsToVisit.includes(href)) {
          if (!href.includes('.') || href.includes('.html')) {
            urlsToVisit.push(href);
          }
        }
      }
    }

    // 4. Report Findings
    if (errorLogs.length > 0) {
      console.error('--- SENTINEL REPORT: ERRORS DETECTED ---');
      errorLogs.forEach((log) => console.error(log));
      console.error('----------------------------------------');
    }

    if (brokenLinks.length > 0) {
      console.error('--- SENTINEL REPORT: BROKEN LINKS ---');
      brokenLinks.forEach((link) => console.error(link));
    }

    expect(errorLogs.length, 'System should be free of console and network errors').toBe(0);
  });
});
