import { defineConfig, devices } from '@playwright/test';

/**
 * Preview smoke config — separate from the root e2e config so it can point at
 * either a deployed Vercel preview (set PREVIEW_URL) or a local `vite preview`.
 *
 *   PREVIEW_URL=https://<deploy>.vercel.app \
 *     npx playwright test --config=scripts/qa/playwright.preview.config.ts
 *
 * With no PREVIEW_URL it boots a local `vite preview` on :4173 and runs there.
 */
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:4173';
const isLocal = PREVIEW_URL.includes('localhost') || PREVIEW_URL.includes('127.0.0.1');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-preview' }]],
  use: {
    baseURL: PREVIEW_URL,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  ...(isLocal
    ? {
        webServer: {
          command: 'npx vite preview --port 4173',
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // iPhone SE (375px) — smallest mainstream viewport; guards the launch
    // layout against overflow/tap-target regressions on a narrow screen.
    { name: 'mobile-safari-se', use: { ...devices['iPhone SE'] } },
  ],
});
