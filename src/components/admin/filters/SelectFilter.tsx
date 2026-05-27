import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectFilterProps {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  label: string;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seçin...',
  label,
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
  >
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
