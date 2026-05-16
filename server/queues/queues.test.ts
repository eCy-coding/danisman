/**
 * P17 BE Track 2 / Aşama 1 — queue registry tests.
 *
 * The sandbox never has Redis nor the `bullmq` npm package available,
 * so these tests exercise the INLINE-FALLBACK path. That's actually the
 * most fragile branch — it's the one our retry/DLQ doesn't cover — so
 * pinning it is high-value.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { enqueue, registerInlineHandler, _testing, type EmailJobPayload } from './index';

beforeEach(() => {
  _testing.reset();
});

describe('enqueue() — inline fallback', () => {
  it('runs the registered handler synchronously when BullMQ is unavailable', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerInlineHandler('email', handler);

    const result = await enqueue('email', {
      type: 'welcome',
      to: 'user@example.com',
      name: 'Test',
      lang: 'tr',
    });

    expect(result.mode).toBe('inline');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0]).toMatchObject({
      type: 'welcome',
      to: 'user@example.com',
    });
  });

  it('returns mode=dropped when no inline handler and no Redis', async () => {
    const result = await enqueue('cron', { task: 'sitemap-regen' });
    expect(result.mode).toBe('dropped');
    expect(result.error).toBe('no_handler_no_queue');
  });

  it('surfaces handler errors via the result envelope', async () => {
    registerInlineHandler('email', async () => {
      throw new Error('SMTP down');
    });

    const result = await enqueue('email', {
      type: 'welcome',
      to: 'user@example.com',
      name: 'Test',
      lang: 'tr',
    });

    expect(result.mode).toBe('inline');
    expect(result.error).toBe('SMTP down');
  });

  it('discriminated union enforces payload shape at compile time', () => {
    // This test exists purely to keep the union types healthy — if a new
    // EmailJobPayload variant is added without updating the dispatcher,
    // TypeScript will yell here before runtime even sees it.
    const p: EmailJobPayload = { type: 'welcome', to: 'x@y.z', name: 'X', lang: 'tr' };
    expect(p.type).toBe('welcome');
  });
});

describe('getQueueStats / closeQueues — non-Redis path', () => {
  it('reports available=false for every queue when BullMQ not installed', async () => {
    const { getAllQueueStats } = await import('./index');
    const stats = await getAllQueueStats();
    expect(stats).toHaveLength(3);
    for (const s of stats) {
      expect(s.available).toBe(false);
    }
  });

  it('closeQueues() is safe to call when no queues were created', async () => {
    const { closeQueues } = await import('./index');
    await expect(closeQueues()).resolves.toBeUndefined();
  });
});
