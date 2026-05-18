/**
 * P57.1 — Generic admin DataTable.
 *
 * Sort + filter + paginate + bulk select + row actions in a single primitive.
 * Türkçe-first; mobile responsive (column hide / card mode <768px).
 *
 * Usage:
 *   <DataTable
 *     columns={[{ key:'name', label:'Ad', sortable:true }, ...]}
 *     data={items}
 *     getId={(r) => r.id}
 *     onRowAction={(action, ids) => ...}
 *     actions={[{ key:'delete', label:'Sil', variant:'danger' }]}
 *   />
 */

import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  hideOnMobile?: boolean;
}

export interface BulkAction {
  key: string;
  label: string;
  variant?: 'primary' | 'danger' | 'default';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getId: (row: T) => string | number;
  selectable?: boolean;
  actions?: BulkAction[];
  onRowAction?: (action: string, ids: Array<string | number>) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

export function DataTable<T>({
  columns,
  data,
  getId,
  selectable = false,
  actions = [],
  onRowAction,
  onRowClick,
  pageSize = 20,
  emptyMessage = 'Henüz kayıt yok.',
  loading = false,
}: DataTableProps<T>): React.ReactElement {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        const v = (row as Record<string, unknown>)[c.key as string];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : 1;
      return dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    setSort((cur) => {
      if (!cur || cur.key !== key) return { key, dir: 'asc' };
      if (cur.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const allOnPageSelected = pageData.length > 0 && pageData.every((r) => selected.has(getId(r)));
  const togglePageSelection = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      for (const r of pageData) next.delete(getId(r));
    } else {
      for (const r of pageData) next.add(getId(r));
    }
    setSelected(next);
  };

  const toggleRowSelection = (id: string | number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Tabloda ara…"
          className="bg-neutral border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        <div className="text-xs text-slate-400">
          {sorted.length} kayıt · sayfa {page + 1}/{totalPages}
        </div>
        {selectable && selected.size > 0 && actions.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400 mr-2">{selected.size} seçili</span>
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => onRowAction?.(a.key, Array.from(selected))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  a.variant === 'danger'
                    ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                    : a.variant === 'primary'
                      ? 'bg-secondary text-neutral hover:bg-secondary/90'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] border-b border-white/5">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={togglePageSelection}
                    aria-label="Sayfadaki tüm satırları seç"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 ${
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''
                  } ${c.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(String(c.key))}
                      className="inline-flex items-center gap-1 hover:text-white"
                    >
                      {c.label}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp size={12} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={12} aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown size={12} aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              {onRowAction && <th className="w-10 px-3 py-3" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (onRowAction ? 1 : 0)} className="p-6 text-center text-slate-400 text-sm">
                  Yükleniyor…
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (onRowAction ? 1 : 0)} className="p-6 text-center text-slate-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const id = getId(row);
                return (
                  <tr
                    key={id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleRowSelection(id)}
                          aria-label="Satırı seç"
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={String(c.key)}
                        className={`px-3 py-3 text-slate-200 ${
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''
                        } ${c.hideOnMobile ? 'hidden md:table-cell' : ''} ${c.className ?? ''}`}
                      >
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? '')}
                      </td>
                    ))}
                    {onRowAction && (
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          aria-label="Satır eylemleri"
                          className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          <span className="text-xs text-slate-400">
            Sayfa {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
