/* eslint-disable no-console */

import { test } from '@playwright/test';

test('Diagnose Runtime Error', async ({ page }) => {
  // 1. Capture Console Logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`BROWSER_${msg.type().toUpperCase()}:`, msg.text()); 
    }
  });

  // 2. Capture Uncaught Exceptions
  page.on('pageerror', exception => {
    console.log(`BROWSER_UNCAUGHT_EXCEPTION: "${exception}"`);
  });

  // 3. Visit Base URL
  console.log('Navigating to http://localhost:4173...');
  try {
    await page.goto('http://localhost:4173', { timeout: 10000 });
  } catch (e) {
    console.log('Navigation failed:', e);
  }

  // 4. Check for "Something went wrong" text
  const errorText = await page.getByText('Something went wrong').isVisible().catch(() => false);
  if (errorText) {
    console.log('CRITICAL: "Something went wrong" error boundary is VISIBLE.');
  } else {
    console.log('INFO: Error boundary text NOT found.');
  }
  
  // 5. Take Screenshot
  await page.screenshot({ path: 'diagnostic-screenshot.png', fullPage: true });
});
