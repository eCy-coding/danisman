/**
 * M2 — ThemeToggle
 * Dropdown button to select theme: Sistem | Açık | Koyu | Yüksek Kontrast variants
 * WCAG 2.1 AA: aria-label, role pattern
 */
import React, { useRef, useState } from 'react';
import { Monitor, Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../contexts/ThemeContext';

interface ThemeOption {
  value: Theme;
  label: string;
  Icon: React.ElementType;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', label: 'Sistem', Icon: Monitor },
  { value: 'light', label: 'Açık', Icon: Sun },
  { value: 'dark', label: 'Koyu', Icon: Moon },
  { value: 'hc-dark', label: 'Yüksek Kontrast (Koyu)', Icon: Contrast },
  { value: 'hc-light', label: 'Yüksek Kontrast (Açık)', Icon: Contrast },
];

const THEME_ICON: Record<Theme, React.ElementType> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  'hc-dark': Contrast,
  'hc-light': Contrast,
};

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const CurrentIcon = THEME_ICON[theme];

  const handleSelect = (value: Theme) => {
    setTheme(value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Tema seç"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
      >
        <CurrentIcon size={15} aria-hidden="true" />
        <span className="sr-only">Mevcut tema: {theme}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Tema seçenekleri"
          className="absolute right-0 top-full mt-1 w-52 bg-surface border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
        >
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <li key={value} role="option" aria-selected={theme === value}>
              <button
                type="button"
                onClick={() => handleSelect(value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  theme === value
                    ? 'bg-secondary/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
