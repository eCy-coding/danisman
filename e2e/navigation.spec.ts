 
import { test, expect } from '@playwright/test';

test('navigation flow', async ({ page }) => {
  // Go to Landing Page
  await page.goto('/');
  await expect(page).toHaveTitle(/EcyPro/);
  
  // Check for main elements
  // Based on Hero.tsx content
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  // Check specifically for the navbar logo to confirm layout
  await expect(page.locator('nav').locator('text=EcyPro').first()).toBeVisible();

  // Navigate to Dashboard (assuming there is a link or we go directly for now)
  // Since we haven't linked the "Get Started" button to /app yet, let's go directly.
  // Navigate to Dashboard with Auth Injection
  await page.addInitScript(() => {
    window.localStorage.setItem('ecypro-app-storage', JSON.stringify({
        state: {
            user: {
                id: 'e2e-admin',
                name: 'E2E Admin',
                email: 'test@ecypro.com',
                role: 'admin'
            },
            isAuthenticated: true
        },
        version: 0
    }));
  });
  
  await page.goto('/app');
  
  // Verify Dashboard Layout — sidebar labels are English
  await expect(page.locator('text=Overview').first()).toBeVisible();
  await expect(page.locator('text=Consulting Module').first()).toBeVisible();
  
  // Navigate to Consulting Module
  await page.locator('text=Consulting Module').first().click();
  // Verify page navigated (URL changes)
  await expect(page).toHaveURL(/.*consulting/);
});
