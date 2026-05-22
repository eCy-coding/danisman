/**
 * P23 BE Track 2 / Aşama 3 — Priority helper unit tests.
 */

import { describe, it, expect } from 'vitest';
import { computeJobPriority, splitCapacity, poolForPriority, clampPriority } from './priority';

describe('computeJobPriority', () => {
  it('maps admin → 1', () => {
    expect(computeJobPriority('admin')).toBe(1);
    expect(computeJobPriority('ADMIN')).toBe(1);
  });
  it('maps paid tiers → 5', () => {
    expect(computeJobPriority('paid')).toBe(5);
    expect(computeJobPriority('PREMIUM')).toBe(5);
    expect(computeJobPriority('CONSULTANT')).toBe(5);
  });
  it('maps free / anonymous / unknown → 10', () => {
    expect(computeJobPriority('free')).toBe(10);
    expect(computeJobPriority('USER')).toBe(10);
    expect(computeJobPriority('anonymous')).toBe(10);
    expect(computeJobPriority(null)).toBe(10);
    expect(computeJobPriority(undefined)).toBe(10);
    expect(computeJobPriority('rogue')).toBe(10);
  });
});

describe('splitCapacity', () => {
  it('splits 10 workers 8/2 with default 20% reserve', () => {
    expect(splitCapacity(10)).toEqual({ hi: 8, lo: 2 });
  });
  it('honours custom reserveFraction', () => {
    expect(splitCapacity(10, 0.5)).toEqual({ hi: 5, lo: 5 });
  });
  it('guarantees at least 1 worker per pool when total > 1', () => {
    expect(splitCapacity(2)).toEqual({ hi: 1, lo: 1 });
    expect(splitCapacity(3, 0.1)).toEqual({ hi: 2, lo: 1 });
  });
  it('degenerates to single-pool when total = 1', () => {
    expect(splitCapacity(1)).toEqual({ hi: 1, lo: 0 });
  });
});

describe('poolForPriority', () => {
  it('routes priority ≤ 5 to hi pool', () => {
    expect(poolForPriority(1)).toBe('hi');
    expect(poolForPriority(5)).toBe('hi');
  });
  it('routes priority > 5 to lo pool', () => {
    expect(poolForPriority(6)).toBe('lo');
    expect(poolForPriority(10)).toBe('lo');
  });
});

describe('clampPriority', () => {
  it('keeps values in [1, 10]', () => {
    expect(clampPriority(0)).toBe(1);
    expect(clampPriority(-5)).toBe(1);
    expect(clampPriority(99)).toBe(10);
    expect(clampPriority(7)).toBe(7);
  });
  it('handles non-finite inputs', () => {
    expect(clampPriority(Number.NaN)).toBe(10);
    expect(clampPriority(Number.POSITIVE_INFINITY)).toBe(10);
  });
});
