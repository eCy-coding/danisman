import React from 'react';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (v: DateRange) => void;
  fromLabel?: string;
  toLabel?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  fromLabel = 'Başlangıç',
  toLabel = 'Bitiş',
}) => (
  <div className="flex items-center gap-2">
    <input
      type="date"
      value={value.from}
      onChange={(e) => onChange({ ...value, from: e.target.value })}
      aria-label={fromLabel}
      className="px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
    />
    <span className="text-slate-500 text-xs">—</span>
    <input
      type="date"
      value={value.to}
      min={value.from}
      onChange={(e) => onChange({ ...value, to: e.target.value })}
      aria-label={toLabel}
      className="px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
    />
  </div>
);
