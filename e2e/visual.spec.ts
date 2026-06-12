/**
 * e2e/visual.spec.ts — P18 FE Track 1, Aşama 3.
 *
 * Visual regression baseline for the 6 most-trafficked public routes.
 * Each route is captured at both a mobile viewport (375 × 812 — iPhone X
 * baseline matching `.storybook/preview.ts`) and the chromium desktop
 * default (1280 × 720).
 *
 * Why this exists separately from `crawl_*.spec.ts`:
 *   - those crawl specs assert *content* (alt text, link integrity);
 *     they don't gate against unintended visual drift.
 *   - design doctrine (`AI Studio Tech`) explicitly forbids glassmorphism
 *     and magic numbers; visual drift on Fibonacci spacing tokens is a
 *     subtle regression that copy/integration tests miss.
 *
 * Baseline workflow:
 *   - First run: `npx playwright test e2e/visual.spec.ts --update-snapshots`
 *     writes PNGs under `e2e/snapshots/visual.spec.ts-snapshots/`.
 *   - Subsequent runs compare with `toHaveScreenshot` — the project-wide
 *     `maxDiffPixelRatio: 0.05` (playwright.config.ts) tolerates ~5%
 *     pixel diff to absorb font-rendering noise without missing real
 *     visual breaks.
 *
 * Stabilisation:
 *   - Animations disabled via CSS (`* { transition: none; animation: none; }`)
 *     to avoid spinner / hover-state flakiness.
 *   - External image hosts stubbed (same pattern as a11y-ci.spec.ts).
 *   - `body { caret-color: transparent }` to neutralise focus-ring blink.
 *   - `waitForLoadState('networkidle')` + extra 800 ms settle.
 *
 * Running fully:
 *   npx playwright test e2e/visual.spec.ts --project=chromium
 *
 * Diff updates (intentional UI change):
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 */

import { test, expect, type Page } from '@playwright/test';

const ROUTES: ReadonlyArray<{ path: string; label: string }> = [
  { path: '/', label: 'home' },
  { path: '/services', label: 'services' },
  { path: '/pricing', label: 'pricing' },
  { path: '/about', label: 'about' },
  { path: '/contact', label: 'contact' },
  { path: '/perspektifler', label: 'blog' },
];

const VIEWPORTS: ReadonlyArray<{ name: string; width: number; height: number }> = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 720 },
];

async function stabilise(page: Page): Promise<void> {
  // Stub flaky external image hosts.
  await page.route(/images\.unsplash\.com|via\.placeholder|pexels\.com|picsum\.photos/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  );
  // Disable animations + caret to remove the two largest sources of
  // pixel-diff noise.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        animation-duration: 0s !important;
      }
      body { caret-color: transparent !important; }
    `,
  });
}

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`visual — ${route.label} (${vp.name})`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await stabilise(page);
      // Settle for fonts + lazy-mount.
      await page.waitForTimeout(800);

      await expect(page).toHaveScreenshot(`${route.label}-${vp.name}.png`, {
        fullPage: true,
        // Per-route override of the project-wide threshold can be added
        // here if a single route is unusually noisy.
        maxDiffPixelRatio: 0.05,
        // Animations explicitly off — redundant with our CSS injection
        // but documents intent.
        animations: 'disabled',
      });
    });
  }
}
