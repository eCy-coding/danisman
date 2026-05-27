import React from 'react';
import { cn } from '../../../lib/utils';
import type { Currency } from '../../../types/revenue';

interface CurrencyToggleProps {
  value: Currency;
  onChange: (c: Currency) => void;
}

const CURRENCIES: Currency[] = ['USD', 'TRY', 'EUR'];

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div
      data-testid="currency-toggle"
      className="flex items-center gap-fib-3 rounded-md bg-[#2A2B2C] p-fib-2"
    >
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          data-testid={`currency-btn-${c}`}
          onClick={() => onChange(c)}
          className={cn(
            'rounded px-fib-4 py-fib-2 text-sm font-medium transition-colors',
            value === c ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF] hover:text-white',
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
