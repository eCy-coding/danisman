/**
 * P34-T10: Lead Scoring — Unit Tests
 *
 * Mathematical model:
 *   Total = Σ(weight × ln(count + 1)) × firmographicMultiplier × decayFactor
 *
 *   - weight:           Event importance (CTA=20, FORM_SUBMIT=100, etc.)
 *   - ln(count + 1):    Logarithmic diminishing returns (spam visits don't inflate)
 *   - firmographic:     1.0 (free email) | 1.2 (edu) | 1.3 (corporate) | 1.5 (gov)
 *   - decayFactor:      2^(-days/30) → half-life 30 days (exponential decay)
 *
 * Tier thresholds:
 *   A (≥100): Hot — follow up ≤24h
 *   B (50-99): Warm — follow up ≤3 days
 *   C (<50):  Cold — nurturing sequence
 *
 * Test strategy:
 *   1. Mathematical identity: score=0 when no interactions
 *   2. Logarithmic diminishing returns: ln(2) < ln(3) but ratio decreasing
 *   3. Decay factor: exact match at t=0 (1.0), t=30d (0.5), t=60d (0.25)
 *   4. Firmographic multiplier for each domain class
 *   5. Tier boundary conditions: exactly 50, 99, 100, 101
 *   6. Full score pipeline: known inputs → expected output within tolerance
 */

import { describe, it, expect } from 'vitest';
import {
  computeLeadScore,
  classifyLead,
  getFirmographicMultiplier,
  BEHAVIORAL_WEIGHTS,
  type InteractionRecord,
} from './lead-scoring';

// ── Math helpers ─────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/** Tolerance for floating-point comparisons (±0.5%) */
function withinPct(actual: number, expected: number, pctTolerance = 0.5): boolean {
  if (expected === 0) return actual === 0;
  return Math.abs(actual - expected) / expected <= pctTolerance / 100;
}

// ─── Tests ────────────────────────────────────────────────────

describe('Lead Scoring — computeLeadScore()', () => {
  it('returns zero behavioral score with no interactions', () => {
    const result = computeLeadScore([], 'test@gmail.com');
    expect(result.behavioralScore).toBe(0);
    expect(result.totalScore).toBe(0);
    expect(result.tier).toBe('C');
  });

  it('scores a single page view correctly: weight=5 × ln(1+1) = 5×0.693 ≈ 3', () => {
    const result = computeLeadScore(
      [{ type: 'PAGE_VIEW', count: 1 }],
      'test@gmail.com',
      new Date(), // today — no decay
    );
    const expected = Math.round(BEHAVIORAL_WEIGHTS.PAGE_VIEW! * Math.log(2)); // = round(5 × 0.693) = 3
    expect(result.behavioralScore).toBe(expected);
  });

  it('logarithmic diminishing returns: 100 page views << 100× single visit', () => {
    const single = computeLeadScore([{ type: 'PAGE_VIEW', count: 1 }], 'a@corp.com', new Date());
    const hundred = computeLeadScore([{ type: 'PAGE_VIEW', count: 100 }], 'a@corp.com', new Date());
    // 100 visits should not be 100× the score — diminishing returns
    expect(hundred.behavioralScore).toBeLessThan(single.behavioralScore * 100);
    // But it should still be more than single
    expect(hundred.behavioralScore).toBeGreaterThan(single.behavioralScore);
  });

  it('ln(count+1) formula: count=10 → score = weight × ln(11)', () => {
    const result = computeLeadScore([{ type: 'CTA_CLICK', count: 10 }], 'a@gmail.com', new Date());
    const expected = Math.round(BEHAVIORAL_WEIGHTS.CTA_CLICK! * Math.log(11));
    expect(result.behavioralScore).toBe(expected);
  });

  it('decay factor at t=0 (today) is exactly 1.0: 2^(-0/30) = 1', () => {
    const result = computeLeadScore(
      [{ type: 'CTA_CLICK', count: 1 }],
      'a@gmail.com',
      new Date(), // now
    );
    expect(result.decayFactor).toBeCloseTo(1.0, 3);
  });

  it('decay factor at t=30 days is 0.5: 2^(-30/30) = 0.5', () => {
    const result = computeLeadScore([{ type: 'CTA_CLICK', count: 1 }], 'a@gmail.com', daysAgo(30));
    expect(result.decayFactor).toBeCloseTo(0.5, 2);
  });

  it('decay factor at t=60 days is 0.25: 2^(-60/30) = 0.25', () => {
    const result = computeLeadScore([{ type: 'CTA_CLICK', count: 1 }], 'a@gmail.com', daysAgo(60));
    expect(result.decayFactor).toBeCloseTo(0.25, 2);
  });

  it('decay at t=90 days is 0.125: 2^(-3) = 0.125', () => {
    const result = computeLeadScore([], 'a@gmail.com', daysAgo(90));
    expect(result.decayFactor).toBeCloseTo(0.125, 2);
  });

  it('decay is monotonically decreasing over time', () => {
    const d0 = computeLeadScore([], 'x@x.com', daysAgo(0)).decayFactor;
    const d10 = computeLeadScore([], 'x@x.com', daysAgo(10)).decayFactor;
    const d30 = computeLeadScore([], 'x@x.com', daysAgo(30)).decayFactor;
    const d90 = computeLeadScore([], 'x@x.com', daysAgo(90)).decayFactor;
    expect(d0).toBeGreaterThan(d10);
    expect(d10).toBeGreaterThan(d30);
    expect(d30).toBeGreaterThan(d90);
  });

  it('multiple event types: scores are additive', () => {
    const combined = computeLeadScore(
      [
        { type: 'PAGE_VIEW', count: 1 },
        { type: 'CTA_CLICK', count: 1 },
      ],
      'a@gmail.com',
      new Date(),
    );
    const pageOnly = computeLeadScore([{ type: 'PAGE_VIEW', count: 1 }], 'a@gmail.com', new Date());
    const ctaOnly = computeLeadScore([{ type: 'CTA_CLICK', count: 1 }], 'a@gmail.com', new Date());
    // combined behavioral = pageOnly + ctaOnly (firmographic and decay are multiplicative after summing)
    expect(combined.behavioralScore).toBe(pageOnly.behavioralScore + ctaOnly.behavioralScore);
  });

  it('unknown event type contributes weight 0 (no crash)', () => {
    const result = computeLeadScore(
      [{ type: 'UNKNOWN_EVENT_TYPE_XYZ', count: 999 }],
      'a@gmail.com',
      new Date(),
    );
    expect(result.behavioralScore).toBe(0);
  });

  it('FORM_SUBMIT is the highest-weight event (100)', () => {
    expect(BEHAVIORAL_WEIGHTS.FORM_SUBMIT!).toBe(100);
    expect(BEHAVIORAL_WEIGHTS.FORM_SUBMIT!).toBeGreaterThan(BEHAVIORAL_WEIGHTS.ROI_CALC!);
    expect(BEHAVIORAL_WEIGHTS.FORM_SUBMIT!).toBeGreaterThan(BEHAVIORAL_WEIGHTS.CTA_CLICK!);
    expect(BEHAVIORAL_WEIGHTS.FORM_SUBMIT!).toBeGreaterThan(BEHAVIORAL_WEIGHTS.PAGE_VIEW!);
  });
});

