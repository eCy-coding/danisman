/**
 * P36-T09: AdminLayout with keyboard shortcuts (useAdminShortcuts)
 * P36-T10: Role-based UI gating wired via <Can> + useCan
 * M8: Mobile responsive — hamburger toggle at <768px
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { useAdminShortcuts, ALL_SHORTCUTS } from '../../../hooks/useAdminShortcuts';
import { X, Keyboard, Menu } from 'lucide-react';

const ShortcutsHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const byCategory = ALL_SHORTCUTS.reduce<Record<string, typeof ALL_SHORTCUTS>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      tabIndex={-1}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        role="document"
        className="relative bg-surface border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Keyboard size={16} className="text-secondary" aria-hidden="true" />
            <h2 id="shortcuts-modal-title" className="text-sm font-semibold text-white">
              Klavye Kısayolları
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {Object.entries(byCategory).map(([cat, shortcuts]) => (
          <div key={cat} className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              {cat}
            </p>
            <div className="space-y-1.5">
              {shortcuts.map((s) => (
                <div key={s.keys} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.description}</span>
                  <kbd className="text-xs font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-slate-300">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-slate-600 mt-4 text-center">
          G-sequenceleri giriş alanlarında çalışmaz · ESC'ye bas veya dışarı tıkla
        </p>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC = () => {
  const { helpModalOpen, setHelpModalOpen } = useAdminShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral text-slate-200 font-sans selection:bg-secondary/30 selection:text-white">
      {/* Mobile header — only visible below md breakpoint */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface sticky top-0 z-40">
        <button
          type="button"
          aria-label="Menüyü Aç"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          data-testid="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-300"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold text-white">eCyPro Admin</span>
        <div className="w-9" />
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <div
        id="admin-sidebar"
        className={[
          'fixed top-0 left-0 h-full z-50 transition-transform duration-200',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <AdminSidebar />
      </div>

      <main className="md:ml-64 min-h-screen p-4 md:p-8 bg-[url('/bg-grid.svg')] bg-fixed">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
      {helpModalOpen && <ShortcutsHelpModal onClose={() => setHelpModalOpen(false)} />}
    </div>
  );
};
