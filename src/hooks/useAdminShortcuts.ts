/**
 * P36-T09: useAdminShortcuts — Admin Panel Keyboard Shortcut System
 *
 * Implements vim-inspired key sequences + single-key shortcuts.
 *
 * Shortcut taxonomy:
 *   G+<key>  = "Go to" navigation (vim-style leader key)
 *   N        = "New" (context-aware: page-specific new action)
 *   ?        = Help modal (lists all shortcuts)
 *   Escape   = Close modal / cancel
 *   Cmd+K    = Command Palette (handled by CommandPalette component)
 *
 * Implementation:
 *   G-sequence: stateful—first keydown G sets pending=true,
 *   next keydown within 1000ms triggers navigation.
 *   Prevents conflict with inputs/textareas (event.target check).
 *
 * Shortcut table:
 *   G → D   = /admin/dashboard
 *   G → B   = /admin/bookings
 *   G → C   = /admin/contacts
 *   G → N   = /admin/newsletter
 *   G → S   = /admin/services
 *   G → U   = /admin/users
 *   G → L   = /admin/analytics (L = Logs/Analytics)
 *   G → T   = /admin/settings  (T = seT)
 *   G → A   = /admin/ai
 *   G → P   = /admin/blog      (P = Posts)
 *   N       = New (context: /admin/bookings → new booking, /admin/blog → new post)
 *   ?       = Toggle help modal
 *
 * Usage: Drop once in AdminLayout — no prop drilling needed.
 *   useAdminShortcuts();
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';

const G_SEQUENCE_TIMEOUT_MS = 1000;

// ─── Go-to route map ──────────────────────────────────────

const GO_TO_MAP: Record<string, string> = {
  d: '/admin/dashboard',
  b: '/admin/bookings',
  c: '/admin/contacts',
  n: '/admin/newsletter',
  s: '/admin/services',
  u: '/admin/users',
  l: '/admin/analytics',
  t: '/admin/settings',
  a: '/admin/ai',
  p: '/admin/blog',
};

// ─── Context-aware "New" actions ──────────────────────────

const NEW_ACTION_MAP: Record<string, () => void> = {};

// ─── Help modal state (singleton via module scope) ─────────

let setHelpModalOpenGlobal: ((v: boolean) => void) | null = null;

export function openAdminHelpModal(): void {
  setHelpModalOpenGlobal?.(true);
}

// ─── Main hook ─────────────────────────────────────────────

export interface ShortcutDef {
  keys: string;
  description: string;
  category: string;
}

export const ALL_SHORTCUTS: ShortcutDef[] = [
  { keys: 'G → D', description: "Dashboard'a git", category: 'Navigasyon' },
  { keys: 'G → B', description: 'Rezervasyonlara git', category: 'Navigasyon' },
  { keys: 'G → C', description: 'Kişilere git', category: 'Navigasyon' },
  { keys: 'G → N', description: 'Bültene git', category: 'Navigasyon' },
  { keys: 'G → S', description: 'Hizmetlere git', category: 'Navigasyon' },
  { keys: 'G → U', description: 'Kullanıcılara git', category: 'Navigasyon' },
  { keys: 'G → L', description: 'Analitiğe git', category: 'Navigasyon' },
  { keys: 'G → T', description: 'Ayarlara git', category: 'Navigasyon' },
  { keys: 'G → A', description: "AI'ya git", category: 'Navigasyon' },
  { keys: 'G → P', description: 'Blog yazılarına git', category: 'Navigasyon' },
  { keys: 'N', description: 'Yeni (bağlama duyarlı)', category: 'Eylem' },
  { keys: '?', description: 'Bu yardım ekranını aç/kapat', category: 'Yardım' },
  { keys: '⌘ K', description: 'Komut paleti', category: 'Yardım' },
];

export function useAdminShortcuts(): {
  helpModalOpen: boolean;
  setHelpModalOpen: (v: boolean) => void;
} {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const pendingGRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register global setter for openAdminHelpModal()
  setHelpModalOpenGlobal = setHelpModalOpen;

  // ─── Helper: ignore if inside input ──────────────────────

  const isInputActive = useCallback(() => {
    const tag = (document.activeElement?.tagName ?? '').toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (document.activeElement as HTMLElement)?.isContentEditable
    );
  }, []);

  // ─── G-sequence handler via keydown event ─────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputActive()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pendingGRef.current) {
        // Second key of G-sequence
        pendingGRef.current = false;
        if (gTimerRef.current) {
          clearTimeout(gTimerRef.current);
          gTimerRef.current = null;
        }

        const dest = GO_TO_MAP[key];
        if (dest) {
          e.preventDefault();
          navigate(dest);
        }
        return;
      }

      if (key === 'g') {
        // First key: start G-sequence
        e.preventDefault();
        pendingGRef.current = true;
        gTimerRef.current = setTimeout(() => {
          pendingGRef.current = false;
          gTimerRef.current = null;
        }, G_SEQUENCE_TIMEOUT_MS);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [navigate, isInputActive]);

  // ─── N = "New" (context-aware) ────────────────────────────

  useHotkeys(
    'n',
    () => {
      if (isInputActive()) return;
      const newAction = NEW_ACTION_MAP[pathname];
      if (newAction) {
        newAction();
      } else {
        // Fallback: navigate to new-item URL if exists
        const newUrl = `${pathname}/new`;
        navigate(newUrl);
      }
    },
    { preventDefault: true },
    [pathname, isInputActive],
  );

  // ─── ? = Help modal ───────────────────────────────────────

  useHotkeys(
    'shift+/',
    () => {
      if (isInputActive()) return;
      setHelpModalOpen((v) => !v);
    },
    { preventDefault: true },
    [isInputActive],
  );

  // ─── Escape = Close help modal ────────────────────────────

  useHotkeys(
    'escape',
    () => {
      setHelpModalOpen(false);
    },
    {},
    [],
  );

  return { helpModalOpen, setHelpModalOpen };
}
