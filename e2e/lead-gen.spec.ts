import { test, expect } from '@playwright/test';

test.describe('Lead Generation Flow', () => {
  test('User can submit contact form successfully', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // ContactForm scoped via data-testid (avoids strict-mode collision with newsletter form in footer).
    const form = page.getByTestId('contact-form');
    await expect(form).toBeVisible();

    await form.getByTestId('contact-name').fill('QA Test User');
    await form.getByTestId('contact-email').fill('qa@test.com');
    await form
      .getByTestId('contact-message')
      .fill('This is an automated E2E test message for validation.');

    const submitBtn = form.getByTestId('contact-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success banner is now identified by its stable data-testid rather than
    // a translated string — avoids breakage when i18n keys land or change.
    await expect(page.getByTestId('contact-success')).toBeVisible({ timeout: 10000 });
  });

  test('Form shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const form = page.getByTestId('contact-form');
    await form.getByTestId('contact-submit').click();

    // Scope assertions to the form to avoid label collision. Zod messages pass
    // through i18next; partial substrings are unique to the error path only.
    await expect(form.getByText(/must be at least 2 characters/i)).toBeVisible({ timeout: 5000 });
    await expect(form.getByText(/valid email address/i)).toBeVisible({ timeout: 5000 });
    await expect(form.getByText(/must be at least 10 characters/i)).toBeVisible({ timeout: 5000 });
  });
});
