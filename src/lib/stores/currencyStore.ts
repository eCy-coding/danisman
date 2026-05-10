/**
 * P39-T04: Currency Store — Zustand
 *
 * Manages currency selection (TRY / USD / EUR) with:
 *   - Rate fetching from ExchangeRate-API (free tier: 1500 req/month)
 *   - LocalStorage persistence (last used currency + cached rates)
 *   - Daily cache expiration (rates don't change intra-day)
 *   - Geolocation-based auto-detect (browser Intl)
 *
 * Usage:
 *   const { currency, rates, convert, setCurrency } = useCurrencyStore();
 *   convert(1000, 'TRY') → 28.5 (in USD at current rate)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'TRY' | 'USD' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  TRY: 'Türk Lirası',
  USD: 'US Dollar',
  EUR: 'Euro',
};

// Default fallback rates (when API unavailable) — updated May 2026
const FALLBACK_RATES: Record<Currency, number> = {
  TRY: 1,
  USD: 0.028, // 1 TRY ≈ 0.028 USD
  EUR: 0.026, // 1 TRY ≈ 0.026 EUR
};

interface RateCache {
  rates: Record<Currency, number>;
  fetchedAt: number; // Unix ms
}

interface CurrencyState {
  currency: Currency;
  rates: Record<Currency, number>;
  isLoading: boolean;
  lastError: string | null;
  setCurrency: (c: Currency) => void;
  fetchRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to?: Currency) => number;
  format: (amount: number, from: Currency, to?: Currency) => string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

function detectDefaultCurrency(): Currency {
  try {
    const locale = navigator.language || 'en-US';
    if (locale.startsWith('tr')) return 'TRY';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (tz.startsWith('Europe/Istanbul') || tz.startsWith('Turkey')) return 'TRY';
    if (['EUR', 'DE', 'FR', 'IT', 'ES'].some((k) => locale.includes(k))) return 'EUR';
  } catch {
    // Browser may block timezone API
  }
  return 'USD';
}

function loadCachedRates(): Record<Currency, number> | null {
  try {
    const raw = localStorage.getItem('ecypro_currency_rates');
    if (!raw) return null;
    const cache: RateCache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache.rates;
  } catch {
    return null;
  }
}

function saveCachedRates(rates: Record<Currency, number>): void {
  try {
    const cache: RateCache = { rates, fetchedAt: Date.now() };
    localStorage.setItem('ecypro_currency_rates', JSON.stringify(cache));
  } catch {
    // Storage quota or security policy
  }
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: detectDefaultCurrency(),
      rates: loadCachedRates() ?? FALLBACK_RATES,
      isLoading: false,
      lastError: null,

      setCurrency: (c) => set({ currency: c }),

      fetchRates: async () => {
        const cached = loadCachedRates();
        if (cached) {
          set({ rates: cached });
          return;
        }

        set({ isLoading: true, lastError: null });
        try {
          const res = await fetch(`${RATE_API_BASE}/TRY`, {
            signal: AbortSignal.timeout(8_000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { rates?: Record<string, number> };
          const apiRates = data.rates ?? {};

          const rates: Record<Currency, number> = {
            TRY: 1,
            USD: 1 / (apiRates['USD'] ?? 1 / FALLBACK_RATES.USD),
            EUR: 1 / (apiRates['EUR'] ?? 1 / FALLBACK_RATES.EUR),
          };

          saveCachedRates(rates);
          set({ rates, isLoading: false });
        } catch (err) {
          set({ isLoading: false, lastError: (err as Error).message, rates: FALLBACK_RATES });
        }
      },

      convert: (amount, from, to) => {
        const { rates, currency } = get();
        const target = to ?? currency;
        if (from === target) return amount;
        const amountInTRY = from === 'TRY' ? amount : amount / rates[from];
        return target === 'TRY' ? amountInTRY : amountInTRY * rates[target];
      },

      format: (amount, from, to) => {
        const { convert, currency } = get();
        const target = to ?? currency;
        const converted = convert(amount, from, target);
        const symbol = CURRENCY_SYMBOLS[target];
        return `${symbol}${converted.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
      },
    }),
    {
      name: 'ecypro-currency',
      partialize: (state) => ({ currency: state.currency }),
    },
  ),
);
