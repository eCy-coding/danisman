// playwright.smoke.config.ts
// Production-targeting smoke suite — no local webServer, no pre-seeded consent.
// Run with: npx playwright test --config=playwright.smoke.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/smoke',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 3 : undefined,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-smoke' }],
    ['json', { outputFile: 'test-results/smoke-results.json' }],
    ...(process.env.GITHUB_ACTIONS ? [['github'] as ['github']] : []),
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://www.ecypro.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
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
