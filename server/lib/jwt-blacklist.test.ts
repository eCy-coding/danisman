/**
 * P15-BE Aşama 1: TTL bug regression tests.
 *
 * The bug:
 *   `blacklistToken(jti, expiresAtMs)` expects an ABSOLUTE epoch-ms
 *   timestamp. Earlier call-sites passed a relative seconds count
 *   (`60*60*24*7 = 604800`) which is far below Date.now(), so the helper
 *   computed `ttl <= 0` and short-circuited — silently never blacklisting
 *   the jti. These tests pin down the contract and make regressions loud.
 *
 * NOTE: We deliberately mock the redis client so this spec runs without a
 * live Redis (sandbox + CI), and we read the resolved TTL through the
 * mock's call arguments.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setSpy = vi.fn();
const getSpy = vi.fn();

vi.mock('../config/redis', () => ({
  redis: {
    set: (...args: unknown[]) => setSpy(...args),
    get: (...args: unknown[]) => getSpy(...args),
  },
}));

vi.mock('../config/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { blacklistToken, isBlacklisted } from './jwt-blacklist';

const ONE_HOUR_MS = 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

beforeEach(() => {
  setSpy.mockReset().mockResolvedValue('OK');
  getSpy.mockReset().mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('blacklistToken — TTL contract (P15-BE bug fix)', () => {
  it('accepts an ABSOLUTE epoch-ms timestamp and writes a positive TTL', async () => {
    const now = 1_700_000_000_000; // pinned clock
    vi.useFakeTimers();
    vi.setSystemTime(now);

    await blacklistToken('jti-abc', now + ONE_HOUR_MS);

    expect(setSpy).toHaveBeenCalledTimes(1);
    const [, , flag, ttl] = setSpy.mock.calls[0] as [string, string, string, number];
    expect(flag).toBe('EX');
    // 1h = 3600 seconds (rounded up via Math.ceil)
    expect(ttl).toBe(3600);
  });

  it('REGRESSION: a raw seconds count (legacy bug pattern) NEVER reaches Redis', async () => {
    // This is the exact shape the buggy callers used: a relative seconds
    // count instead of an absolute ms timestamp. The helper should detect
    // ttl <= 0 and short-circuit; otherwise the jti silently leaks back to
    // valid even after revocation.
    const sevenDaysSeconds = 60 * 60 * 24 * 7; // 604_800 — what the bug passed

    await blacklistToken('jti-legacy-bug', sevenDaysSeconds);

    expect(setSpy).not.toHaveBeenCalled();
  });

  it('rounds up sub-second residual TTL with Math.ceil', async () => {
    const now = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    // 1500ms in the future → ceil(1.5) = 2 seconds.
    await blacklistToken('jti-tiny', now + 1500);

    const [, , , ttl] = setSpy.mock.calls[0] as [string, string, string, number];
    expect(ttl).toBe(2);
  });

  it('honors a 7-day horizon (sessions revoke path)', async () => {
    const now = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    await blacklistToken('jti-session-revoke', now + SEVEN_DAYS_MS);

    const [, , , ttl] = setSpy.mock.calls[0] as [string, string, string, number];
    expect(ttl).toBe(604_800); // 7 days expressed as seconds
  });

  it('falls back to in-memory store when Redis throws', async () => {
    setSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    getSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const now = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);

    await blacklistToken('jti-fallback', now + ONE_HOUR_MS);

    // Memory fallback should report the jti as blacklisted.
    await expect(isBlacklisted('jti-fallback')).resolves.toBe(true);
  });
});
