/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test.describe('Real-Time Collaboration Features', () => {
  test('should display live activity updates', async ({ page }) => {
    // Enable Console Logging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    // 1. Inject auth before navigation
    await page.addInitScript(() => {
      window.localStorage.setItem('ecypro-app-storage', JSON.stringify({
        state: { user: { id: 'e2e-rt', name: 'E2E RT', email: 'rt@ecypro.com', role: 'admin' }, isAuthenticated: true },
        version: 0
      }));
    });
    await page.goto('/app');

    // 2. Wait for Dashboard Layout
    await expect(page.getByText('EcyPro').first()).toBeVisible({ timeout: 10000 });

    // 3. Verify Live Activity widget (LiveTeamActivity renders 'Live Activity')
    await expect(page.getByText('Live Activity').first()).toBeVisible({ timeout: 10000 });
  });
});
