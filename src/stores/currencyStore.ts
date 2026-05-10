/**
 * P39-T04: Currency Store — TRY / USD / EUR switching
 *
 * Architecture:
 *   - Zustand persistent store (localStorage key: "ecypro_currency")
 *   - ExchangeRate-API.com free tier (1500 req/month, ~50/day)
 *   - Cache: rates stored in localStorage with 24h TTL
 *   - Fallback: hardcoded rates if API unreachable
 *
 * Rate formula (pricing):
 *   displayPrice = Math.round(basePriceTRY / rate[TRY]) * rate[target]
 *   where rate[TRY] = 1 (base currency)
 *
 * Fallback rates (updated May 2026, conservative):
 *   1 TRY = 0.028 USD (TRY/USD = 35.7)
 *   1 TRY = 0.026 EUR (TRY/EUR = 38.5)
 *
 * Free tier limits:
 *   ExchangeRate-API: 1500 req/month = 50/day → max 1 rate fetch/user/day via TTL
 *
 * Usage:
 *   const { currency, setCurrency, formatPrice } = useCurrencyStore();
 *   formatPrice(15000) → "₺15.000" (TRY) | "$420" (USD) | "€390" (EUR)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'TRY' | 'USD' | 'EUR';

export interface CurrencyMeta {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  TRY: { code: 'TRY', symbol: '₺', name: 'Türk Lirası', locale: 'tr-TR' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
};

// Exchange rates relative to TRY (base)
// TRY→TRY = 1, TRY→USD = 1/35.7, TRY→EUR = 1/38.5
export interface Rates {
  TRY: 1;
  USD: number;
  EUR: number;
  fetchedAt: number; // Unix ms
}

// Fallback rates (hardcoded) if API unavailable
const FALLBACK_RATES: Rates = {
  TRY: 1,
  USD: 1 / 35.7, // ≈ 0.028
  EUR: 1 / 38.5, // ≈ 0.026
  fetchedAt: 0, // 0 = stale, will attempt refresh once
};

const RATE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CurrencyState {
  currency: Currency;
  rates: Rates;
  loading: boolean;
  error: string | null;

  // Actions
  setCurrency: (currency: Currency) => void;
  fetchRates: () => Promise<void>;
  formatPrice: (amountTRY: number) => string;
  convertPrice: (amountTRY: number) => number;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'TRY',
      rates: FALLBACK_RATES,
      loading: false,
      error: null,

      setCurrency: (currency) => {
        set({ currency });
        // Refresh rates if stale
        const { rates } = get();
        const age = Date.now() - rates.fetchedAt;
        if (age > RATE_TTL_MS) {
          get()
            .fetchRates()
            .catch(() => {});
        }
      },

      fetchRates: async () => {
        const { rates } = get();
        // Skip if fresh
        if (Date.now() - rates.fetchedAt < RATE_TTL_MS) return;

        set({ loading: true, error: null });
        try {
          // ExchangeRate-API free endpoint (no key needed for basic pairs)
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY', {
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = (await res.json()) as {
            rates: Record<string, number>;
            time_last_update_unix: number;
          };
          set({
            rates: {
              TRY: 1,
              USD: data.rates['USD'] ?? FALLBACK_RATES.USD,
              EUR: data.rates['EUR'] ?? FALLBACK_RATES.EUR,
              fetchedAt: Date.now(),
            },
            loading: false,
          });
        } catch (err) {
          set({
            error: (err as Error).message,
            loading: false,
            // Keep existing rates (don't reset to fallback on network error)
          });
        }
      },

      /**
       * Convert TRY amount to currently selected currency.
       * Rounds to nearest integer to avoid floating point display issues.
       */
      convertPrice: (amountTRY: number): number => {
        const { currency, rates } = get();
        if (currency === 'TRY') return amountTRY;
        const converted = amountTRY * rates[currency];
        // Round to nearest 5 for clean prices (e.g. $423 → $425)
        return Math.round(converted / 5) * 5;
      },

      /**
       * Format price for display in currently active currency.
       *
       * Examples (TRY=35.7, EUR=38.5):
       *   formatPrice(15000)  → "₺15.000"        (TRY)
       *   formatPrice(15000)  → "$420"            (USD, rounded to 5)
       *   formatPrice(15000)  → "€390"            (EUR, rounded to 5)
       *   formatPrice(50000)  → "$1.400"          (USD large)
       */
      formatPrice: (amountTRY: number): string => {
        const { currency, convertPrice } = get();
        const amount = convertPrice(amountTRY);
        const meta = CURRENCIES[currency];

        return new Intl.NumberFormat(meta.locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      },
    }),
    {
      name: 'ecypro_currency',
      partialize: (state) => ({
        currency: state.currency,
        rates: state.rates,
      }),
    },
  ),
);
