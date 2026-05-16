/**
 * P15 — retry-queue regression suite.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enqueue, size, clear, flush } from '../lib/network/retry-queue';

beforeEach(() => {
  // jsdom localStorage isolation
  globalThis.localStorage.clear();
  globalThis.fetch = vi.fn(async () => new Response('{"ok":true}', { status: 200 })) as typeof fetch;
});

afterEach(() => {
  clear();
});

describe('retry-queue', () => {
  it('enqueue + size + clear', () => {
    expect(size()).toBe(0);
    enqueue({ id: 'r1', url: '/a', method: 'POST', headers: {}, body: '{}' });
    expect(size()).toBe(1);
    enqueue({ id: 'r2', url: '/b', method: 'POST', headers: {}, body: '{}' });
    expect(size()).toBe(2);
    clear();
    expect(size()).toBe(0);
  });

  it('idempotent enqueue — same id ignored', () => {
    enqueue({ id: 'same', url: '/a', method: 'POST', headers: {}, body: '{}' });
    enqueue({ id: 'same', url: '/a', method: 'POST', headers: {}, body: '{}' });
    expect(size()).toBe(1);
  });

  it('max 10 — oldest dropped when full', () => {
    for (let i = 0; i < 12; i++) {
      enqueue({ id: `r${i}`, url: '/x', method: 'POST', headers: {}, body: '{}' });
    }
    expect(size()).toBe(10);
  });

  it('flush — all ok → cleared', async () => {
    enqueue({ id: 'r1', url: '/ok', method: 'POST', headers: {}, body: '{}' });
    enqueue({ id: 'r2', url: '/ok', method: 'POST', headers: {}, body: '{}' });
    const r = await flush();
    expect(r.ok).toBe(2);
    expect(size()).toBe(0);
  });

  it('flush — 4xx drops, 5xx keeps with bumped attempts', async () => {
    let i = 0;
    globalThis.fetch = vi.fn(async () => {
      i++;
      if (i === 1) return new Response('bad', { status: 400 });
      return new Response('err', { status: 500 });
    }) as typeof fetch;
    enqueue({ id: 'a', url: '/x', method: 'POST', headers: {}, body: '{}' });
    enqueue({ id: 'b', url: '/x', method: 'POST', headers: {}, body: '{}' });
    const r = await flush();
    expect(r.ok).toBe(0);
    // 1 dropped (4xx), 1 kept (5xx)
    expect(r.dropped).toBe(1);
    expect(size()).toBe(1);
  });
});
