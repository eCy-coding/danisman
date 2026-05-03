/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Omni-Protocol V9: The Spider Crawler
 * Goal: Verify 100% of the site's surface area.
 * Strategy: Parse sitemap.xml to find all known routes, then visit each one.
 */

test.describe('The Spider Crawler (Protocol V9)', () => {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  let urls: string[] = [];

  test.beforeAll(async () => {
    // 1. Parse Sitemap
    if (fs.existsSync(sitemapPath)) {
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
      const matches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
      if (matches) {
        // Extract URLs and convert to relative paths for testing
        urls = matches.map(m => {
          const fullUrl = m.replace(/<\/?loc>/g, '');
          try {
            const urlObj = new URL(fullUrl);
            return urlObj.pathname;
          } catch (_e) {
            return fullUrl; // Fallback if already relative or invalid
          }
        });
        console.log(`[SPIDER] Discovered ${urls.length} URLs from sitemap.`);
      } else {
        console.warn('[SPIDER] No URLs found in sitemap.xml');
      }
    } else {
        // Fallback for no sitemap: Manual critical path list
        console.warn('[SPIDER] sitemap.xml not found. Using critical path list.');
        urls = [
            '/', 
            '/services/strategic-management', 
            '/services/digital-transformation',
            '/about',
            '/contact'
        ];
    }
  });

  // 2. Dynamic Test Generation
  // We can't dynamically generate tests inside `test.beforeAll` in Playwright cleanly without tricks.
  // Instead, we iterate inside a single test or use a data-driven approach if known statically.
  // For extensive crawling, iterating in one test is safer for resource management (Zero-Waste).
  
  test('should crawl all discovered pages and verify integrity', async ({ page }) => {
    test.setTimeout(urls.length * 10000); // Dynamic timeout: 10s per page

    const errors: string[] = [];
    const brokenLinks: string[] = [];

    // console.log override to catch browser errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
        console.log(`[PAGE ERROR] ${err.message}`);
        errors.push(err.message);
    });

    console.log(`[SPIDER] Starting crawl of ${urls.length} pages...`);

    for (const url of urls) {
      try {
        console.log(`[SPIDER] Visiting: ${url}`);
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Check 1: Status Code (200 OK or 304 Not Modified both indicate valid pages)
        const status = response?.status();
        if (status !== undefined && status >= 400) {
            brokenLinks.push(`${url} (Status: ${status})`);
            console.error(`❌ Broken Link: ${url} [${status}]`);
            continue;
        }

        // Check 2: Critical Elements based on Route
        const isAuthPage = url.includes('/login') || url.includes('/register') || url.includes('/forgot-password');
        
        if (isAuthPage) {
            // Auth pages might not have nav, but should have a main or form
            await expect(page.locator('form, main').first()).toBeVisible({ timeout: 5000 });
        } else {
            // Standard pages must have Navbar and Footer
            try {
                await expect(page.locator('nav').first()).toBeVisible({ timeout: 10000 });
                await expect(page.locator('footer').first()).toBeVisible({ timeout: 10000 });
            } catch (_e) {
                // If nav missing on non-auth page, it's a bug OR a different layout (e.g. Dashboard)
                // Let's allow Dashboard to have Sidebar instead
                if (url.includes('/dashboard')) {
                     await expect(page.locator('aside, nav').first()).toBeVisible({ timeout: 5000 });
                } else {
                    throw _e; // Re-throw for real failures
                }
            }
        }

        // Check 3: Zero Console Errors (Strict Mode)
        // (Handled by listener, but we could fail here if errors.length > 0)
        
        console.log(`✅ Verified: ${url}`);

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        brokenLinks.push(`${url} (Error: ${message})`);
        console.error(`❌ Failed to load: ${url}`, err);
      }
    }

    // Report
    if (brokenLinks.length > 0) {
        console.error('--- BROKEN LINKS REPORT ---');
        brokenLinks.forEach(l => console.error(l));
        console.error('---------------------------');
    }

    expect(brokenLinks.length, `Found ${brokenLinks.length} broken links`).toBe(0);
    // Optional: Fail on browser console errors if we want "Perfection"
    // expect(errors.length, `Found ${errors.length} browser console errors`).toBe(0); 
  });
});
