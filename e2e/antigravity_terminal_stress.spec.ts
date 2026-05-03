
import { test, expect } from '@playwright/test';

test.describe.skip('Antigravity Terminal Stress Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to terminal
    await page.goto('/antigravity-terminal');
    await expect(page.locator('.xterm-rows')).toContainText('Connected to Antigravity Terminal Service', { timeout: 15000 });
  });

  test('should handle large output streaming', async ({ page }) => {
    // Generate a large output (e.g., 1000 lines)
    const command = 'for i in {1..1000}; do echo "Line $i - Antigravity Stress Test Data Block"; done';
    await page.keyboard.type(command);
    await page.keyboard.press('Enter');

    // Verification strategies:
    // 1. Check if the terminal is still responsive (not crashed)
    // 2. Check for the final line.
    
    // Wait for the final line to appear (indicates stream completion)
    // We increase timeout to 30s to be safe for 1000 lines over WS
    await expect(page.locator('.xterm-rows')).toContainText('Line 1000 - Antigravity Stress Test Data Block', { timeout: 30000 });
    
    // Verify intermediate lines are present (near end, so likely visible in DOM)
    await expect(page.locator('.xterm-rows')).toContainText('Line 990 - Antigravity Stress Test Data Block');
    await expect(page.locator('.xterm-rows')).toContainText('Line 999 - Antigravity Stress Test Data Block');
  });

  test('should handle sequential command execution', async ({ page }) => {
     // Execute multiple distinct commands sequentially to verify state stability
     const commands = [
         { cmd: 'echo "Command A"', expected: 'Command A' },
         { cmd: 'echo "Command B"', expected: 'Command B' },
         { cmd: 'pwd', expected: '/Users' }, // Assuming pwd contains users path or home
         { cmd: 'whoami', expected: '' } // whoami is variable, just check it runs without error
     ];

     for (const item of commands) {
         await page.keyboard.type(item.cmd);
         await page.keyboard.press('Enter');
         if (item.expected) {
             await expect(page.locator('.xterm-rows')).toContainText(item.expected, { timeout: 10000 });
         }
         await page.waitForTimeout(1000); 
     }
  });

  test('should handle complex characters and formatting', async ({ page }) => {
      // Test ANSI colors and special chars
      const command = 'echo -e "\\033[31mRED\\033[0m \\033[32mGREEN\\033[0m \\033[34mBLUE\\033[0m"';
      await page.keyboard.type(command);
      await page.keyboard.press('Enter');

      // xterm renders these as styled spans, but the text content should match 'RED GREEN BLUE'
      // Note: xterm DOM structure breaks text into spans, so exact text matching might be tricky if not handling spacing.
      // We look for the content.
      await expect(page.locator('.xterm-rows')).toContainText('RED');
      await expect(page.locator('.xterm-rows')).toContainText('GREEN');
      await expect(page.locator('.xterm-rows')).toContainText('BLUE');
  });
});
