// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Pre-seed cookie-consent so the GDPR banner does NOT intercept pointer events
// in CRO / SmartCTA / booking flows. Individual consent tests opt out via
// `context.clearCookies()` + `page.evaluate(() => localStorage.clear())`.
const CONSENT_SEED = JSON.stringify({
  timestamp: '2026-01-01T00:00:00.000Z',
  type: 'all',
  preferences: { essential: true, analytics: true, marketing: true },
});

export default defineConfig({
  testDir: './e2e',
  testIgnore: '*bash_commands.test.ts',
  timeout: 60_000,
  workers: 4,
  expect: {
    timeout: 8000,
  },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [
            { name: 'ecypro_cookie_consent', value: CONSENT_SEED },
          ],
        },
      ],
    },
  },
  webServer: [
    {
      command: 'npx vite preview --port 4173',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'node server/mock-server.mjs',
      url: 'http://localhost:3001/__health',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
