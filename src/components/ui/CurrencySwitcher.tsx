/**
 * P39-T04: Currency Switcher Component
 *
 * Compact dropdown allowing TRY / USD / EUR selection.
 * Initializes rate fetch on mount (uses localStorage cache if fresh).
 * Accessible: keyboard navigable, aria-label, focus-visible.
 *
 * Usage:
 *   <CurrencySwitcher />   — place in Navbar, Pricing page header
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  useCurrencyStore,
  type Currency,
  CURRENCIES as CURRENCY_META,
} from '../../stores/currencyStore';
import { useReducedMotion } from 'motion/react';

const CURRENCY_LIST: Currency[] = ['TRY', 'USD', 'EUR'];

export const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency, fetchRates, loading: isLoading } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    void fetchRates();
  }, [fetchRates]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard: Escape closes
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = (c: Currency) => {
    setCurrency(c);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Para birimi: ${currency}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-xs font-mono font-medium"
        disabled={isLoading}
      >
        <span className="text-secondary">{CURRENCY_META[currency].symbol}</span>
        <span>{currency}</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-150 ${open && !prefersReduced ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Para birimi seçin"
          className="absolute right-0 mt-1 w-28 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {CURRENCY_LIST.map((c) => (
            <button
              type="button"
              key={c}
              role="option"
              aria-selected={c === currency}
              onClick={() => handleSelect(c)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono transition-colors text-left ${
                c === currency
                  ? 'bg-secondary/10 text-secondary font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-4 text-center">{CURRENCY_META[c].symbol}</span>
              <span>{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
