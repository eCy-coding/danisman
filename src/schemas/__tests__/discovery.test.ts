import { describe, it, expect } from 'vitest';
import { discoverySchema, discoveryPageSchema } from '../discovery';

// ── discoverySchema (/discovery form) ────────────────────────────────────────

describe('discoverySchema', () => {
  const valid = {
    name: 'Emre Yalçın',
    email: 'emre@ecypro.com',
    company: 'eCyPro',
    kvkkConsent: true,
  };

  it('accepts minimal valid payload', () => {
    expect(discoverySchema.safeParse(valid).success).toBe(true);
  });

  it('accepts full optional fields', () => {
    const result = discoverySchema.safeParse({
      ...valid,
      sector: 'Finans',
      headcount: '51–250',
      description: 'Stratejik dönüşüm ihtiyacımız var.',
      hp_field: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const result = discoverySchema.safeParse({ ...valid, name: 'E' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.name_min');
  });

  it('rejects invalid email', () => {
    const result = discoverySchema.safeParse({ ...valid, email: 'not-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.invalid_email');
  });

  it('rejects empty company', () => {
    const result = discoverySchema.safeParse({ ...valid, company: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.company_required');
  });

  it('rejects kvkkConsent=false (KVKK m.5 — explicit consent required)', () => {
    const result = discoverySchema.safeParse({ ...valid, kvkkConsent: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.kvkk_required');
  });

  it('rejects description longer than 1000 chars', () => {
    const result = discoverySchema.safeParse({
      ...valid,
      description: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.description_max');
  });
});

// ── discoveryPageSchema (/discovery-page form) ────────────────────────────────

describe('discoveryPageSchema', () => {
  const valid = {
    name: 'Emre Yalçın',
    email: 'emre@ecypro.com',
    company: 'eCyPro',
    kvkkConsent: true,
  };

  it('accepts minimal valid payload', () => {
    expect(discoveryPageSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults services to empty array when omitted', () => {
    const result = discoveryPageSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.services).toEqual([]);
  });

  it('accepts services array with valid service keys', () => {
    const result = discoveryPageSchema.safeParse({
      ...valid,
      services: ['ma', 'esg', 'digital'],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.services).toEqual(['ma', 'esg', 'digital']);
  });

  it('rejects kvkkConsent=false', () => {
    const result = discoveryPageSchema.safeParse({ ...valid, kvkkConsent: false });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.kvkk_required');
  });

  it('rejects name shorter than 2 chars', () => {
    const result = discoveryPageSchema.safeParse({ ...valid, name: 'X' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('discovery.form.name_min');
  });

  it('rejects invalid email format', () => {
    const result = discoveryPageSchema.safeParse({ ...valid, email: 'bad' });
    expect(result.success).toBe(false);
  });
});
