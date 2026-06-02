import { test, expect } from '@playwright/test';

const PERF_ROUTES = ['/', '/services', '/pricing', '/about', '/contact', '/founder'];

test.describe('Page Load Performance — Thresholds', () => {
  for (const route of PERF_ROUTES) {
    test(`perf: ${route} — TTFB + DCL + Load`, async ({ page }) => {
      test.setTimeout(30_000);
      await page.goto(route, { waitUntil: 'load' });
      const timing = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (!entries.length) return null;
        const nav = entries[0];
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          dcl: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          load: Math.round(nav.loadEventEnd - nav.startTime),
        };
      });
      if (!timing) {
        test.skip(true, 'Navigation timing API unavailable');
        return;
      }
      console.warn(JSON.stringify({ route, ...timing }));
      expect.soft(timing.ttfb, `TTFB ${route}`).toBeLessThan(600);
      expect.soft(timing.dcl, `DOMContentLoaded ${route}`).toBeLessThan(2000);
      expect.soft(timing.load, `Load ${route}`).toBeLessThan(3000);
    });
  }
});

test.describe('Bundle weight check', () => {
  test('total JS transfer < 250KB', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('/', { waitUntil: 'load' });
    const resources = await page.evaluate(() =>
      (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter((r) => r.name.endsWith('.js'))
        .map((r) => ({ name: r.name.split('/').pop() ?? '', size: r.transferSize })),
    );
    const totalJS = resources.reduce((s, r) => s + r.size, 0);
    console.warn('Total JS transfer:', totalJS, 'bytes');
    expect.soft(totalJS, 'Total JS < 250KB').toBeLessThan(250_000);
  });
});
