import { describe, it, expect } from 'vitest';
import { newsletterSchema } from '../newsletter';

describe('newsletterSchema', () => {
  it('accepts valid email + consent=true', () => {
    const result = newsletterSchema.safeParse({ email: 'user@example.com', consent: true });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', () => {
    const result = newsletterSchema.safeParse({ email: 'not-an-email', consent: true });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('newsletter.form.invalid_email');
  });

  it('rejects empty email', () => {
    const result = newsletterSchema.safeParse({ email: '', consent: true });
    expect(result.success).toBe(false);
  });

  it('rejects consent=false (KVKK m.5 — explicit consent required)', () => {
    const result = newsletterSchema.safeParse({ email: 'user@example.com', consent: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('newsletter.form.consent_required');
  });

  it('rejects missing consent field', () => {
    const result = newsletterSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('accepts business email domains', () => {
    const result = newsletterSchema.safeParse({
      email: 'emre@ecypro.com',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects email with spaces', () => {
    const result = newsletterSchema.safeParse({ email: 'user @example.com', consent: true });
    expect(result.success).toBe(false);
  });
});
