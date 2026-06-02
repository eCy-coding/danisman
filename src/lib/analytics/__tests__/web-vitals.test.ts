/**
 * Tests for getRating() and VITAL_THRESHOLDS — Sprint 11 P44-T04
 */
import { describe, it, expect } from 'vitest';
import { getRating, VITAL_THRESHOLDS } from '../web-vitals';

// ---------------------------------------------------------------------------
// VITAL_THRESHOLDS shape tests (2)
// ---------------------------------------------------------------------------
describe('VITAL_THRESHOLDS', () => {
  it('1. exports all 5 required vital keys', () => {
    const keys = Object.keys(VITAL_THRESHOLDS);
    expect(keys).toContain('CLS');
    expect(keys).toContain('FCP');
    expect(keys).toContain('INP');
    expect(keys).toContain('LCP');
    expect(keys).toContain('TTFB');
    expect(keys).toHaveLength(5);
  });

  it('2. each vital has good < poor threshold', () => {
    for (const [name, { good, poor }] of Object.entries(VITAL_THRESHOLDS)) {
      expect(good, `${name}: good should be < poor`).toBeLessThan(poor);
    }
  });
});

// ---------------------------------------------------------------------------
// getRating per-vital tests (15 — 3 per vital)
// ---------------------------------------------------------------------------
describe('getRating — CLS', () => {
  it('3. 0.05 → good', () => expect(getRating('CLS', 0.05)).toBe('good'));
  it('4. 0.15 → needs-improvement', () => expect(getRating('CLS', 0.15)).toBe('needs-improvement'));
  it('5. 0.3 → poor', () => expect(getRating('CLS', 0.3)).toBe('poor'));
});

describe('getRating — FCP', () => {
  it('6. 1500 → good', () => expect(getRating('FCP', 1500)).toBe('good'));
  it('7. 2500 → needs-improvement', () => expect(getRating('FCP', 2500)).toBe('needs-improvement'));
  it('8. 3500 → poor', () => expect(getRating('FCP', 3500)).toBe('poor'));
});

describe('getRating — INP', () => {
  it('9. 150 → good', () => expect(getRating('INP', 150)).toBe('good'));
  it('10. 350 → needs-improvement', () => expect(getRating('INP', 350)).toBe('needs-improvement'));
  it('11. 600 → poor', () => expect(getRating('INP', 600)).toBe('poor'));
});

describe('getRating — LCP', () => {
  it('12. 2000 → good', () => expect(getRating('LCP', 2000)).toBe('good'));
  it('13. 3000 → needs-improvement', () =>
    expect(getRating('LCP', 3000)).toBe('needs-improvement'));
  it('14. 4500 → poor', () => expect(getRating('LCP', 4500)).toBe('poor'));
});

describe('getRating — TTFB', () => {
  it('15. 500 → good', () => expect(getRating('TTFB', 500)).toBe('good'));
  it('16. 1200 → needs-improvement', () =>
    expect(getRating('TTFB', 1200)).toBe('needs-improvement'));
  it('17. 2000 → poor', () => expect(getRating('TTFB', 2000)).toBe('poor'));
});

// ---------------------------------------------------------------------------
// Edge case tests (2)
// ---------------------------------------------------------------------------
describe('getRating — edge cases', () => {
  it('18. unknown vital name → needs-improvement', () => {
    expect(getRating('UNKNOWN_VITAL', 999)).toBe('needs-improvement');
  });

  it('19. value exactly at good threshold → good', () => {
    // CLS good threshold = 0.1; value <= threshold.good returns 'good'
    expect(getRating('CLS', VITAL_THRESHOLDS['CLS'].good)).toBe('good');
  });
});
