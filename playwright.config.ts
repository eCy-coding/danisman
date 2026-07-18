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

// Mock-server port — override with E2E_MOCK_PORT when 3099 is held by a
// foreign process on this machine. Default MUST stay 3099 (CI + other
// machines rely on it going unset).
const MOCK_PORT = process.env.E2E_MOCK_PORT ?? '3099';

export default defineConfig({
  testDir: './e2e',
  testIgnore: '*bash_commands.test.ts',
  globalSetup: './e2e/global-setup.ts',
  snapshotDir: './e2e/snapshots',
  timeout: 90_000,
  globalTimeout: 30 * 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 6,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
    toMatchSnapshot: { threshold: 0.2 },
  },
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:4173',
          localStorage: [{ name: 'ecypro_cookie_consent', value: CONSENT_SEED }],
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
      command: `MOCK_PORT=${MOCK_PORT} MOCK_CAL_SECRET=e2e-test-webhook-secret node server/mock-server.mjs`,
      url: `http://localhost:${MOCK_PORT}/__health`,
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      // PW_BROWSER_CHANNEL=chrome → run against system Chrome (zero-download
      // escape hatch for machines where the bundled-chromium download is
      // broken). Unset (CI default) keeps the pinned Playwright chromium.
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PW_BROWSER_CHANNEL ? { channel: process.env.PW_BROWSER_CHANNEL } : {}),
      },
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
