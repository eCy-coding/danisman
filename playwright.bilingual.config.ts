// playwright.bilingual.config.ts
//
// Standalone config for the Track 4 bilingual smoke suite. Unlike the main
// e2e config it targets an EXTERNAL origin (BASE_URL, default prod) and spins
// up no local webServer, so it can validate the live TR/EN surface directly.
import { defineConfig, devices } from '@playwright/test';

const BASE = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');

export default defineConfig({
  testDir: './scripts/qa',
  testMatch: 'bilingual-smoke.spec.ts',
  timeout: 60_000,
  retries: 1,
  workers: 4,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/bilingual-results.json' }]],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Only spin up the local preview when targeting localhost. Against an
  // external BASE_URL (prod smoke) we skip the webServer entirely.
  webServer: BASE.includes('localhost')
    ? {
        command: 'npx vite preview --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
