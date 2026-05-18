import { describe, it, expect } from 'vitest';
import { scoreLeadP55, classificationLabel } from './lead-scoring-p55';

describe('P66 lead-scoring-p55', () => {
  it('cold lead under 40 points', () => {
    const r = scoreLeadP55({ source: 'paid' });
    expect(r.classification).toBe('cold');
    expect(r.total).toBeLessThan(40);
  });

  it('hot lead with booking + recent activity', () => {
    const r = scoreLeadP55({
      source: 'referral',
      serviceInterest: 'strategic-transformation',
      assessmentsCompleted: 2,
      bookedDiscoveryCall: true,
      newsletterSubscribed: true,
      newsletterConfirmed: true,
      lastActivityAt: new Date(),
    });
    expect(r.classification).toBe('hot');
    expect(r.total).toBeGreaterThanOrEqual(80);
  });

  it('warm lead with mid signals', () => {
    const r = scoreLeadP55({
      source: 'organic',
      serviceInterest: 'family-business',
      assessmentsCompleted: 1,
      lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });
    expect(r.classification).toBe('warm');
  });

  it('classificationLabel returns proper Turkish action', () => {
    expect(classificationLabel('hot').action).toMatch(/24 saat/);
    expect(classificationLabel('warm').action).toMatch(/3 gün/);
    expect(classificationLabel('cold').label).toBe('Cold');
  });

  it('caps assessmentsCompleted at 4', () => {
    const r = scoreLeadP55({ assessmentsCompleted: 10 });
    expect(r.breakdown.assessment).toBe(100); // 4 * 25
  });
});
