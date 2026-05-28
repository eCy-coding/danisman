import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightsFilter, TagAxis } from '@/types/insights';
import { insightsI18n } from '@/i18n/keys/insights';

interface SmartFilterProps {
  filter: InsightsFilter;
  onChange: (f: InsightsFilter) => void;
}

const SORT_OPTIONS: Array<{ value: NonNullable<InsightsFilter['sort']>; label: string }> = [
  { value: 'newest', label: insightsI18n.hub.sortNewest.tr },
  { value: 'popular', label: insightsI18n.hub.sortPopular.tr },
  { value: 'editors_pick', label: insightsI18n.hub.sortEditorsPick.tr },
  { value: 'trending', label: insightsI18n.hub.sortTrending.tr },
];

interface TagOption {
  slug: string;
  label: string;
  axis: TagAxis;
}

const AVAILABLE_TAGS: TagOption[] = [
  { slug: 'due-diligence', label: 'Due Diligence', axis: 'FORMAT' },
  { slug: 'dcf', label: 'DCF', axis: 'FORMAT' },
  { slug: 'checklist', label: 'Kontrol Listesi', axis: 'FORMAT' },
  { slug: 'case-study', label: 'Vaka', axis: 'FORMAT' },
  { slug: 'cfo', label: 'CFO', axis: 'AUDIENCE' },
  { slug: 'yonetim-kurulu', label: 'Yönetim Kurulu', axis: 'AUDIENCE' },
  { slug: 'kucuk-isletme', label: 'KOBİ', axis: 'AUDIENCE' },
  { slug: 'istanbul', label: 'İstanbul', axis: 'GEO' },
  { slug: 'turkiye', label: 'Türkiye', axis: 'GEO' },
  { slug: 'ab', label: 'AB', axis: 'GEO' },
  { slug: 'teknoloji', label: 'Teknoloji', axis: 'SECTOR' },
  { slug: 'enerji', label: 'Enerji', axis: 'SECTOR' },
  { slug: 'perakende', label: 'Perakende', axis: 'SECTOR' },
  { slug: 'bddk', label: 'BDDK', axis: 'REG' },
  { slug: 'csrd', label: 'CSRD', axis: 'REG' },
  { slug: 'spk', label: 'SPK', axis: 'REG' },
  { slug: 'yapay-zeka', label: 'Yapay Zeka', axis: 'TREND' },
  { slug: 'karbon', label: 'Karbon', axis: 'TREND' },
  { slug: 'dijital-donusum', label: 'Dijital Dönüşüm', axis: 'TREND' },
];

const AXIS_ORDER: TagAxis[] = ['FORMAT', 'AUDIENCE', 'GEO', 'SECTOR', 'REG', 'TREND'];

export function SmartFilter({ filter, onChange }: SmartFilterProps) {
  const [searchValue, setSearchValue] = useState(filter.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const i18n = insightsI18n.hub;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange({ ...filter, search: value || undefined, cursor: undefined });
      }, 300);
    },
    [filter, onChange],
  );

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sort = e.target.value as InsightsFilter['sort'];
    const updated = { ...filter, sort, cursor: undefined };
    onChange(updated);
    syncURL(updated);
  }

  function handleTagToggle(slug: string) {
    const current = filter.tags ?? [];
    const next = current.includes(slug) ? current.filter((t) => t !== slug) : [...current, slug];
    const updated = { ...filter, tags: next.length ? next : undefined, cursor: undefined };
    onChange(updated);
  }

  function clearAll() {
    const updated: InsightsFilter = { sort: filter.sort };
    setSearchValue('');
    onChange(updated);
    syncURL(updated);
  }

  function saveFilter() {
    syncURL(filter);
  }

  function syncURL(f: InsightsFilter) {
    const params = new URLSearchParams();
    if (f.domain) params.set('domain', f.domain);
    if (f.search) params.set('q', f.search);
    if (f.sort && f.sort !== 'newest') params.set('sort', f.sort);
    if (f.tags?.length) params.set('tags', f.tags.join(','));
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }

  const activeTagCount = (filter.tags?.length ?? 0) + (filter.search ? 1 : 0);

  const tagsByAxis = AXIS_ORDER.reduce<Record<TagAxis, TagOption[]>>(
    (acc, axis) => {
      acc[axis] = AVAILABLE_TAGS.filter((t) => t.axis === axis);
      return acc;
    },
    {} as Record<TagAxis, TagOption[]>,
  );

  return (
    <div className="bg-white border-b border-slate-200 py-4" data-testid="smart-filter">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={i18n.searchPlaceholder.tr}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              data-testid="search-input"
            />
          </div>

          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={filter.sort ?? 'newest'}
              onChange={handleSortChange}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {activeTagCount > 0 && (
            <span
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"
              data-testid="active-filter-count"
            >
              {activeTagCount} aktif filtre
              <button onClick={clearAll} aria-label="Filtreleri temizle">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={saveFilter}
            className="ml-auto text-xs text-slate-500 hover:text-amber-700 transition-colors"
            data-testid="save-filter-btn"
          >
            {i18n.filterSave.tr}
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          {AXIS_ORDER.map((axis) => (
            <div key={axis} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {i18n.tagAxes[axis].tr}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tagsByAxis[axis].map((tag) => {
                  const isActive = filter.tags?.includes(tag.slug) ?? false;
                  return (
                    <button
                      key={tag.slug}
                      onClick={() => handleTagToggle(tag.slug)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                      data-testid={`tag-chip-${tag.slug}`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
