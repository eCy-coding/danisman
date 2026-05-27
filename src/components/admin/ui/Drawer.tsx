/**
 * P57.1 — Drawer primitive (slide-in from right).
 *
 * Detail panel + form drawer için. ESC kapatır, backdrop click kapatır.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const WIDTH_MAP: Record<NonNullable<DrawerProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  side = 'right',
  width = 'md',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-full ${WIDTH_MAP[width]} bg-neutral border-${side === 'right' ? 'l' : 'r'} border-white/15 shadow-2xl flex flex-col`}
      >
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          {title ? (
            <h2 id="drawer-title" className="text-base font-serif font-bold text-white">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <footer className="px-6 py-4 border-t border-white/5 flex justify-end gap-2">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
};

export default Drawer;
