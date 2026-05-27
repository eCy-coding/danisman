import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateSLA, getSLABadge, canExtend } from './dsar-sla';

describe('DSAR SLA fuzz (property-based)', () => {
  it('SLA deadline always receivedAt + exactly 30 days (not extended)', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2030-12-31') }),
        (received) => {
          const sla = calculateSLA(received, false);
          const diffMs = sla.getTime() - received.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeCloseTo(30, 5);
        },
      ),
    );
  });

  it('Extended SLA = receivedAt + 60 days', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2026-01-01'), max: new Date('2030-12-31') }),
        (received) => {
          const sla = calculateSLA(received, true);
          const diffDays = (sla.getTime() - received.getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeCloseTo(60, 5);
        },
      ),
    );
  });

  it('canExtend returns false when already extended', () => {
    expect(canExtend(true)).toBe(false);
    expect(canExtend(false)).toBe(true);
  });

  it('Overdue detection: deadline in past → badge overdue', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(getSLABadge(pastDeadline)).toBe('overdue');
  });

  it('Critical threshold: < 1 day remaining → badge red', () => {
    const deadline = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23h
    expect(getSLABadge(deadline)).toBe('red');
  });

  it('Warning threshold: < 7 days remaining → badge yellow', () => {
    const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
    expect(getSLABadge(deadline)).toBe('yellow');
  });

  it('Green badge: > 7 days remaining', () => {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    expect(getSLABadge(deadline)).toBe('green');
  });
});
