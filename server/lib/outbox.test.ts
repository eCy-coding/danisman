import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

vi.mock('../config/db', () => ({
  prisma: {
    integrationOutbox: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { withOutboxRecord, type OutboxContext } from './outbox';
import { prisma } from '../config/db';

const ctx: OutboxContext = {
  service: 'NOTION',
  operation: 'upsertProspect',
  payload: { email: 'a@b.com', name: 'Ada' },
};

describe('withOutboxRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.integrationOutbox.create).mockResolvedValue({ id: 'row-1' } as never);
    vi.mocked(prisma.integrationOutbox.update).mockResolvedValue({} as never);
  });

  it('happy path: creates PENDING, returns result, transitions to COMPLETED', async () => {
    const result = await withOutboxRecord(ctx, async () => 'page-123');

    expect(result).toBe('page-123');

    expect(prisma.integrationOutbox.create).toHaveBeenCalledTimes(1);
    expect(prisma.integrationOutbox.create).toHaveBeenCalledWith({
      data: {
        service: 'NOTION',
        operation: 'upsertProspect',
        payload: ctx.payload,
        traceId: null,
        status: 'PENDING',
      },
    });

    expect(prisma.integrationOutbox.update).toHaveBeenCalledTimes(1);
    expect(prisma.integrationOutbox.update).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { status: 'COMPLETED' },
    });
  });

  it('failure path: operation throws → row FAILED, lastError stored, attempts=1, error re-thrown', async () => {
    const boom = new Error('Notion 503 Service Unavailable');

    await expect(
      withOutboxRecord(ctx, async () => {
        throw boom;
      }),
    ).rejects.toThrow('Notion 503 Service Unavailable');

    expect(prisma.integrationOutbox.update).toHaveBeenCalledTimes(1);
    expect(prisma.integrationOutbox.update).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: {
        status: 'FAILED',
        lastError: 'Notion 503 Service Unavailable',
        attempts: { increment: 1 },
      },
    });
  });

  it('truncates lastError to 1000 chars', async () => {
    const longMsg = 'x'.repeat(5000);

    await expect(
      withOutboxRecord(ctx, async () => {
        throw new Error(longMsg);
      }),
    ).rejects.toThrow();

    const call = vi.mocked(prisma.integrationOutbox.update).mock.calls[0]![0] as {
      data: { lastError: string };
    };
    expect(call.data.lastError).toHaveLength(1000);
  });

  it('sequential failures: each call increments attempts via { increment: 1 }', async () => {
    const failing = async () => {
      throw new Error('still down');
    };

    await expect(withOutboxRecord(ctx, failing)).rejects.toThrow();
    await expect(withOutboxRecord(ctx, failing)).rejects.toThrow();

    // Each invocation issues exactly one FAILED update with an atomic increment,
    // so attempts accumulate row-side across retries rather than being overwritten.
    const failedUpdates = vi
      .mocked(prisma.integrationOutbox.update)
      .mock.calls.filter((c) => (c[0] as { data: { status?: string } }).data.status === 'FAILED');
    expect(failedUpdates).toHaveLength(2);
    for (const [arg] of failedUpdates) {
      expect((arg as { data: { attempts: unknown } }).data.attempts).toEqual({ increment: 1 });
    }
  });

  it('passes traceId through when provided', async () => {
    await withOutboxRecord({ ...ctx, traceId: 'trace-xyz' }, async () => 'ok');
    expect(prisma.integrationOutbox.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ traceId: 'trace-xyz' }) }),
    );
  });
});
