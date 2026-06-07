/**
 * contactLegacySchema unit tests — Sprint 10 Phase 10C (P45a)
 *
 * Smoke-tests the re-export shim under the new canonical path. The
 * underlying schema (`src/schemas/contact.ts`) already has coverage via
 * existing form tests; this file only proves the new public path is
 * wired through and preserves KVKK explicit-consent + i18n key-path
 * conventions.
 */

import { describe, it, expect } from 'vitest';
import { contactLegacySchema, contactSchema } from '@/schemas/forms/contactLegacy';

describe('contactLegacySchema (re-export shim)', () => {
  it('is the same reference as the original contactSchema', () => {
    expect(contactLegacySchema).toBe(contactSchema);
  });

  it('accepts a valid payload', () => {
    const result = contactLegacySchema.safeParse({
      name: 'Emre Yalçın',
      email: 'emre@example.com',
      message: 'Strateji danışmanlığı için iletişim kurmak istiyorum.',
      kvkkConsent: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const result = contactLegacySchema.safeParse({
      name: 'E',
      email: 'emre@example.com',
      message: 'Yeterince uzun bir mesaj yazıyorum.',
      kvkkConsent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path.includes('name'));
      expect(nameIssue?.message).toBe('contact.form.name_min');
    }
  });

  it('rejects invalid email', () => {
    const result = contactLegacySchema.safeParse({
      name: 'Emre Yalçın',
      email: 'not-an-email',
      message: 'Yeterince uzun bir mesaj yazıyorum.',
      kvkkConsent: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects message shorter than 10 chars', () => {
    const result = contactLegacySchema.safeParse({
      name: 'Emre Yalçın',
      email: 'emre@example.com',
      message: 'kısa',
      kvkkConsent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgIssue = result.error.issues.find((i) => i.path.includes('message'));
      expect(msgIssue?.message).toBe('contact.form.message_min');
    }
  });

  it('rejects when kvkkConsent is false (KVKK md.5/2 refine)', () => {
    const result = contactLegacySchema.safeParse({
      name: 'Emre Yalçın',
      email: 'emre@example.com',
      message: 'Yeterince uzun bir mesaj yazıyorum.',
      kvkkConsent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const consentIssue = result.error.issues.find((i) => i.path.includes('kvkkConsent'));
      expect(consentIssue?.message).toBe('contact.form.kvkk_required');
    }
  });

  it('tolerates honeypot field as optional', () => {
    const result = contactLegacySchema.safeParse({
      name: 'Emre Yalçın',
      email: 'emre@example.com',
      message: 'Yeterince uzun bir mesaj yazıyorum.',
      kvkkConsent: true,
      hp_field: '',
    });
    expect(result.success).toBe(true);
  });
});
