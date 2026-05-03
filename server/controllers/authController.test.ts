/**
 * Phase 20 C3: defensive verifyPassword unit tests.
 *
 * These regressions ensure malformed/legacy hashes return `false` instead of
 * throwing — preserving the constant-time login envelope (always 401, never 500).
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './authController';

describe('verifyPassword (Phase 20 C3)', () => {
  it('returns true for a freshly hashed correct password (round-trip)', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('returns false for a wrong password against a valid hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('returns false (not throw) for legacy 2-part hash format', async () => {
    const malformed = 'abc:def'; // pre-Phase 18 format
    await expect(verifyPassword('anything', malformed)).resolves.toBe(false);
  });

  it('returns false for empty string', async () => {
    await expect(verifyPassword('any', '')).resolves.toBe(false);
  });

  it('returns false for non-numeric iteration count', async () => {
    await expect(verifyPassword('any', 'salt:notanumber:hash')).resolves.toBe(false);
  });

  it('returns false for negative iteration count', async () => {
    await expect(verifyPassword('any', 'salt:-1:deadbeef')).resolves.toBe(false);
  });

  it('returns false for empty salt', async () => {
    await expect(verifyPassword('any', ':100000:deadbeef')).resolves.toBe(false);
  });

  it('returns false for empty hash', async () => {
    await expect(verifyPassword('any', 'salt:100000:')).resolves.toBe(false);
  });
});
