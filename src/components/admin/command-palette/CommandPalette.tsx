/**
 * M1 — Admin Command Palette (cmdk-based rebuild)
 *
 * - Cmd+K (Mac) / Ctrl+K (Win) → open, ESC → close
 * - Role="dialog" aria-modal, aria-label="Komut Paleti"
 * - Solid surface (no backdrop-blur — AI Studio Tech doctrine)
 * - Commands sourced from COMMAND_REGISTRY, useNavigate for path commands
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandEmpty, CommandInput, CommandList } from 'cmdk';
import { CommandGroup } from './CommandGroup';
import { COMMAND_REGISTRY, type CommandDef } from '../../../lib/command-registry';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Sayfalar',
  action: 'İşlemler',
  entity: 'Kayıtlar',
  recent: 'Son Kullanılanlar',
};

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = useCallback(() => setOpen(false), []);

  // Keyboard shortcuts: Cmd+K / Ctrl+K open, Escape close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = useCallback(
    (cmd: CommandDef) => {
      close();
      if (cmd.path) {
        navigate(cmd.path);
      } else if (cmd.id === 'action-open-website') {
        window.open('/', '_blank', 'noopener,noreferrer');
      }
      // Other action commands would trigger their runtime-provided handlers
    },
    [close, navigate],
  );

  const navCommands = COMMAND_REGISTRY.filter((c) => c.category === 'navigation');
  const actionCommands = COMMAND_REGISTRY.filter((c) => c.category === 'action');
  const entityCommands = COMMAND_REGISTRY.filter((c) => c.category === 'entity');
  const recentCommands = COMMAND_REGISTRY.filter((c) => c.category === 'recent');

  if (!open) return null;

  return (
    <>
      {/* Overlay — solid surface, no backdrop-blur (doctrine) */}
      <div className="bg-black/70 fixed inset-0 z-[9998]" aria-hidden="true" onClick={close} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Komut Paleti"
        className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl px-4"
      >
        <Command
          className="bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          loop
        >
          <CommandInput
            placeholder="Komut ara..."
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-sm px-4 py-3 border-b border-white/5"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                close();
              }
            }}
          />

          <CommandList className="max-h-80 overflow-y-auto py-2">
            <CommandEmpty className="text-center py-6 text-slate-500 text-sm">
              Sonuç bulunamadı
            </CommandEmpty>

            <CommandGroup
              heading={CATEGORY_LABELS.recent ?? ''}
              commands={recentCommands}
              onSelect={handleSelect}
            />
            <CommandGroup
              heading={CATEGORY_LABELS.navigation ?? ''}
              commands={navCommands}
              onSelect={handleSelect}
            />
            <CommandGroup
              heading={CATEGORY_LABELS.action ?? ''}
              commands={actionCommands}
              onSelect={handleSelect}
            />
            <CommandGroup
              heading={CATEGORY_LABELS.entity ?? ''}
              commands={entityCommands}
              onSelect={handleSelect}
            />
          </CommandList>

          <div className="px-4 py-2 border-t border-white/5 flex gap-4 text-[10px] text-slate-600">
            <span>↑↓ Gezin</span>
            <span>↵ Seç</span>
            <span>Esc Kapat</span>
          </div>
        </Command>
      </div>
    </>
  );
};
