/**
 * P16 — Zod error map i18n regression
 *
 * Validates that `installZodI18n()` wires `z.config({ customError })` such that
 * issues without a schema-level message fall back to the active i18next
 * language. We exercise TR and EN against a small schema covering the most
 * common issue codes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import i18n from '../lib/i18n-react';
import { installZodI18n } from '../lib/forms/zod-error-map';

// Inject the namespace synchronously so tests don't depend on the HTTP backend.
function preload() {
  i18n.addResourceBundle('tr', 'forms', {
    errors: {
      required: 'Bu alan zorunludur.',
      invalid_type: 'Geçersiz değer.',
      invalid_email: 'Geçerli bir e-posta adresi girin.',
      too_small_string: 'En az {{minimum}} karakter girin.',
      too_small_string_one: 'En az 1 karakter girin.',
      too_big_string: 'En fazla {{maximum}} karakter girin.',
      too_small_number: 'En az {{minimum}} olmalıdır.',
      custom: 'Geçersiz değer.',
    },
  });
  i18n.addResourceBundle('en', 'forms', {
    errors: {
      required: 'This field is required.',
      invalid_type: 'Invalid value.',
      invalid_email: 'Enter a valid email address.',
      too_small_string: 'Enter at least {{minimum}} characters.',
      too_small_string_one: 'Enter at least 1 character.',
      too_big_string: 'Enter at most {{maximum}} characters.',
      too_small_number: 'Must be at least {{minimum}}.',
      custom: 'Invalid value.',
    },
  });
}

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  message: z.string().min(10).max(500),
  count: z.number().min(1),
});

describe('zod-error-map (P16)', () => {
  beforeAll(async () => {
    preload();
    installZodI18n();
  });

  it('returns Turkish messages when language is tr', async () => {
    await i18n.changeLanguage('tr');
    const res = schema.safeParse({ name: 'a', email: 'oops', message: 'hi', count: 0 });
    expect(res.success).toBe(false);
    if (res.success) return;
    const msgs = res.error.issues.map((i) => i.message);
    expect(msgs).toEqual(
      expect.arrayContaining([
        'En az 2 karakter girin.',
        'Geçerli bir e-posta adresi girin.',
        'En az 10 karakter girin.',
        'En az 1 olmalıdır.',
      ]),
    );
  });

  it('returns English messages when language is en', async () => {
    await i18n.changeLanguage('en');
    const res = schema.safeParse({ name: 'a', email: 'oops', message: 'hi', count: 0 });
    expect(res.success).toBe(false);
    if (res.success) return;
    const msgs = res.error.issues.map((i) => i.message);
    expect(msgs).toEqual(
      expect.arrayContaining([
        'Enter at least 2 characters.',
        'Enter a valid email address.',
        'Enter at least 10 characters.',
        'Must be at least 1.',
      ]),
    );
  });

  it('honors schema-level overrides (key path passthrough)', async () => {
    await i18n.changeLanguage('en');
    const custom = z.string().min(3, { message: 'contact.form.name_min' });
    const res = custom.safeParse('a');
    expect(res.success).toBe(false);
    if (res.success) return;
    // Schema-level message wins; it's an i18n key path the UI resolves.
    expect(res.error.issues[0]?.message).toBe('contact.form.name_min');
  });
});
