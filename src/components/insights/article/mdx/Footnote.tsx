import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FootnoteProps {
  id: string;
  children: React.ReactNode;
}

export function Footnote({ id, children }: FootnoteProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span className="relative inline-block" data-testid={`footnote-${id}`}>
      <button
        type="button"
        className="cursor-pointer text-amber-600 hover:text-amber-800 font-semibold transition-colors select-none align-super text-xs leading-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-describedby={`footnote-tooltip-${id}`}
      >
        [{id}]
      </button>
      {showTooltip && (
        <span
          id={`footnote-tooltip-${id}`}
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
            'w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg',
            'pointer-events-none',
          )}
          data-testid={`footnote-tooltip-${id}`}
        >
          {children}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
