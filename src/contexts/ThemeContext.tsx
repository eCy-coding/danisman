/**
 * M2 — ThemeContext
 * Supports: light | dark | system | hc-light | hc-dark
 * Persists to localStorage key `ecypro-theme`
 * Sets `data-theme` attribute on <html>
 */
import React, { createContext, useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system' | 'hc-light' | 'hc-dark';

const STORAGE_KEY = 'ecypro-theme';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const defaultContextValue: ThemeContextValue = {
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => undefined,
};

export const ThemeContext = createContext<ThemeContextValue>(defaultContextValue);

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemPreference();
  if (theme === 'dark' || theme === 'hc-dark') return 'dark';
  return 'light';
}

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (
      stored === 'light' ||
      stored === 'dark' ||
      stored === 'system' ||
      stored === 'hc-light' ||
      stored === 'hc-dark'
    ) {
      return stored;
    }
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  // Apply theme to document on mount and changes
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // Listen to system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDocument('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage unavailable
    }
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: resolveTheme(theme),
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
