import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  /** Container height in px. Defaults to 480. */
  containerHeight?: number;
  /** Minimum row count to enable virtualisation. Below this, renders normally. */
  virtualThreshold?: number;
  getRowKey: (row: T, index: number) => string | number;
  emptyNode?: React.ReactNode;
  className?: string;
}

/**
 * M5 — VirtualTable
 * Renders large datasets efficiently with @tanstack/react-virtual.
 * Falls back to normal rendering when rows < virtualThreshold (default 100).
 */
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 480,
  virtualThreshold = 100,
  getRowKey,
  emptyNode,
  className = '',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const useVirtual = data.length >= virtualThreshold;

  if (data.length === 0) {
    return (
      <div className={`text-center py-12 text-slate-500 text-sm ${className}`}>
        {emptyNode ?? 'Veri bulunamadı'}
      </div>
    );
  }

  const headerRow = (
    <div className="flex border-b border-white/5 bg-surface-high sticky top-0 z-10" role="row">
      {columns.map((col) => (
        <div
          key={col.key}
          role="columnheader"
          className={`px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1 ${col.width ?? ''}`}
        >
          {col.header}
        </div>
      ))}
    </div>
  );

  if (!useVirtual) {
    return (
      <div role="table" aria-label="Data table" className={`overflow-auto ${className}`}>
        <div role="rowgroup">{headerRow}</div>
        <div role="rowgroup" data-testid="virtual-table-body">
          {data.map((row, i) => (
            <div
              key={getRowKey(row, i)}
              role="row"
              className="flex items-center border-b border-white/5 hover:bg-white/2 transition-colors"
              style={{ height: rowHeight }}
            >
              {columns.map((col) => (
                <div key={col.key} role="cell" className={`px-4 flex-1 ${col.width ?? ''}`}>
                  {col.render(row, i)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalHeight = virtualizer.getTotalSize();
  const items = virtualizer.getVirtualItems();

  return (
    <div role="table" aria-label="Data table" className={`overflow-hidden ${className}`}>
      <div role="rowgroup">{headerRow}</div>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        data-testid="virtual-table-scroll"
      >
        <div
          role="rowgroup"
          style={{ height: totalHeight, position: 'relative' }}
          data-testid="virtual-table-body"
        >
          {items.map((virtualRow) => {
            const row = data[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={getRowKey(row, virtualRow.index)}
                role="row"
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="flex items-center border-b border-white/5 hover:bg-white/2 absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)`, height: rowHeight }}
              >
                {columns.map((col) => (
                  <div key={col.key} role="cell" className={`px-4 flex-1 ${col.width ?? ''}`}>
                    {col.render(row, virtualRow.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
