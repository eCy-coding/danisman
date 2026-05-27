/**
 * ROPALegalBasisDropdown — KVKK m.5 legal basis selector.
 *
 * Displays the five KVKK Article 5 processing bases used in the ROPA inventory.
 * The selected value is the KVKK article code (e.g. "KVKK m.5/1").
 */

import React from 'react';
import { cn } from '../../../lib/utils';

const LEGAL_BASIS_OPTIONS: { value: string; label: string }[] = [
  { value: 'KVKK m.5/1', label: 'Açık Rıza' },
  { value: 'KVKK m.5/2-a', label: 'Kanuni Yükümlülük' },
  { value: 'KVKK m.5/2-c', label: 'Sözleşme' },
  { value: 'KVKK m.5/2-f', label: 'Meşru Menfaat' },
  { value: 'KVKK m.5/2-c + m.5/2-f', label: 'Sözleşme + Meşru Menfaat' },
];

interface ROPALegalBasisDropdownProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function ROPALegalBasisDropdown({
  value,
  onChange,
  disabled = false,
}: ROPALegalBasisDropdownProps) {
  return (
    <div className="flex flex-col gap-fib-2">
      <label
        htmlFor="ropa-legal-basis"
        className="text-xs font-medium text-zinc-400 uppercase tracking-wider"
      >
        Hukuki Dayanak
      </label>
      <select
        id="ropa-legal-basis"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-white/10 bg-zinc-900 px-fib-4 py-fib-3',
          'text-sm text-zinc-100 outline-none transition-colors',
          'focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <option value="" disabled>
          Hukuki dayanak seçin…
        </option>
        {LEGAL_BASIS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.value} — {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
