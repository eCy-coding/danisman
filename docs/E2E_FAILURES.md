# E2E Test Failures - Quick Fix List

## Failed Tests (4/5 Failed)

### 1. lead-gen.spec.ts - Form Submit
**Error**: `strict mode violation: locator('button[type="submit"]') resolved to 2 elements`
- Issue: Multiple submit buttons on page (main form + newsletter subscription).
- Fix: Use more specific selector like `getByRole('button', { name: 'contact.form.submit' })` or `page.locator('form button[type="submit"]').first()`.

### 2. lead-gen.spec.ts - Form Validation
**Error**: `getByText('Name must be at least 2 characters') not found`
- Issue: Form error messages are not rendering or are in different language/format.
- Cause: Likely i18n translation key mismatch or form validation not triggering.
- Fix: Add explicit wait for validation message or check actual error text.

### 3. conversion-elements.spec.ts - Trust Marquee
**Error**: `getByText('Trusted by Industry Leaders') not found`
- Issue: Marquee component text is not visible or has different content.
- Fix: Inspect actual marquee text in component and update selector.

### 4. conversion-elements.spec.ts - Smart CTA
**Error**: Similar marquee/content visibility issue.
- Fix: Verify element exists before scrolling test.

## Passing Tests (1/5)
- diagnostic.spec.ts ✓ (basic page load test)

## Root Causes (Analysis)
1. **Selector brittleness**: Tests use generic selectors that break with UI changes.
2. **i18n**: Text-based assertions fail due to translations or missing keys.
3. **Component rendering**: Elements may not be hydrated or may be hidden by default.
4. **Timing issues**: Tests run too fast before content loads.

## Recommended Actions (Priority)

1. **Immediate** (est. 30 min):
   - Use `getByRole()` instead of text selectors in lead-gen.spec.ts.
   - Add `waitForTimeout(1000)` after page.goto() to allow hydration.
   - Check actual form error messages using browser DevTools.

2. **Short-term** (est. 60 min):
   - Replace all `.getByText()` with `.getByRole()` or `[data-testid]` in e2e tests.
   - Add `data-testid` attributes to components for e2e stability.
   - Mock i18n in tests to ensure consistent text.

3. **Medium-term** (est. 120 min):
   - Create reusable test helpers for common patterns (form submit, scroll, etc.).
   - Add fixture data for seeding CMS/DB before tests.
   - Implement visual regression testing (Percy/Applitools) to catch layout changes.

---
Generated: 2025-01-07
