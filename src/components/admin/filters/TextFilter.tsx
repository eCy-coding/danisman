import React from 'react';
import { Search } from 'lucide-react';

interface TextFilterProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

export const TextFilter: React.FC<TextFilterProps> = ({
  value,
  onChange,
  placeholder = 'Ara...',
  label,
}) => (
  <div className="relative flex items-center">
    {label && <span className="sr-only">{label}</span>}
    <Search
      size={14}
      className="absolute left-3 text-slate-400 pointer-events-none"
      aria-hidden="true"
    />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      className="pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/20 w-full"
    />
  </div>
);
