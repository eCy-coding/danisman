import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPipeline = {
  incr: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  getdel: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue([]),
};

vi.mock('../config/redis', () => ({
  redis: {
    pipeline: vi.fn(() => mockPipeline),
    keys: vi.fn().mockResolvedValue([]),
    incr: vi.fn().mockResolvedValue(1),
  },
}));

vi.mock('../config/db', () => ({
  prisma: {
    blogPost: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../config/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { incrementView, flushViewsToDB, hashUserIdentifier } from '../services/viewCounter';
import { redis } from '../config/redis';
import { prisma } from '../config/db';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('viewCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset pipeline mock exec to return empty
    mockPipeline.exec.mockResolvedValue([]);
  });

  describe('incrementView', () => {
    it('calls pipeline.incr with correct key', async () => {
      mockPipeline.exec.mockResolvedValue([[null, 1]]);
      await incrementView('post-123');
      expect(mockPipeline.incr).toHaveBeenCalledWith('views:post-123');
    });

    it('calls pipeline.set for unique key when userHash provided', async () => {
      mockPipeline.exec.mockResolvedValue([
        [null, 1],
        [null, 1],
      ]);
      await incrementView('post-123', 'user-hash-abc');
      expect(mockPipeline.set).toHaveBeenCalledWith(
        'unique:post-123:user-hash-abc',
        '1',
        'EX',
        86400,
        'NX',
      );
    });

    it('does NOT call pipeline.set when no userHash', async () => {
      mockPipeline.exec.mockResolvedValue([[null, 1]]);
      await incrementView('post-456');
      expect(mockPipeline.set).not.toHaveBeenCalled();
    });

    it('does not throw on Redis error', async () => {
      mockPipeline.exec.mockRejectedValue(new Error('Redis down'));
      await expect(incrementView('post-789')).resolves.not.toThrow();
    });
  });

  describe('flushViewsToDB', () => {
    it('returns { updated: 0 } when no keys in Redis', async () => {
      vi.mocked(redis.keys).mockResolvedValue([]);
      const result = await flushViewsToDB();
      expect(result).toEqual({ updated: 0 });
    });

    it('updates BlogPost for each key with positive count', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['views:post-1', 'views:post-2']);
      mockPipeline.exec.mockResolvedValue([
        [null, '5'],
        [null, '3'],
      ]);
      const result = await flushViewsToDB();
      expect(prisma.blogPost.update).toHaveBeenCalledTimes(2);
      expect(result.updated).toBe(2);
    });

    it('skips zero-count entries and does not call update', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['views:post-1', 'views:post-2']);
      mockPipeline.exec.mockResolvedValue([
        [null, '0'],
        [null, '7'],
      ]);
      const result = await flushViewsToDB();
      expect(prisma.blogPost.update).toHaveBeenCalledTimes(1);
      expect(result.updated).toBe(1);
    });

    it('calls prisma.blogPost.update with increment delta', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['views:post-abc']);
      mockPipeline.exec.mockResolvedValue([[null, '42']]);
      await flushViewsToDB();
      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 'post-abc' },
        data: { viewCount: { increment: 42 } },
      });
    });

    it('does not throw on Prisma error, returns partial count', async () => {
      vi.mocked(redis.keys).mockRejectedValue(new Error('Redis connection lost'));
      const result = await flushViewsToDB();
      expect(result.updated).toBe(0);
    });
  });

  describe('hashUserIdentifier', () => {
    it('returns SHA-256 hex string', () => {
      const result = hashUserIdentifier('192.168.1.1');
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('same input produces same hash (deterministic)', () => {
      const a = hashUserIdentifier('test-ip');
      const b = hashUserIdentifier('test-ip');
      expect(a).toBe(b);
    });

    it('different inputs produce different hashes', () => {
      const a = hashUserIdentifier('ip-A');
      const b = hashUserIdentifier('ip-B');
      expect(a).not.toBe(b);
    });
  });
});