// ─── Firmographic Multiplier ──────────────────────────────────

describe('Lead Scoring — getFirmographicMultiplier()', () => {
  it('free email domains return 1.0 (no boost)', () => {
    expect(getFirmographicMultiplier('test@gmail.com')).toBe(1.0);
    expect(getFirmographicMultiplier('user@yahoo.com')).toBe(1.0);
    expect(getFirmographicMultiplier('user@hotmail.com')).toBe(1.0);
    expect(getFirmographicMultiplier('user@icloud.com')).toBe(1.0);
    expect(getFirmographicMultiplier('user@protonmail.com')).toBe(1.0);
  });

  it('corporate email returns 1.3', () => {
    expect(getFirmographicMultiplier('ceo@microsoft.com')).toBe(1.3);
    expect(getFirmographicMultiplier('hr@startupxyz.io')).toBe(1.3);
    expect(getFirmographicMultiplier('manager@ecypro.com')).toBe(1.3);
  });

  it('educational email (.edu.tr, .edu) returns 1.2', () => {
    expect(getFirmographicMultiplier('student@itu.edu.tr')).toBe(1.2);
    expect(getFirmographicMultiplier('prof@mit.edu')).toBe(1.2);
  });

  it('government email (.gov.tr, .gov) returns 1.5', () => {
    expect(getFirmographicMultiplier('minister@hazine.gov.tr')).toBe(1.5);
    expect(getFirmographicMultiplier('official@state.gov')).toBe(1.5);
  });

  it('multiplier ordering: free(1.0) < edu(1.2) < corp(1.3) < gov(1.5)', () => {
    const free = getFirmographicMultiplier('a@gmail.com');
    const edu = getFirmographicMultiplier('a@boun.edu.tr');
    const corp = getFirmographicMultiplier('a@corp.com');
    const gov = getFirmographicMultiplier('a@tc.gov.tr');
    expect(free).toBeLessThan(edu);
    expect(edu).toBeLessThan(corp);
    expect(corp).toBeLessThan(gov);
  });

  it('case-insensitive domain matching', () => {
    expect(getFirmographicMultiplier('CEO@GMAIL.COM')).toBe(1.0);
    expect(getFirmographicMultiplier('HR@COMPANY.COM')).toBe(1.3);
  });
});

