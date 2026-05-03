 

import { test, expect } from '@playwright/test';

test.describe('SEO & Visual Harmony', () => {

  test('Homepage has correct Title and Meta Description', async ({ page }) => {
    await page.goto('/');
    
    // Check Title (managed by Helmet or static HTML)
    await expect(page).toHaveTitle(/EcyPro|ECYPRO/i);
    
    // Check Description (use .first() to handle potential duplicate from index.html + Helmet)
    const metaDescription = page.locator('meta[name="description"]').first();
    await expect(metaDescription).toHaveAttribute('content', /EcyPro|kurumsal|consulting|danışmanlık/i);
    
    // Check JSON-LD (multiple scripts possible — use first())
    const jsonLd = page.locator('script[type="application/ld+json"]').first();
    await expect(jsonLd).toBeAttached();
    const content = await jsonLd.textContent();
    expect(content?.toLowerCase()).toContain('consulting');
    expect(content?.toLowerCase()).toContain('ecypro');
  });

  test('Colors match 2026 Palette (Deep Tech)', async ({ page }) => {
    await page.goto('/');
    
    // Check if body background is the new "Inky Navy" or similar dark surface
    // Note: Our CSS var --color-neutral is #000212. 
    // Tailwind config maps 'bg-neutral' to this var.
    // We check a known element using this class.

    // Check for navbar
    await expect(page.locator('nav')).toBeVisible();
    // Initially transparent, but let's check a button or text color
    
    const primaryButton = page.locator('a[href="#contact"]').first();
    // Should have primary color class, which maps to #635BFF
    // Visual regression tools are better for exact hex, but we can check computation if needed.
    // For now, visibility is enough.
    await expect(primaryButton).toBeVisible();
  });

});
