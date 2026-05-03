import { test, expect } from '@playwright/test';

test.describe('Minimalist Interactive Core', () => {
  
  test('Growth Calculator Interaction (Services Page)', async ({ page }) => {
    // 1. Navigate to Services Page
    await page.goto('/services');
    
    // 2. Locate Calculator & Scroll
    const revenueInput = page.locator('input[name="revenue"]');
    const teamSizeInput = page.locator('input[name="teamSize"]');
    
    // Scroll to the bottom where the calculator is
    await revenueInput.scrollIntoViewIfNeeded();
    await expect(revenueInput).toBeVisible();
    
    // 3. Initial State Check
    // Use regex to be safer against whitespace and formatting
    await expect(page.locator('text=$200,000')).toBeVisible({ timeout: 10000 });

    // 4. Interact with Sliders
    // Change Revenue to 2M
    await revenueInput.fill('2000000');
    // Change Team to 20
    await teamSizeInput.fill('20');
    
    // Allow state update
    await page.waitForTimeout(500);

    // 5. Verify New Projection
    await expect(page.locator('text=$400,000')).toBeVisible();
  });

  test('Booking Wizard Flow (Contact Page)', async ({ page }) => {
    test.setTimeout(90000);
    // Booking Wizard is in ServicesPage at #booking-wizard
    // Mock API to avoid proxy reliability issues
    await page.route('**/api/bookings', route =>
      route.fulfill({ status: 201, contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', id: 'booking-e2e-001' }) })
    );
    await page.goto('/services', { waitUntil: 'domcontentloaded', timeout: 50000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // Scroll to wizard
    const wizardContainer = page.locator('#booking-wizard');
    await wizardContainer.scrollIntoViewIfNeeded();
    await expect(wizardContainer).toBeVisible({ timeout: 5000 });

    // Fill Step 1 (react-hook-form fields)
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="company"]', 'Test Corp');
    
    await page.click('button:has-text("Next Step")');

    // Verify Step 2
    await expect(page.getByText('Primary Goal')).toBeVisible({ timeout: 5000 });
    
    // Select a goal and submit
    await page.locator('button:has-text("Strategy"), button:has-text("Strateji")').first().click();
    await page.click('button:has-text("Submit Request")');

    // Verify Success
    await expect(page.getByText('Request Received!')).toBeVisible({ timeout: 8000 });
  });

  test('Business Health Quiz Flow (Assessment Page)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/maturity-assessment');
    await page.waitForLoadState('networkidle');
    
    // Page title visible
    await expect(page.locator('h1').first()).toBeVisible();
    // First question visible (auto-advances on click, no 'Next Question' btn)
    await expect(page.getByText('How defined is your digital strategy?')).toBeVisible({ timeout: 5000 });

    // Quiz: click option to select, then click Continue/Analyze Results
    const answerQuestion = async (optionText: string, isLast = false) => {
      const opt = page.locator(`button:has-text("${optionText}")`);
      await opt.scrollIntoViewIfNeeded();
      await opt.waitFor({ state: 'visible', timeout: 10000 });
      await opt.click();
      await page.waitForTimeout(300);
      // Next button is 'Continue' (Q1-Q4) or 'Analyze Results' (Q5)
      const nextBtn = page.locator(isLast ? 'button:has-text("Analyze Results")' : 'button:has-text("Continue")');
      await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
      await nextBtn.click();
      await page.waitForTimeout(500);
    };

    await answerQuestion('Fully integrated and automated');
    await answerQuestion('Inbound Content Engine');
    await answerQuestion('Real-time Custom Dashboards');
    await answerQuestion('Product Innovation');
    await answerQuestion('Ready for hyper-growth', true);

    // Result page shows 'Assessment Result' (actual text in BusinessHealthQuiz.tsx)
    await expect(page.getByText('Assessment Result')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Optimization Phase')).toBeVisible({ timeout: 5000 });
  });

});
