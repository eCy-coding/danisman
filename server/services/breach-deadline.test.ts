import { describe, it, expect } from 'vitest';
import { calculateBreachDeadline, isBreachOverdue } from './breach-deadline';

describe('72h Breach Deadline', () => {
  it('deadline = detectedAt + exactly 72 hours', () => {
    const detected = new Date('2026-05-26T10:00:00Z');
    const deadline = calculateBreachDeadline(detected);
    const diffHours = (deadline.getTime() - detected.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBe(72);
  });

  it('DST boundary: 2026-03-28T00:00:00 CET + 72h → correct (timestamp math, not calendar)', () => {
    // Use timestamps (not calendar day addition) — immune to DST
    const detected = new Date('2026-03-28T00:00:00+01:00');
    const deadline = calculateBreachDeadline(detected);
    const diffMs = deadline.getTime() - detected.getTime();
    expect(diffMs).toBe(72 * 60 * 60 * 1000);
  });

  it('Year boundary: breach 2026-12-31T23:00:00Z → deadline 2027-01-03T23:00:00Z', () => {
    const detected = new Date('2026-12-31T23:00:00Z');
    const deadline = calculateBreachDeadline(detected);
    expect(deadline.toISOString()).toBe('2027-01-03T23:00:00.000Z');
  });

  it('Already reported: isBreachOverdue returns false when now < deadline', () => {
    const detected = new Date(Date.now() - 1000);
    const deadline = calculateBreachDeadline(detected); // deadline is in future
    expect(isBreachOverdue(deadline, new Date(detected.getTime() + 1000))).toBe(false);
  });
});
