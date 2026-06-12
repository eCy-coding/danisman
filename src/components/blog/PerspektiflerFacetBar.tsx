import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { FacetOption, HubFilter } from '@/lib/perspektifler';
import { BLOG_CATEGORY_META, type BlogCategory } from '@/types/blog';

interface FacetBarProps {
  filter: HubFilter;
  options: { kategoriler: FacetOption[]; formatlar: FacetOption[]; yillar: FacetOption[] };
  resultCount: number;
  /** Category facet is hidden on pillar pages (pre-locked). */
  lockCategory?: boolean;
  onChange: (next: Partial<HubFilter>) => void;
}

const SORT_OPTIONS: { value: HubFilter['sirala']; label: string }[] = [
  { value: 'yeni', label: 'En Yeni' },
  { value: 'eski', label: 'En Eski' },
  { value: 'az', label: 'A–Z' },
];

function SelectFacet({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value?: string;
  options: FacetOption[];
  onChange: (v: string | undefined) => void;
  allLabel: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span className="uppercase tracking-wider">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="bg-[#11141d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
    </label>
  );
}

function FacetGroups({
  filter,
  options,
  lockCategory,
  onChange,
}: Omit<FacetBarProps, 'resultCount'>) {
  return (
    <>
      {!lockCategory && options.kategoriler.length > 0 && (
        <div className="w-full">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Kategori</p>
          <ul className="flex flex-wrap gap-2">
            {options.kategoriler.map((cat) => {
              const active = filter.kategori === cat.value;
              const meta = BLOG_CATEGORY_META[cat.label as BlogCategory];
              return (
                <li key={cat.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ kategori: active ? undefined : cat.value, page: 1 })}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-secondary/60 outline-none ${
                      active
                        ? `${meta?.border ?? 'border-blue-400'} ${meta?.bg ?? 'bg-blue-500/20'} ${meta?.color ?? 'text-blue-100'}`
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {cat.label}{' '}
                    <span className="tabular-nums text-[10px] opacity-70">{cat.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <SelectFacet
          label="Format"
          allLabel="Tümü"
          value={filter.format}
          options={options.formatlar}
          onChange={(v) => onChange({ format: v, page: 1 })}
        />
        <SelectFacet
          label="Yıl"
          allLabel="Tümü"
          value={filter.yil}
          options={options.yillar}
          onChange={(v) => onChange({ yil: v, page: 1 })}
        />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span className="uppercase tracking-wider">Sıralama</span>
          <select
            value={filter.sirala}
            onChange={(e) => onChange({ sirala: e.target.value as HubFilter['sirala'], page: 1 })}
            className="bg-[#11141d] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

/** Sticky facet bar — desktop updates live; mobile opens a bottom sheet with
 *  an explicit "N Sonucu Göster" apply step (Baymard pattern). */
export const PerspektiflerFacetBar: React.FC<FacetBarProps> = (props) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { filter, resultCount, onChange } = props;
  const activeCount = [filter.kategori, filter.format, filter.konu, filter.yil, filter.q].filter(
    Boolean,
  ).length;

  return (
    <div
      data-testid="perspektifler-facet-bar"
      className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-[#050810]/95 border-b border-white/5 mb-8"
    >
      {/* Desktop: live facets */}
      <div className="hidden md:flex flex-col gap-3">
        <FacetGroups {...props} />
        <p className="text-[11px] text-slate-500" role="status">
          {resultCount} içgörü
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  kategori: props.lockCategory ? filter.kategori : undefined,
                  format: undefined,
                  konu: undefined,
                  yil: undefined,
                  q: undefined,
                  page: 1,
                })
              }
              className="ml-3 underline hover:text-white"
            >
              Filtreleri temizle
            </button>
          )}
        </p>
      </div>

      {/* Mobile: bottom sheet trigger */}
      <div className="md:hidden flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal size={14} />
          Filtrele{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <span className="text-[11px] text-slate-500">{resultCount} içgörü</span>
      </div>

      {sheetOpen && (
        <div role="dialog" aria-modal="true" aria-label="Filtreler" className="md:hidden">
          <button
            type="button"
            aria-label="Filtreleri kapat"
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed bottom-0 inset-x-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-[#0a0f1c] border-t border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Filtreler</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Kapat"
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <FacetGroups {...props} />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="w-full btn-premium-gold rounded-lg py-3 text-sm font-bold"
            >
              {resultCount} Sonucu Göster
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
