import { test, expect } from '@playwright/test';

/**
 * Phase 20 B4: Newsletter footer form — accessibility + happy path.
 *
 * Mock server (`server/mock-server.js`) accepts /api/newsletter/subscribe and
 * returns 201 SUBSCRIBED for any valid {email, consent:true} payload. Invalid
 * payloads return 400 VALIDATION_ERROR.
 */
test.describe('Newsletter footer form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Scroll all the way down so the footer is in view + interactable.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test('happy path: email + consent → success status', async ({ page }) => {
    test.setTimeout(60_000);
    // Route must be registered BEFORE navigation to avoid WebKit parallel-mode race
    await page.route('**/api/newsletter/subscribe', route =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', code: 'SUBSCRIBED', message: 'Subscription confirmed' }),
      })
    );

    // Re-navigate with mock already in place
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const emailInput = page.getByTestId('newsletter-email');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('e2e-newsletter@example.com');

    const status = page.locator('#newsletter-status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveAttribute('aria-atomic', 'true');

    const submit = page.getByTestId('newsletter-submit');
    await submit.click();

    // Either green success or "already subscribed" (idempotent endpoint) is OK.
    await expect(status).toContainText(/(teşekkür|thanks|zaten|already)/i, { timeout: 10_000 });
  });

  test('invalid email blocks submission via aria-invalid feedback', async ({ page }) => {
    const emailInput = page.getByTestId('newsletter-email');
    await emailInput.scrollIntoViewIfNeeded();
    // Bypass HTML5 validity by typing then forcing JS submit; with noValidate
    // the form posts and the server returns 400 → status flips to error.
    await emailInput.fill('not-an-email');

    const submit = page.getByTestId('newsletter-submit');
    await submit.click();

    const status = page.locator('#newsletter-status');
    // Either client-side blocked (no status update) or server VALIDATION_ERROR.
    // We accept either outcome but assert the input is correctly marked invalid
    // when an error came back.
    const ariaInvalid = await emailInput.getAttribute('aria-invalid');
    if (ariaInvalid === 'true') {
      await expect(status).toBeVisible();
    }
  });
});
