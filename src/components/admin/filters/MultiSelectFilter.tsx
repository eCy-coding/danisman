import React, { useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  value: string[];
  onChange: (v: string[]) => void;
  options: Option[];
  label: string;
  placeholder?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seçin...',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div ref={containerRef} className="relative" data-testid="multi-select">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none hover:border-white/20 min-w-[120px]"
      >
        <span className="flex-1 text-left truncate">
          {value.length > 0 ? `${value.length} seçili` : placeholder}
        </span>
        {value.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Seçimi temizle"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                onChange([]);
              }
            }}
            className="text-slate-400 hover:text-white"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown size={12} className="text-slate-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          aria-multiselectable="true"
          className="absolute top-full mt-1 left-0 z-50 min-w-[160px] bg-surface border border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={value.includes(o.value)}
              onClick={() => toggle(o.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggle(o.value);
              }}
              tabIndex={0}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                value.includes(o.value)
                  ? 'text-white bg-white/10'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex-shrink-0 ${value.includes(o.value) ? 'bg-white/80 border-white/80' : 'border-white/20'}`}
              />
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
