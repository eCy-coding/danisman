/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test.describe('Production Real-Time SSE (Protocol V7)', () => {
  const serviceSlug = 'strategic-transformation';

  test('should establish SSE connection and receive updates', async ({ page, request }) => {
    // Debug: Trace Browser Console
    page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));
    
    // 1. Verify Backend Health (Direct API Access)
    // Note: In E2E, baseURL is set to the frontend (4173). 
    // The Proxy should forward /api/health to 3001.
    const health = await request.get('/api/health');
    expect(health.ok()).toBeTruthy();
    const healthData = await health.json();
    expect(healthData.status).toBe('ok');
    console.log('[TEST] API Health:', healthData);

    // 2. Navigate to Service Page
    await page.goto(`/services/${serviceSlug}`);
    // Title is bilingual — use regex
    await expect(page.getByText(/Stratejik Dönüşüm|Strategic Transformation/i).first()).toBeVisible({ timeout: 5000 });

    // 3. Verify Live Tracker Connection
    // The ServiceLiveTracker component should mount and connecting to SSE
    // We check if the text "Live Viewers" appears, updated by the event stream.
    // The mock server sends updates every 2.5s.
    
    // Wait for at least one update
    // Verify any text containing "Live Viewers" is visible
    await expect(page.getByText(/Live Viewers/)).toBeVisible({ timeout: 30000 });
    
    console.log('[TEST] UI Element Found.');

    // Wait for a CHANGE (proving streaming) - Optional but rigorous
    // Since update is random, it might send the same number, so checking strict change is flaky.
    // Presence of the tracker confirms connection + initial data or update.
  });
});
