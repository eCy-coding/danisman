/**
 * P16 BE Track 2 / Aşama 3 — audit cursor + filter parser tests.
 */

import { describe, expect, it } from 'vitest';
import {
  encodeAuditCursor,
  decodeAuditCursor,
  parseAuditFilters,
  clampAuditLimit,
} from './audit-cursor';

describe('encodeAuditCursor / decodeAuditCursor', () => {
  it('round-trips a valid cursor', () => {
    const c = { createdAt: '2026-05-16T12:34:56.000Z', id: 'a1b2c3d4-uuid' };
    const encoded = encodeAuditCursor(c);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('=');
    const decoded = decodeAuditCursor(encoded);
    expect(decoded).toEqual(c);
  });

  it('returns null for an empty string', () => {
    expect(decodeAuditCursor('')).toBeNull();
  });

  it('returns null for non-base64 garbage', () => {
    expect(decodeAuditCursor('!!!not-base64!!!')).toBeNull();
  });

  it('returns null when the decoded payload has no separator', () => {
    const broken = Buffer.from('no-separator-here', 'utf8').toString('base64url');
    expect(decodeAuditCursor(broken)).toBeNull();
  });

  it('returns null when createdAt is not parseable as a date', () => {
    const broken = Buffer.from('not-a-date|some-id', 'utf8').toString('base64url');
    expect(decodeAuditCursor(broken)).toBeNull();
  });

  it('preserves IDs that contain a "|" character (uses first separator only)', () => {
    const c = { createdAt: '2026-05-16T00:00:00.000Z', id: 'weird|id-shape' };
    const encoded = encodeAuditCursor(c);
    expect(decodeAuditCursor(encoded)).toEqual(c);
  });
});

describe('parseAuditFilters', () => {
  it('returns empty filters for empty input', () => {
    const r = parseAuditFilters({});
    expect(r.error).toBeUndefined();
    expect(r.filters).toEqual({});
  });

  it('trims and applies adminId / action / targetType / targetId', () => {
    const r = parseAuditFilters({
      adminId: '  admin-1  ',
      action: 'USER_ROLE_CHANGE',
      targetType: 'User',
      targetId: 'u-42',
    });
    expect(r.error).toBeUndefined();
    expect(r.filters).toEqual({
      adminId: 'admin-1',
      action: 'USER_ROLE_CHANGE',
      targetType: 'User',
      targetId: 'u-42',
    });
  });

  it('skips empty / whitespace-only fields', () => {
    const r = parseAuditFilters({ adminId: '   ', action: '' });
    expect(r.filters).toEqual({});
  });

  it('parses startDate / endDate into createdAt range', () => {
    const r = parseAuditFilters({
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-15T23:59:59.000Z',
    });
    expect(r.error).toBeUndefined();
    expect(r.filters.createdAt?.gte).toBeInstanceOf(Date);
    expect(r.filters.createdAt?.lte).toBeInstanceOf(Date);
    expect(r.filters.createdAt!.gte!.toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });

  it('rejects startDate > endDate with INVALID_DATE_RANGE', () => {
    const r = parseAuditFilters({
      startDate: '2026-05-15T00:00:00.000Z',
      endDate: '2026-05-01T00:00:00.000Z',
    });
    expect(r.error?.code).toBe('INVALID_DATE_RANGE');
  });

  it('rejects garbage startDate with INVALID_DATE_RANGE', () => {
    const r = parseAuditFilters({ startDate: 'not-a-date' });
    expect(r.error?.code).toBe('INVALID_DATE_RANGE');
  });

  it('ignores non-string filter values (e.g. arrays)', () => {
    const r = parseAuditFilters({ adminId: ['a', 'b'], action: 42 });
    expect(r.error).toBeUndefined();
    expect(r.filters).toEqual({});
  });
});

describe('clampAuditLimit', () => {
  it('returns the default when limit is missing', () => {
    expect(clampAuditLimit(undefined)).toBe(50);
  });

  it('clamps to the maximum (200)', () => {
    expect(clampAuditLimit('500')).toBe(200);
  });

  it('clamps to the minimum (1)', () => {
    expect(clampAuditLimit('-7')).toBe(1);
    expect(clampAuditLimit('0')).toBe(1);
  });

  it('accepts a valid mid-range value', () => {
    expect(clampAuditLimit('25')).toBe(25);
  });

  it('falls back to default for non-numeric input', () => {
    expect(clampAuditLimit('not-a-number')).toBe(50);
  });
});
