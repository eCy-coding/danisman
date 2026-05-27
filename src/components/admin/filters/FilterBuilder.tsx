import React from 'react';
import { X } from 'lucide-react';

export interface FilterBuilderProps {
  children: React.ReactNode;
  activeCount?: number;
  onClearAll?: () => void;
}

/**
 * M7 — FilterBuilder: composable filter container.
 * Wraps TextFilter, SelectFilter, DateRangeFilter, MultiSelectFilter.
 * Shows active filter count badge and clear button.
 */
export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  children,
  activeCount = 0,
  onClearAll,
}) => (
  <div
    className="flex flex-wrap items-center gap-3 py-3 px-4 border-b border-white/5"
    role="search"
    aria-label="Filtreler"
  >
    {children}
    {activeCount > 0 && onClearAll && (
      <button
        type="button"
        onClick={onClearAll}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
        aria-label={`Tüm filtreleri temizle (${activeCount} aktif)`}
      >
        <X size={12} aria-hidden="true" />
        {activeCount} filtre temizle
      </button>
    )}
  </div>
);
