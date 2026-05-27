import { describe, test, expect } from 'vitest';
import {
  calculateInvoice,
  calculateLateInterest,
  calculateSuccessFee,
  calculateMilestoneAmount,
} from './billing-calculator';

describe('Billing — Golden Cases (M2)', () => {
  // Golden 1: standard retainer, KDV only
  test('25K USD retainer + %20 KDV + %0 stopaj = 30K total', () => {
    expect(calculateInvoice({ subtotal: 25000, kdvRate: 0.2, stopajRate: 0 })).toEqual({
      subtotal: 25000,
      kdv: 5000,
      stopaj: 0,
      total: 30000,
    });
  });

  // Golden 2: KDV ve stopaj birbirini iptal eder (%20 KDV, %20 stopaj → net=subtotal)
  test('25K USD + %20 KDV + %20 stopaj = 25K total (stopaj nets out KDV)', () => {
    expect(calculateInvoice({ subtotal: 25000, kdvRate: 0.2, stopajRate: 0.2 })).toEqual({
      subtotal: 25000,
      kdv: 5000,
      stopaj: 5000,
      total: 25000,
    });
  });

  // Golden 3: Avans %30 — 50K USD retainer'ın ilk milestone faturası
  test('50K USD retainer Avans %30 = 15K USD milestone amount', () => {
    expect(calculateMilestoneAmount(50000, 0.3)).toBe(15000);
  });

  // Golden 4: geç ödeme faizi — TBK m.118, TCMB aylık %35 + %4 ek
  // monthly: (0.35 + 0.04) / 12 = 0.039 / 12 → nope
  // monthly: (0.35 + 0.04) / 12 = 0.3250 (yanlış)
  // DOĞRU: annual rate = %35 TCMB + %4 ek = %39 → monthly = 0.39/12 = 0.0325
  // daily = 0.0325 / 30 = 0.001083...
  // 10000 * 0.001083 * 30 = 325
  test('Late interest: 10K invoice, 30 days late, TCMB %35 annual = 325 USD', () => {
    const result = calculateLateInterest({
      invoiceTotal: 10000,
      daysLate: 30,
      tcmbAnnualRate: 0.35,
    });
    expect(result).toBe(325);
  });

  // Golden 5: success fee %2 on 150M USD M&A transaction
  test('M&A 150M USD transaction, %2 success fee = 3M USD', () => {
    expect(calculateSuccessFee(150_000_000, 0.02)).toBe(3_000_000);
  });

  // Golden 6: guard — success fee dışında range
  test('Success fee %0.5 → throws "Success fee %1-3 dışında"', () => {
    expect(() => calculateSuccessFee(1_000_000, 0.005)).toThrow('%1-3 dışında');
  });

  // Precision test: rounding to 2 decimals
  test('calculateInvoice rounds to 2 decimal places', () => {
    const result = calculateInvoice({ subtotal: 33333.33, kdvRate: 0.2, stopajRate: 0 });
    expect(result.kdv).toBe(6666.67);
    expect(result.total).toBe(40000);
  });

  // Edge case: zero KDV (e.g. export invoice)
  test('0% KDV + 0% stopaj = total equals subtotal', () => {
    expect(calculateInvoice({ subtotal: 10000, kdvRate: 0, stopajRate: 0 })).toEqual({
      subtotal: 10000,
      kdv: 0,
      stopaj: 0,
      total: 10000,
    });
  });

  // Golden: Final milestone %15 from 50K deal
  test('Final milestone %15 of 50K USD = 7.5K USD', () => {
    expect(calculateMilestoneAmount(50000, 0.15)).toBe(7500);
  });

  // TCMB rate table fallback
  test('getTCMBLateInterestRate returns 0.35 for 2026', async () => {
    const rate = await (
      await import('./billing-calculator')
    ).getTCMBLateInterestRate(new Date('2026-01-01'));
    expect(rate).toBe(0.35);
  });
});
