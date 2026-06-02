import { test, expect } from '@playwright/test';

const CONSENT_SEED = JSON.stringify({
  timestamp: '2026-01-01T00:00:00.000Z',
  type: 'all',
  preferences: { essential: true, analytics: true, marketing: true },
});

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const LOCALES = [
  { prefix: 'tr', path: '/' },
  { prefix: 'en', path: '/en' },
];

test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:4173',
        localStorage: [{ name: 'ecypro_cookie_consent', value: CONSENT_SEED }],
      },
    ],
  },
});

for (const { name, width, height } of VIEWPORTS) {
  for (const { prefix, path } of LOCALES) {
    test(`visual: ${name} ${prefix} homepage — baseline`, async ({ page }) => {
      test.setTimeout(30_000);
      await page.setViewportSize({ width, height });
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() === 404) {
        test.skip(true, `${path} → 404 for locale ${prefix}`);
        return;
      }
      await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 300));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`homepage-${name}-${prefix}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    });
  }
}
