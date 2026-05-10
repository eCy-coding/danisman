/**
 * P39-T04: currencyStore Unit Tests
 *
 * Tests the pure computation logic in useCurrencyStore:
 *   - convertPrice(amountTRY): TRY→TRY (identity), TRY→USD, TRY→EUR
 *   - formatPrice(amountTRY): Intl.NumberFormat output shape
 *   - Rounding invariant: convertPrice rounds to nearest 5
 *   - formatPrice zero-fraction-digits enforcement
 *
 * Zustand store mock strategy:
 *   We test store logic by creating a fresh store instance per-test
 *   using `useCurrencyStore.getState()` + `useCurrencyStore.setState()`.
 *   No React rendering needed (pure Zustand logic).
 *
 * Rate math verification (unit test values):
 *   Given USD rate = 1/35.7 ≈ 0.028011...
 *   15_000 TRY * 0.028011 = 420.17 → round to nearest 5 → 420
 *   50_000 TRY * 0.028011 = 1400.56 → round to nearest 5 → 1400
 *
 * These tests are deterministic — they override store rates directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCurrencyStore } from './currencyStore';

// Helper: set store to known state before each test
function setStoreRates(USD: number, EUR: number) {
  useCurrencyStore.setState({
    rates: { TRY: 1, USD, EUR, fetchedAt: Date.now() },
    loading: false,
    error: null,
  });
}

describe('currencyStore — convertPrice()', () => {
  beforeEach(() => {
    setStoreRates(1 / 35.7, 1 / 38.5);
    useCurrencyStore.setState({ currency: 'TRY' });
  });

  it('TRY→TRY is identity (no conversion)', () => {
    useCurrencyStore.setState({ currency: 'TRY' });
    const { convertPrice } = useCurrencyStore.getState();
    expect(convertPrice(15_000)).toBe(15_000);
    expect(convertPrice(0)).toBe(0);
  });

  it('TRY→USD: 15000 TRY at 1/35.7 → rounds to nearest 5', () => {
    useCurrencyStore.setState({ currency: 'USD' });
    setStoreRates(1 / 35.7, 1 / 38.5);
    const { convertPrice } = useCurrencyStore.getState();
    const result = convertPrice(15_000);
    // 15000 / 35.7 ≈ 420.17 → rounds to 420 (nearest 5)
    expect(result % 5).toBe(0); // always multiple of 5
    expect(result).toBeGreaterThan(400);
    expect(result).toBeLessThan(450);
  });

  it('TRY→EUR: 15000 TRY at 1/38.5 → rounds to nearest 5', () => {
    useCurrencyStore.setState({ currency: 'EUR' });
    setStoreRates(1 / 35.7, 1 / 38.5);
    const { convertPrice } = useCurrencyStore.getState();
    const result = convertPrice(15_000);
    // 15000 / 38.5 ≈ 389.6 → rounds to 390
    expect(result % 5).toBe(0);
    expect(result).toBeGreaterThan(370);
    expect(result).toBeLessThan(420);
  });

  it('large amount: 50000 TRY → USD rounds to nearest 5', () => {
    useCurrencyStore.setState({ currency: 'USD' });
    setStoreRates(1 / 35.7, 1 / 38.5);
    const { convertPrice } = useCurrencyStore.getState();
    const result = convertPrice(50_000);
    // 50000 / 35.7 ≈ 1400.56 → 1400
    expect(result % 5).toBe(0);
    expect(result).toBeGreaterThan(1300);
    expect(result).toBeLessThan(1500);
  });

  it('zero amount → always 0 regardless of currency', () => {
    for (const cur of ['TRY', 'USD', 'EUR'] as const) {
      useCurrencyStore.setState({ currency: cur });
      setStoreRates(1 / 35.7, 1 / 38.5);
      expect(useCurrencyStore.getState().convertPrice(0)).toBe(0);
    }
  });
});

describe('currencyStore — formatPrice()', () => {
  beforeEach(() => {
    setStoreRates(1 / 35.7, 1 / 38.5);
  });

  it('TRY: formatPrice contains ₺ symbol', () => {
    useCurrencyStore.setState({ currency: 'TRY' });
    const { formatPrice } = useCurrencyStore.getState();
    const result = formatPrice(15_000);
    expect(result).toContain('₺');
  });

  it('USD: formatPrice contains $ symbol', () => {
    useCurrencyStore.setState({ currency: 'USD' });
    setStoreRates(1 / 35.7, 1 / 38.5);
    const { formatPrice } = useCurrencyStore.getState();
    const result = formatPrice(15_000);
    expect(result).toContain('$');
  });

  it('EUR: formatPrice contains € symbol', () => {
    useCurrencyStore.setState({ currency: 'EUR' });
    setStoreRates(1 / 35.7, 1 / 38.5);
    const { formatPrice } = useCurrencyStore.getState();
    const result = formatPrice(15_000);
    expect(result).toContain('€');
  });

  it('formatPrice has zero decimal places (integer display)', () => {
    for (const cur of ['TRY', 'USD', 'EUR'] as const) {
      useCurrencyStore.setState({ currency: cur });
      setStoreRates(1 / 35.7, 1 / 38.5);
      const { formatPrice } = useCurrencyStore.getState();
      const result = formatPrice(15_000);
      // Ensure no fractional-cent suffix:
      //   USD/EUR use '.' as decimal separator → no ".XX" tail
      //   TRY uses ',' as decimal separator → no ",XX" tail
      //   Thousands separators (.000 in TR or ,000 in EN) are valid — only check tail
      expect(result).not.toMatch(/[.,]\d{2}$/);
    }
  });

  it('formatPrice output is a non-empty string', () => {
    useCurrencyStore.setState({ currency: 'TRY' });
    const { formatPrice } = useCurrencyStore.getState();
    const result = formatPrice(1490);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('currencyStore — setCurrency()', () => {
  it('setCurrency changes active currency', () => {
    const { setCurrency } = useCurrencyStore.getState();
    setCurrency('USD');
    expect(useCurrencyStore.getState().currency).toBe('USD');
    setCurrency('EUR');
    expect(useCurrencyStore.getState().currency).toBe('EUR');
    setCurrency('TRY');
    expect(useCurrencyStore.getState().currency).toBe('TRY');
  });
});

describe('currencyStore — CURRENCIES metadata', () => {
  it('TRY symbol is ₺', async () => {
    const { CURRENCIES } = await import('./currencyStore');
    expect(CURRENCIES.TRY.symbol).toBe('₺');
  });

  it('USD symbol is $', async () => {
    const { CURRENCIES } = await import('./currencyStore');
    expect(CURRENCIES.USD.symbol).toBe('$');
  });

  it('EUR symbol is €', async () => {
    const { CURRENCIES } = await import('./currencyStore');
    expect(CURRENCIES.EUR.symbol).toBe('€');
  });
});
