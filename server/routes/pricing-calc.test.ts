/**
 * Track 1 — pricing-calculator submit unit tests.
 *
 * Verifies:
 *   - recommendPaket boundary cases for starter/growth/enterprise.
 *   - missing kvkkConsent → 400 KVKK_REQUIRED.
 *   - happy path returns ok + paket.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../lib/posthog-server', () => ({ capture: vi.fn(async () => undefined) }));
vi.mock('../services/notion', () => ({
  upsertProspect: vi.fn(async () => 'mock-prospect-id'),
}));
vi.mock('../config/redis', () => ({
  redis: { status: 'wait', eval: async () => null, ping: async () => 'PONG' },
}));

import pricingCalcRoutes, { recommendPaket } from './pricing-calc';
import { errorHandler } from '../middleware/error';
import { __resetFallbackStoreForTests } from '../middleware/rateLimiter';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/pricing-calculator-submit', pricingCalcRoutes);
  app.use(errorHandler);
  return app;
}

describe('recommendPaket', () => {
  it('returns starter for low budget OR early + quarter horizon', () => {
    expect(
      recommendPaket({
        teamSize: '11-50',
        maturity: 'scaling',
        horizon: 'year',
        budgetBand: '<5k',
      }),
    ).toBe('starter');

    expect(
      recommendPaket({
        teamSize: '1-10',
        maturity: 'early',
        horizon: 'quarter',
        budgetBand: '5k-25k',
      }),
    ).toBe('starter');
  });

  it('returns enterprise for mature + long horizon + scale or high budget', () => {
    expect(
      recommendPaket({
        teamSize: '200+',
        maturity: 'mature',
        horizon: 'multi-year',
        budgetBand: '100k+',
      }),
    ).toBe('enterprise');
  });

  it('falls through to growth for the middle bucket', () => {
    expect(
      recommendPaket({
        teamSize: '11-50',
        maturity: 'scaling',
        horizon: 'year',
        budgetBand: '5k-25k',
      }),
    ).toBe('growth');
  });
});

describe('POST /api/v1/pricing-calculator-submit', () => {
  beforeEach(() => {
    __resetFallbackStoreForTests();
  });

  it('rejects without kvkkConsent (400 KVKK_REQUIRED)', async () => {
    const res = await request(makeApp())
      .post('/api/v1/pricing-calculator-submit')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        answers: {
          teamSize: '11-50',
          maturity: 'scaling',
          horizon: 'year',
          budgetBand: '5k-25k',
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('KVKK_REQUIRED');
  });

  it('returns ok + recommended paket on happy path', async () => {
    const res = await request(makeApp())
      .post('/api/v1/pricing-calculator-submit')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        kvkkConsent: true,
        answers: {
          teamSize: '200+',
          maturity: 'mature',
          horizon: 'multi-year',
          budgetBand: '100k+',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.paket).toBe('enterprise');
  });
});
