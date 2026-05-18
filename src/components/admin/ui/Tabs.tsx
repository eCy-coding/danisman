/**
 * P57.1 — Tabs primitive (keyboard accessible).
 *
 * Türkçe-first; ARIA tablist + tabpanel.
 *
 * <Tabs items=[{ id, label, content }] defaultId="..." />
 */

import React, { useState, useRef } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  onChange?: (id: string) => void;
  variant?: 'default' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultId, onChange, variant = 'default' }) => {
  const [active, setActive] = useState(defaultId ?? items[0]?.id ?? '');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const len = items.length;
    let next = (idx + dir + len) % len;
    while (items[next]?.disabled) {
      next = (next + dir + len) % len;
      if (next === idx) break;
    }
    const nextId = items[next]?.id;
    if (nextId) {
      setActive(nextId);
      onChange?.(nextId);
      tabRefs.current[nextId]?.focus();
    }
  };

  const activeItem = items.find((i) => i.id === active);

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-white/5 mb-4">
        {items.map((item, idx) => {
          const isActive = item.id === active;
          const base =
            variant === 'pill'
              ? `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-secondary text-neutral'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              : `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-secondary text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              id={`tab-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setActive(item.id);
                onChange?.(item.id);
              }}
              onKeyDown={(e) => onKey(e, idx)}
              className={`${base} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem && (
        <div
          role="tabpanel"
          id={`tabpanel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
