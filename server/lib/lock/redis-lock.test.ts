/**
 * P23 BE Track 2 / Aşama 4 — Distributed lock tests.
 *
 * We mock the ioredis client to avoid a Redis dep in unit tests. The Lua
 * scripts are tested by simulating their semantics in the mock:
 *   - SET NX returns 'OK' first time, null after.
 *   - EVAL(RELEASE_LUA) returns 1 when token matches, 0 otherwise.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const fakeStore = new Map<string, { value: string; expiresAt: number }>();

vi.mock('../../config/redis', () => ({
  redis: {
    set: vi.fn((key: string, value: string, _px: string, ttl: number, _nx: string) => {
      const existing = fakeStore.get(key);
      if (existing && existing.expiresAt > Date.now()) return Promise.resolve(null);
      fakeStore.set(key, { value, expiresAt: Date.now() + ttl });
      return Promise.resolve('OK');
    }),
    eval: vi.fn((script: string, _n: number, key: string, token: string, ttlMs?: string) => {
      const entry = fakeStore.get(key);
      if (!entry || entry.value !== token) return Promise.resolve(0);
      if (script.includes('PEXPIRE')) {
        entry.expiresAt = Date.now() + Number(ttlMs);
        return Promise.resolve(1);
      }
      fakeStore.delete(key);
      return Promise.resolve(1);
    }),
    get: vi.fn((key: string) => {
      const entry = fakeStore.get(key);
      if (!entry || entry.expiresAt <= Date.now()) return Promise.resolve(null);
      return Promise.resolve(entry.value);
    }),
    pttl: vi.fn((key: string) => {
      const entry = fakeStore.get(key);
      if (!entry) return Promise.resolve(-2);
      return Promise.resolve(Math.max(0, entry.expiresAt - Date.now()));
    }),
  },
}));

import { acquireLock, releaseLock, withLock, inspectLock } from './redis-lock';

beforeEach(() => fakeStore.clear());

describe('redis-lock', () => {
  it('acquireLock grants when key is free, denies when held', async () => {
    const a = await acquireLock('lock:test', 1_000);
    expect(a).not.toBeNull();
    const b = await acquireLock('lock:test', 1_000);
    expect(b).toBeNull();
  });

  it('releaseLock only deletes when token matches', async () => {
    const a = await acquireLock('lock:rel', 1_000);
    expect(a).not.toBeNull();
    // Forge a different lock with the same key but different token.
    const forged = { ...a!, token: 'nope' };
    expect(await releaseLock(forged)).toBe(false);
    // Original holder can release.
    expect(await releaseLock(a!)).toBe(true);
    // Free again.
    const c = await acquireLock('lock:rel', 1_000);
    expect(c).not.toBeNull();
  });

  it('withLock runs the task and releases on success', async () => {
    const out = await withLock('lock:w', 1_000, async () => 42);
    expect(out).toEqual({ acquired: true, value: 42 });
    // Lock should be free now.
    const inspect = await inspectLock('lock:w');
    expect(inspect).toBeNull();
  });

  it('withLock skips when contended', async () => {
    const a = await acquireLock('lock:s', 5_000);
    expect(a).not.toBeNull();
    const out = await withLock('lock:s', 1_000, async () => 'should not run');
    expect(out).toEqual({ acquired: false });
  });

  it('withLock releases even when the task throws', async () => {
    await expect(
      withLock('lock:throw', 1_000, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    const inspect = await inspectLock('lock:throw');
    expect(inspect).toBeNull();
  });
});
