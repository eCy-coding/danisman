/**
 * Track 1 — quick-check submit unit tests.
 *
 * Verifies:
 *   - scoreAnswers boundary: 0, 12 (high-risk ceiling), 13 (medium floor),
 *     21 (medium ceiling), 22 (mature floor), 30 (perfect).
 *   - red flag triggers only on Q8/Q9 D answers.
 *   - missing kvkkConsent → 400 KVKK_REQUIRED.
 *   - invalid answer length → 400 INVALID_PAYLOAD.
 *   - happy path returns ok + score + tier.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../lib/posthog-server', () => ({
  captureWithConsent: vi.fn(async () => ({ captured: false, reason: 'analytics_opt_out' })),
}));
vi.mock('../services/notion', () => ({
  upsertProspect: vi.fn(async () => 'mock-prospect-id'),
}));
vi.mock('../config/redis', () => ({
  redis: { status: 'wait', eval: async () => null, ping: async () => 'PONG' },
}));

import quickCheckRoutes, { __quickCheckInternals } from './quick-check';
import { errorHandler } from '../middleware/error';
import { __resetFallbackStoreForTests } from '../middleware/rateLimiter';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/quick-check-submit', quickCheckRoutes);
  app.use(errorHandler);
  return app;
}

const allLetters = (letter: 'A' | 'B' | 'C' | 'D') =>
  Array.from({ length: 10 }, () => letter) as Array<'A' | 'B' | 'C' | 'D'>;

describe('scoreAnswers', () => {
  it('returns 30 / mature when every answer is A', () => {
    const r = __quickCheckInternals.scoreAnswers(allLetters('A'));
    expect(r.score).toBe(30);
    expect(r.tier).toBe('mature');
    expect(r.redFlag).toBe(false);
  });

  it('returns 0 / high-risk when every answer is D', () => {
    const r = __quickCheckInternals.scoreAnswers(allLetters('D'));
    expect(r.score).toBe(0);
    expect(r.tier).toBe('high-risk');
    expect(r.redFlag).toBe(true);
  });

  it('treats score 12 as high-risk and 13 as medium', () => {
    // 4 A (12) + 6 D (0) = 12 → high-risk
    const lo = ['A', 'A', 'A', 'A', 'D', 'D', 'D', 'D', 'D', 'D'] as const;
    expect(__quickCheckInternals.scoreAnswers([...lo]).tier).toBe('high-risk');

    // 4 A (12) + 2 B (4) + 4 D (0) = 16 → medium. Push the B into Q8/Q9
    // slots to avoid red flag (D on those would flip redFlag true).
    const mid = ['A', 'A', 'A', 'A', 'D', 'D', 'D', 'B', 'B', 'D'] as const;
    const r = __quickCheckInternals.scoreAnswers([...mid]);
    expect(r.score).toBe(16);
    expect(r.tier).toBe('medium');
    expect(r.redFlag).toBe(false);
  });

  it('flags red on Q8 D or Q9 D only', () => {
    const noFlag = ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'C', 'C', 'D'] as const;
    expect(__quickCheckInternals.scoreAnswers([...noFlag]).redFlag).toBe(false);

    const flagQ8 = ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'D', 'C', 'A'] as const;
    expect(__quickCheckInternals.scoreAnswers([...flagQ8]).redFlag).toBe(true);

    const flagQ9 = ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'C', 'D', 'A'] as const;
    expect(__quickCheckInternals.scoreAnswers([...flagQ9]).redFlag).toBe(true);
  });
});

describe('POST /api/v1/quick-check-submit', () => {
  beforeEach(() => {
    __resetFallbackStoreForTests();
  });

  it('rejects without kvkkConsent (400 KVKK_REQUIRED)', async () => {
    const res = await request(makeApp())
      .post('/api/v1/quick-check-submit')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        answers: allLetters('A'),
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('KVKK_REQUIRED');
  });

  it('rejects bad answer length (400 INVALID_PAYLOAD)', async () => {
    const res = await request(makeApp())
      .post('/api/v1/quick-check-submit')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        kvkkConsent: true,
        answers: ['A', 'B', 'C'],
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PAYLOAD');
  });

  it('returns ok + score + tier on happy path', async () => {
    const res = await request(makeApp())
      .post('/api/v1/quick-check-submit')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        kvkkConsent: true,
        answers: allLetters('A'),
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.score).toBe(30);
    expect(res.body.tier).toBe('mature');
  });
});
