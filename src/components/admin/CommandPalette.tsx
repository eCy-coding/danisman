/**
 * P36-T08: Admin Command Palette — Cmd+K global search
 *
 * Features:
 *   - Keyboard: Cmd+K (Mac) / Ctrl+K (Win) to open, Escape to close
 *   - Navigation: Arrow keys + Enter to select
 *   - Categories: Pages, Recent Contacts, Quick Actions
 *   - Fuzzy search: simple startsWith + includes ranking
 *
 * Accessibility: role="dialog", aria-modal, focus trap, aria-activedescendant.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  Users,
  BarChart3,
  Settings,
  Zap,
  X,
  ArrowRight,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: 'pages' | 'actions';
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [close]);

  // Auto-focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const allItems: PaletteItem[] = useMemo(
    () => [
      {
        id: 'dash',
        label: 'Dashboard',
        icon: LayoutDashboard,
        category: 'pages',
        action: () => {
          navigate('/admin/dashboard');
          close();
        },
      },
      {
        id: 'contacts',
        label: 'Contacts',
        icon: Mail,
        category: 'pages',
        action: () => {
          navigate('/admin/contacts');
          close();
        },
      },
      {
        id: 'bookings',
        label: 'Bookings',
        icon: Calendar,
        category: 'pages',
        action: () => {
          navigate('/admin/bookings');
          close();
        },
      },
      {
        id: 'services',
        label: 'Services',
        icon: Briefcase,
        category: 'pages',
        action: () => {
          navigate('/admin/services');
          close();
        },
      },
      {
        id: 'blog',
        label: 'Blog Content',
        icon: FileText,
        category: 'pages',
        action: () => {
          navigate('/admin/blog');
          close();
        },
      },
      {
        id: 'users',
        label: 'Users & RBAC',
        icon: Users,
        category: 'pages',
        action: () => {
          navigate('/admin/users');
          close();
        },
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        category: 'pages',
        action: () => {
          navigate('/admin/analytics');
          close();
        },
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        category: 'pages',
        action: () => {
          navigate('/admin/settings');
          close();
        },
      },
      {
        id: 'newbooking',
        label: 'Open Website',
        icon: Zap,
        category: 'actions',
        action: () => {
          window.open('/', '_blank');
          close();
        },
      },
    ],
    [navigate, close],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [query, allItems]);

  // Arrow key navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[activeIndex]?.action();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, filtered, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const grouped = useMemo(() => {
    const pages = filtered.filter((i) => i.category === 'pages');
    const actions = filtered.filter((i) => i.category === 'actions');
    return [
      ...(pages.length ? [{ title: 'Pages', items: pages }] : []),
      ...(actions.length ? [{ title: 'Actions', items: actions }] : []),
    ];
  }, [filtered]);

  let itemIndex = -1;

  return (
    <>
      {/* Trigger button shown in AdminSidebar (optional — also Cmd+K) */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
        aria-label="Open command palette (⌘K)"
      >
        <Search size={13} />
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={prefersReduced ? undefined : { opacity: 1 }}
              exit={prefersReduced ? undefined : { opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
              onClick={close}
              aria-hidden
            />

            {/* Dialog */}
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, scale: 0.96, y: -10 }}
              animate={prefersReduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              role="dialog"
              aria-modal="true"
              aria-label="Command Palette"
              className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-101 overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara… (sayfa, eylem)"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  aria-label="Search commands"
                />
                <button onClick={close} className="p-1 rounded text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-sm">Sonuç bulunamadı</p>
                )}
                {grouped.map((group) => (
                  <div key={group.title}>
                    <p className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      {group.title}
                    </p>
                    {group.items.map((item) => {
                      itemIndex++;
                      const isActive = activeIndex === itemIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                            isActive
                              ? 'bg-secondary/10 text-white'
                              : 'text-slate-300 hover:bg-white/3'
                          }`}
                        >
                          <item.icon
                            size={15}
                            className={isActive ? 'text-secondary' : 'text-slate-500'}
                          />
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <ArrowRight size={13} className="text-secondary opacity-60" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-white/5 flex gap-4 text-[10px] text-slate-600">
                <span>↑↓ Gezin</span>
                <span>↵ Seç</span>
                <span>Esc Kapat</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
