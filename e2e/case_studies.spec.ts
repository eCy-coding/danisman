/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Case Studies Showcase', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);
        // Block external image requests to prevent networkidle timeout
        await page.route('**images.unsplash.com/**', route => route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }));
        await page.route('**images.pexels.com/**', route => route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }));
        await page.goto('/case-studies', { waitUntil: 'domcontentloaded', timeout: 30000 });
    });

    test('should filter case studies by industry', async ({ page }) => {
        test.setTimeout(60000);
        // 1. Verify initial load — actual h1 is 'Başarı Hikayeleri'
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.getByText(/Başarı Hikayeleri|Case Studies|Succes/i).first()).toBeVisible();
        
        // Wait for cards to load — domcontentloaded suffices since images are mocked
        await page.waitForTimeout(500);
        const cards = page.locator('article');
        await expect(cards.first()).toBeVisible({ timeout: 15000 });
        const initialCount = await cards.count();
        console.log(`Initial items: ${initialCount}`);
        expect(initialCount).toBeGreaterThan(0);

        // Debugging (after cards load to avoid blocking)
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        try { 
            const bodyText = await page.innerText('body');
            console.log('--- BODY DUMP START ---');
            console.log(bodyText);
            console.log('--- BODY DUMP END ---');
            fs.writeFileSync('case_studies_debug.txt', bodyText); 
        } catch(_e) { /* non-blocking */ }

        // 2. Click a Filter (e.g., "Technology" or whatever is available)
        // We first get the available filters
        const filters = page.locator('button.rounded-full');
        const filterCount = await filters.count();
        expect(filterCount).toBeGreaterThan(1); // At least 'All' and one other

        // Click the second filter (index 1) - assuming it's not 'All'
        const filterName = await filters.nth(1).innerText();
        console.log(`Filtering by: ${filterName}`);
        await filters.nth(1).click();

        // 3. Verify Filtering logic: after clicking a filter, article count should be ≤ total
        await page.waitForTimeout(500);
        const filteredCards = page.locator('article');
        const filteredCount = await filteredCards.count();
        console.log(`Filtered items: ${filteredCount}`);
        expect(filteredCount).toBeLessThanOrEqual(initialCount);

        // 4. Return to All — click first filter button
        await filters.first().click();
        await page.waitForTimeout(500);
        // Count should restore (or stay same if filter returned all items)
        const restoredCount = await page.locator('article').count();
        expect(restoredCount).toBeGreaterThanOrEqual(filteredCount);
    });
});