// ─── Tier Classification ──────────────────────────────────────

describe('Lead Scoring — classifyLead()', () => {
  it('score 100 → Tier A (Hot)', () => {
    expect(classifyLead(100).tier).toBe('A');
    expect(classifyLead(200).tier).toBe('A');
    expect(classifyLead(101).tier).toBe('A');
  });

  it('score 50-99 → Tier B (Warm)', () => {
    expect(classifyLead(50).tier).toBe('B');
    expect(classifyLead(99).tier).toBe('B');
    expect(classifyLead(75).tier).toBe('B');
  });

  it('score <50 → Tier C (Cold)', () => {
    expect(classifyLead(0).tier).toBe('C');
    expect(classifyLead(49).tier).toBe('C');
    expect(classifyLead(1).tier).toBe('C');
  });

  it('tier boundary: exactly 50 → B, exactly 100 → A', () => {
    expect(classifyLead(50).tier).toBe('B');
    expect(classifyLead(100).tier).toBe('A');
    expect(classifyLead(49).tier).toBe('C');
    expect(classifyLead(99).tier).toBe('B');
  });

  it('correct color palette per tier', () => {
    expect(classifyLead(100).color).toBe('#ef4444'); // red for Hot
    expect(classifyLead(75).color).toBe('#f59e0b'); // amber for Warm
    expect(classifyLead(10).color).toBe('#64748b'); // slate for Cold
  });

  it('correct labels', () => {
    expect(classifyLead(100).label).toBe('Hot');
    expect(classifyLead(75).label).toBe('Warm');
    expect(classifyLead(10).label).toBe('Cold');
  });
});

// ─── Full Pipeline Integration ────────────────────────────────

describe('Lead Scoring — full pipeline', () => {
  it('corporate visitor with high intent → Tier A', () => {
    // Corporate email (+30% boost), ROI calc + form submit + CTA clicks (fresh)
    const interactions: InteractionRecord[] = [
      { type: 'ROI_CALC', count: 2 }, // 60 × ln(3) ≈ 65.9
      { type: 'FORM_SUBMIT', count: 1 }, // 100 × ln(2) ≈ 69.3
      { type: 'CTA_CLICK', count: 3 }, // 20 × ln(4) ≈ 27.7
    ];
    const result = computeLeadScore(interactions, 'cto@enterprise.com', new Date());
    // behavioral ≈ 65.9 + 69.3 + 27.7 = 162.9 → round(163)
    // × 1.3 (corporate) × 1.0 (no decay) = 212 → well above 100
    expect(result.tier).toBe('A');
    expect(result.totalScore).toBeGreaterThanOrEqual(100);
  });

  it('free email visitor with stale activity → Tier C', () => {
    const interactions: InteractionRecord[] = [
      { type: 'PAGE_VIEW', count: 1 }, // 5 × ln(2) ≈ 3.5 → 3
    ];
    // 60 days ago → decay = 0.25
    const result = computeLeadScore(interactions, 'anon@gmail.com', daysAgo(60));
    // behavioral = 3, × 1.0 (free) × 0.25 (decay) = 0.75 → round(1)
    expect(result.tier).toBe('C');
    expect(result.totalScore).toBeLessThan(50);
  });

  it('gov email visitor recent high-intent → max tier A fast', () => {
    const interactions: InteractionRecord[] = [
      { type: 'FORM_SUBMIT', count: 1 }, // 100 × ln(2) ≈ 69
    ];
    const result = computeLeadScore(interactions, 'official@belediye.gov.tr', new Date());
    // 69 × 1.5 × 1.0 = 103 → A
    expect(result.tier).toBe('A');
    expect(result.firmographicMultiplier).toBe(1.5);
  });

  it('total score = behavioral × firmographic × decay (mathematical invariant)', () => {
    const interactions: InteractionRecord[] = [
      { type: 'BOOKING_START', count: 5 },
      { type: 'CTA_CLICK', count: 2 },
    ];
    const email = 'manager@tech.com';
    const lastAt = daysAgo(15);
    const result = computeLeadScore(interactions, email, lastAt);

    const expectedBehavioral = Math.round(
      BEHAVIORAL_WEIGHTS.BOOKING_START! * Math.log(6) + BEHAVIORAL_WEIGHTS.CTA_CLICK! * Math.log(3),
    );
    const expectedFirmo = 1.3; // corporate
    const expectedDecay = Math.pow(2, -15 / 30); // 2^(-0.5) ≈ 0.707
    const expectedTotal = Math.round(expectedBehavioral * expectedFirmo * expectedDecay);

    expect(result.behavioralScore).toBe(expectedBehavioral);
    expect(result.firmographicMultiplier).toBe(expectedFirmo);
    expect(withinPct(result.decayFactor, expectedDecay)).toBe(true);
    expect(result.totalScore).toBe(expectedTotal);
  });
});
