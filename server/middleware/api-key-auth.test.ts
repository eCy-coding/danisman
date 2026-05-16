/**
 * P17 BE Track 2 / Aşama 4 — API key auth pure helpers.
 *
 * The middleware itself is express-coupled and exercised via integration
 * tests with a mocked Prisma. Here we pin the standalone helpers:
 *   - hashApiKey: deterministic + length matches sha256-hex.
 *   - safeEqual: constant-time string equality.
 *   - invalidateCachedKey: clears LRU entry.
 */

import { describe, expect, it } from 'vitest';
import { hashApiKey, safeEqual, invalidateCachedKey, _testing } from './api-key-auth';

describe('hashApiKey', () => {
  it('produces a 64-char hex string', () => {
    const out = hashApiKey('ecy_test_key_value');
    expect(out).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic across calls', () => {
    expect(hashApiKey('same-input')).toBe(hashApiKey('same-input'));
  });

  it('differs across inputs', () => {
    expect(hashApiKey('a')).not.toBe(hashApiKey('b'));
  });
});

describe('safeEqual', () => {
  it('returns true on equal strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false on different strings', () => {
    expect(safeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false on different lengths (no buffer overrun)', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('invalidateCachedKey', () => {
  it('removes the entry from the auth cache', () => {
    _testing.cache.set('hashed-x', {
      id: 'k1',
      name: 'test',
      scopes: ['read:bookings'],
      userId: null,
      expiresAt: null,
    }, 60_000);
    expect(_testing.cache.get('hashed-x')).toBeTruthy();
    invalidateCachedKey('hashed-x');
    expect(_testing.cache.get('hashed-x')).toBeUndefined();
  });
});
