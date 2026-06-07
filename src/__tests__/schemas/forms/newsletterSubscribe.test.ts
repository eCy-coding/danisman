/**
 * newsletterSubscribeSchema unit tests — Sprint 10 Phase 10C (P45a)
 *
 * Covers:
 *   - happy path with all required fields
 *   - invalid / missing email
 *   - consent must be explicitly true (KVKK md.5/2(a))
 *   - optional fields (source, locale, hp_field)
 *   - source length guard
 */

import { describe, it, expect } from 'vitest';
import { newsletterSubscribeSchema } from '@/schemas/forms/newsletterSubscribe';

describe('newsletterSubscribeSchema', () => {
  it('accepts a valid payload with required fields only', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'kurumsal@email.com',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional source + locale + honeypot', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'work@email.com',
      consent: true,
      source: 'newsletter-section',
      locale: 'tr',
      hp_field: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email format', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'not-an-email',
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailIssue?.message).toBe('newsletter.form.invalid_email');
    }
  });

  it('rejects empty email with required-message key', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: '',
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailIssue?.message).toBe('newsletter.form.email_required');
    }
  });

  it('rejects when consent is false (KVKK explicit-consent refine)', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'valid@example.com',
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const consentIssue = result.error.issues.find((i) => i.path.includes('consent'));
      expect(consentIssue?.message).toBe('newsletter.form.consent_required');
    }
  });

  it('rejects source string longer than 64 chars', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'valid@example.com',
      consent: true,
      source: 'x'.repeat(65),
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown locale value', () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: 'valid@example.com',
      consent: true,
      locale: 'de' as unknown as 'tr' | 'en',
    });
    expect(result.success).toBe(false);
  });
});
