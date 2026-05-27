import { describe, test, expect } from 'vitest';
import {
  calculateInvoice,
  calculateLateInterest,
  calculateSuccessFee,
  calculateMilestoneAmount,
} from './billing-calculator';

// Sabit seed: deterministik ama geniş değer uzayı
function pseudoRandom(seed: number): number {
  // xorshift32 tabanlı basit PRNG
  let s = seed;
  s ^= s << 13;
  s ^= s >> 17;
  s ^= s << 5;
  return (s >>> 0) / 0xffffffff;
}

describe('Billing Calculator — Fuzz (M2 Phase 2.5)', () => {
  /**
   * Test 1: İnvaryant — 500 rastgele (subtotal, kdvRate, stopajRate) kombinasyonu için
   * result.subtotal + result.kdv - result.stopaj === result.total
   */
  test('Invariant: subtotal + kdv - stopaj === total (500 rastgele kombinasyon)', () => {
    const ITERATIONS = 500;
    for (let i = 0; i < ITERATIONS; i++) {
      const r1 = pseudoRandom(i * 3 + 1);
      const r2 = pseudoRandom(i * 3 + 2);
      const r3 = pseudoRandom(i * 3 + 3);

      const subtotal = r1 * 1_000_000; // 0 – 1M USD
      const kdvRate = r2 * 0.25; // %0 – %25 KDV
      const stopajRate = r3 * 0.25; // %0 – %25 stopaj

      const result = calculateInvoice({ subtotal, kdvRate, stopajRate });
      const reconstructed = result.subtotal + result.kdv - result.stopaj;

      expect(
        Math.abs(reconstructed - result.total),
        `i=${i} subtotal=${subtotal.toFixed(2)} kdv=${kdvRate.toFixed(4)} stopaj=${stopajRate.toFixed(4)}`,
      ).toBeLessThan(0.01);
    }
  });

  /**
   * Test 2: Sıfır gün geç ödeme → 0
   */
  test('Zero days late → interest = 0', () => {
    const result = calculateLateInterest({
      invoiceTotal: 10000,
      daysLate: 0,
      tcmbAnnualRate: 0.35,
    });
    expect(result).toBe(0);
  });

  /**
   * Test 3: Monoton artış — daha fazla gün = daha fazla faiz
   */
  test('Monotonic: daysLate 30 < 60 < 90', () => {
    const base = { invoiceTotal: 100_000, tcmbAnnualRate: 0.35 };
    const i30 = calculateLateInterest({ ...base, daysLate: 30 });
    const i60 = calculateLateInterest({ ...base, daysLate: 60 });
    const i90 = calculateLateInterest({ ...base, daysLate: 90 });

    expect(i30).toBeGreaterThan(0);
    expect(i60).toBeGreaterThan(i30);
    expect(i90).toBeGreaterThan(i60);
  });

  /**
   * Test 4: Success fee guard — [0.01, 0.03] dışı throw, içi geçer
   * 200 geçersiz değer test edilir, 200 geçerli değer test edilir
   */
  test('Success fee guard: %1-3 dışı → throw, içi → geçer (200+200 değer)', () => {
    const outOfRange: number[] = [];
    const inRange: number[] = [];

    for (let i = 0; i < 200; i++) {
      // Geçersiz: 0 – 0.0099 arası
      outOfRange.push(pseudoRandom(i + 1000) * 0.0099);
    }
    for (let i = 0; i < 200; i++) {
      // Geçersiz: 0.0301 – 0.10 arası
      outOfRange.push(0.0301 + pseudoRandom(i + 2000) * 0.0699);
    }
    for (let i = 0; i < 200; i++) {
      // Geçerli: 0.01 – 0.03 arası
      inRange.push(0.01 + pseudoRandom(i + 3000) * 0.02);
    }

    for (const fee of outOfRange) {
      expect(() => calculateSuccessFee(1_000_000, fee), `fee=${fee}`).toThrow();
    }

    for (const fee of inRange) {
      expect(() => calculateSuccessFee(1_000_000, fee), `fee=${fee}`).not.toThrow();
    }
  });

  /**
   * Test 5: Ondalık hassasiyet — 0.1 + 0.2 tuzağı
   * Toplam tam olarak 2 ondalık basamağa yuvarlanmalı
   */
  test('Decimal precision: 0.1 + 0.2 subtotal rounds to exactly 2 decimals', () => {
    const result = calculateInvoice({
      subtotal: 0.1 + 0.2, // JavaScript float: 0.30000000000000004
      kdvRate: 0.2,
      stopajRate: 0,
    });

    const totalStr = String(result.total);
    const decimalPart = totalStr.includes('.') ? totalStr.split('.')[1] : '';
    expect(
      decimalPart.length,
      `total=${result.total} — ondalık basamak sayısı 2'yi geçmemeli`,
    ).toBeLessThanOrEqual(2);

    // IEEE754 pisliği değil, temiz değer bekliyoruz
    expect(result.total).not.toBe(0.30000000000000004 * 1.2);
    expect(result.total).toBeCloseTo(0.36, 10);
  });

  /**
   * Test 6 (bonus): Milestone sınır değerleri
   */
  test('Milestone: %0 → 0 TL, %100 → tam toplam ücret', () => {
    expect(calculateMilestoneAmount(100_000, 0)).toBe(0);
    expect(calculateMilestoneAmount(100_000, 1.0)).toBe(100_000);
  });
});
