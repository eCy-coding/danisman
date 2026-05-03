import { Page } from '@playwright/test';

/**
 * Sets up network mocks for external APIs in Playwright tests.
 * Ensures tests are independent, reliable, and don't leak real API keys.
 */
export async function setupExternalMocks(page: Page) {
  // Mock EmailJS
  await page.route('**/api.emailjs.com/**', async route => {
    const json = { status: 200, text: 'OK' };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(json),
    });
  });

  // Mock Gemini API
  await page.route('**/generativelanguage.googleapis.com/**', async route => {
    const json = {
      candidates: [
        {
          content: {
            parts: [
              { text: "1. Strength: High Utilization\n2. Risk: Client Diversification\n3. Action: Invest in AI training." }
            ]
          }
        }
      ]
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(json),
    });
  });

  // Mock Google Analytics / Monitoring (optional, avoids noise)
  await page.route('**/www.google-analytics.com/**', route => route.abort());
}
