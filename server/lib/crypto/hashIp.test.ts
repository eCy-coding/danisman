/**
 * Unit tests for canonical IP pseudonymization helper.
 *
 * No `vi.mock` — Node.js `crypto` is stdlib and deterministic, so we
 * assert against precomputed digests.
 *
 * Vault citation: [Architect] co-located vitest, [Standards Lead]
 * ≥70% statement coverage on utils (WEB_STANDARDS §7).
 */
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

import { hashIp } from './hashIp';

const sha256_32 = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 32);

describe('hashIp', () => {
  it('returns null for undefined', () => {
    expect(hashIp(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(hashIp(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(hashIp('')).toBeNull();
  });

  it('hashes a typical IPv4', () => {
    const ip = '203.0.113.42';
    expect(hashIp(ip)).toBe(sha256_32(ip));
    expect(hashIp(ip)).toHaveLength(32);
    expect(hashIp(ip)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('hashes a typical IPv6', () => {
    const ip = '2001:db8::1';
    expect(hashIp(ip)).toBe(sha256_32(ip));
    expect(hashIp(ip)).toHaveLength(32);
  });

  it('hashes an IP with port', () => {
    const ip = '203.0.113.42:54321';
    expect(hashIp(ip)).toBe(sha256_32(ip));
    expect(hashIp(ip)).toHaveLength(32);
  });

  it('is deterministic — same input yields same output', () => {
    const ip = '198.51.100.7';
    expect(hashIp(ip)).toBe(hashIp(ip));
  });

  it('different inputs yield different outputs', () => {
    expect(hashIp('198.51.100.7')).not.toBe(hashIp('198.51.100.8'));
  });

  it('handles very long input without throwing', () => {
    const ip = '1.2.3.4'.repeat(500); // ~3500 chars
    expect(() => hashIp(ip)).not.toThrow();
    expect(hashIp(ip)).toHaveLength(32);
  });

  it('hex output uses 0-9 a-f only (lowercase)', () => {
    expect(hashIp('10.0.0.1')).toMatch(/^[0-9a-f]+$/);
  });
});
