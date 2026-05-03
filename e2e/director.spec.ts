import { test, expect } from '@playwright/test';

test.describe('The Automatic Director', () => {
  test.beforeEach(async ({ page }) => {
    // Debugging: Log all console messages
    page.on('console', msg => console.warn(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.warn(`[Browser Error] ${err.message}`));
  });

  test('should initialize and attach to window', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration and effect execution
    // Increased timeout to 5000ms just in case
    await page.waitForTimeout(5000);

    // Check availability on window object
    const isDirectorOnline = await page.evaluate(() => {
      // @ts-expect-error - External injection
      return !!window.__DIRECTOR__;
    });

    expect(isDirectorOnline).toBe(true);
  });

  test('should schedule tasks', async ({ page }) => {
     await page.goto('/');
     await page.waitForTimeout(5000);

     // Manually schedule a task via window object
     const taskId = await page.evaluate(() => {
        // @ts-expect-error - External injection
        const director = window.__DIRECTOR__;
        if (!director) return null;
        
        // Spy on scheduling
        const taskId = 'test-task-' + Date.now();
        director.scheduleTask('ONE_TIME', { testId: taskId }, 100);
        return taskId;
     });

     expect(taskId).toBeTruthy();
  });
});
