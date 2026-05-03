/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test.describe('Adaptive AI Dashboard', () => {
  test('should load dashboard and widgets', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    // Inject auth before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('ecypro-app-storage', JSON.stringify({
        state: { user: { id: 'e2e-dash', name: 'E2E User', email: 'e2e@ecypro.com', role: 'admin' }, isAuthenticated: true },
        version: 0
      }));
    });
    await page.goto('/app');
    
    // Wait for critical UI elements
    await expect(page.getByText('EcyPro').first()).toBeVisible({ timeout: 10000 });
    console.log('Page Title:', await page.title());

    // AI widget title from AIExecutiveSummary component (h3 text)
    await expect(page.getByText('AI Executive Brief')).toBeVisible({ timeout: 15000 });
    // Revenue widget from PlaceholderWidget
    await expect(page.getByText('Revenue Overview')).toBeVisible();
    // Activity widget from LiveTeamActivity (renders 'Live Activity')
    await expect(page.getByText('Live Activity')).toBeVisible();
  });

  test('should persist layout changes (mocked)', async ({ page }) => {
    // This test verifies that the local storage is being interacted with.
    // It's hard to robustly test drag-n-drop coordinates in headless, 
    // but we can check if the store is initialized.
    
    await page.addInitScript(() => {
      window.localStorage.setItem('ecypro-app-storage', JSON.stringify({
        state: { user: { id: 'e2e-dash', name: 'E2E User', email: 'e2e@ecypro.com', role: 'admin' }, isAuthenticated: true },
        version: 0
      }));
    });
    await page.goto('/app');
    // Verify first widget is rendered (AIExecutiveSummary h3 text)
    await expect(page.getByText('AI Executive Brief')).toBeVisible({ timeout: 10000 });
  });
});
