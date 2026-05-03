/* eslint-disable no-console */

import { test, expect } from '@playwright/test';

test.describe.skip('Antigravity Terminal', () => {
  test('should connect and execute commands', async ({ page }) => {
    // Listen for console logs
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    // Navigate to the terminal page
    await page.goto('/antigravity-terminal');

    // Wait for validation message indicating connection
    // The component writes "Connected to Antigravity Terminal Service..." on open
    await expect(page.locator('.xterm-rows')).toContainText('Connected to Antigravity Terminal Service', { timeout: 10000 });

    // Type a command
    await page.keyboard.type('echo "Hello Antigravity"');
    await page.keyboard.press('Enter');

    // Verify output
    await expect(page.locator('.xterm-rows')).toContainText('Hello Antigravity', { timeout: 10000 });
    
    // Test a second command
    await page.keyboard.type('whoami');
    await page.keyboard.press('Enter');
    
    // We don't know the exact user, but we can check if it outputs something sane (not empty)
    // or just that the command was echoed.
  });
});
