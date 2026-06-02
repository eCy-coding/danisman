import { describe, it, expect } from 'vitest';
import { dsarSchema } from '../dsar';

describe('dsarSchema', () => {
  const validExport = { email: 'user@example.com', kind: 'export' as const };
  const validDelete = { email: 'user@example.com', kind: 'delete' as const };

  it('accepts valid export request', () => {
    expect(dsarSchema.safeParse(validExport).success).toBe(true);
  });

  it('accepts valid delete request', () => {
    expect(dsarSchema.safeParse(validDelete).success).toBe(true);
  });

  it('accepts optional reason and hp_field', () => {
    const result = dsarSchema.safeParse({
      ...validExport,
      reason: 'KVKK Madde 11 kapsamında veri talep ediyorum.',
      hp_field: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email (KVKK m.4 — identity must be verifiable)', () => {
    const result = dsarSchema.safeParse({ email: 'not-an-email', kind: 'export' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('dsar.form.invalid_email');
  });

  it('rejects missing email', () => {
    const result = dsarSchema.safeParse({ kind: 'export' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown kind value', () => {
    const result = dsarSchema.safeParse({ email: 'user@example.com', kind: 'view' });
    expect(result.success).toBe(false);
  });

  it('rejects reason longer than 2000 chars', () => {
    const result = dsarSchema.safeParse({
      ...validExport,
      reason: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('dsar.form.reason_max');
  });

  it('accepts reason at exactly 2000 chars (boundary)', () => {
    const result = dsarSchema.safeParse({
      ...validExport,
      reason: 'x'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('kind defaults are separate — export is export', () => {
    const exportResult = dsarSchema.safeParse(validExport);
    const deleteResult = dsarSchema.safeParse(validDelete);
    expect(exportResult.success && exportResult.data.kind).toBe('export');
    expect(deleteResult.success && deleteResult.data.kind).toBe('delete');
  });
});
