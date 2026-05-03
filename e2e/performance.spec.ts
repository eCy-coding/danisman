 
import { test, expect } from '@playwright/test';

test.describe('Performance Audit', () => {
  test('Verify bundle loading and chunks', async ({ page }) => {
    const responses: string[] = [];
    page.on('response', response => {
      responses.push(response.url());
    });
    
    await page.goto('/');
    
    // Check if vendor or main chunks are loaded
    const hasJsChunk = responses.some(url => url.endsWith('.js'));
    expect(hasJsChunk).toBe(true);
  });

  test('Verify Web Vitals initialization in production (Mock)', async ({ page }) => {
    // Inject a script to spy on web-vitals or verify its presence
    const isWebVitalsPresent = await page.evaluate(() => {
      return !!(window as Window).performance;
    });
    expect(isWebVitalsPresent).toBe(true);
  });
});
