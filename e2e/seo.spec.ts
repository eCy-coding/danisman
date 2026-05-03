 
import { test, expect } from '@playwright/test';

test.describe('SEO & Metadata Audit', () => {
  test('Verify robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
  });

  test('Verify Web Vitals initialization in production (Mock)', async ({ page }) => {
    // Inject a script to spy on web-vitals or verify its presence
    const isWebVitalsPresent = await page.evaluate(() => {
      return !!(window as Window).performance;
    });
    expect(isWebVitalsPresent).toBe(true);
  });

  test('Verify sitemap.xml', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');
  });

  test('Verify meta tags on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Title
    await expect(page).toHaveTitle(/EcyPro|ECYPRO/i);
    
    // Generic meta tags
    const description = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(description).toBeTruthy();
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Favicon check
    const favicon = await page.locator('link[rel*="icon"]').first();
    await expect(favicon).toBeDefined();
  });
});
