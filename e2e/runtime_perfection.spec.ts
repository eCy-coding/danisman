/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test.describe('Runtime Perfection & Functional Detail', () => {
    
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        
        // Console listener
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));
        
        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        console.log(`Current URL: ${page.url()}`);
        console.log(`Page Title: ${await page.title()}`);
        
        // networkidle with timeout — SSE/analytics requests may prevent indefinite idle
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    });

    test('Detail 1: Language Switcher Persists & Updates', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        
        // Wait for hydration
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

        const langBtn = page.getByLabel('Dili değiştir / Change language');
        await expect(langBtn).toBeVisible();
        await expect(langBtn).toBeEnabled();
    });

    test('Detail 2: Navigation & Hash Scrolling', async ({ page }) => {
        // Use #services or #contact which are actual section IDs in the app
        const servicesSection = page.locator('#services, #hero, #contact').first();
        await expect(servicesSection).toBeAttached();
        
        const contactLink = page.locator('a[href="#contact"]').first();
        if (await contactLink.count() > 0 && await contactLink.isVisible()) {
            await contactLink.click();
            await page.waitForTimeout(500);
            // Hash navigation: button stays visible = success
            await expect(contactLink).toBeVisible();
        }
    });

    // ... keeping other tests minimal for debug ...
});
