/**
 * P23/T1 — Backoff math + lifecycle dummy testleri.
 *
 * EventSource jsdom'da yok; bu yüzden saf fonksiyon `computeBackoff` üzerinden
 * matematiksel doğruluk sınanır. Lifecycle testleri Playwright E2E'ye taşınır.
 */
import { describe, it, expect } from 'vitest';
import { computeBackoff } from './sse-client';

describe('computeBackoff', () => {
  it('attempt=0 base+jitter aralığında', () => {
    const d0 = computeBackoff(0, 1000, 32000, 1000, () => 0);
    const d1 = computeBackoff(0, 1000, 32000, 1000, () => 1);
    expect(d0).toBe(1000);
    expect(d1).toBe(2000);
  });

  it('attempt monoton (lineer interp arasında)', () => {
    const random = () => 0; // jitter sıfır
    const seq = [0, 1, 2, 3, 4, 5].map((n) => computeBackoff(n, 1000, 32000, 1000, random));
    expect(seq).toEqual([1000, 2000, 4000, 8000, 16000, 32000]);
  });

  it('maxDelay saturasyonu', () => {
    const random = () => 0;
    const d10 = computeBackoff(10, 1000, 32000, 1000, random);
    const d20 = computeBackoff(20, 1000, 32000, 1000, random);
    expect(d10).toBe(32000);
    expect(d20).toBe(32000);
  });

  it('negatif attempt = 0', () => {
    expect(computeBackoff(-5, 1000, 32000, 1000, () => 0)).toBe(1000);
  });

  it('jitter clip [0,1]', () => {
    // random > 1 → 1'e kırpılır, < 0 → 0
    expect(computeBackoff(0, 1000, 32000, 1000, () => 5)).toBe(2000);
    expect(computeBackoff(0, 1000, 32000, 1000, () => -3)).toBe(1000);
  });

  it('floor sonuç tamsayı', () => {
    const d = computeBackoff(2, 1000, 32000, 1000, () => 0.3333);
    expect(Number.isInteger(d)).toBe(true);
  });
});
