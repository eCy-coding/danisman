/**
 * M2 — ThemeContext tests (TDD)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, ThemeContext } from './ThemeContext';

// Reset localStorage between tests
beforeEach(() => {
  window.localStorage.clear();
  // Reset data-theme attribute
  document.documentElement.removeAttribute('data-theme');
  // Reset matchMedia mock to default (dark: false)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('ThemeContext', () => {
  it("defaults to 'system' (reads prefers-color-scheme)", () => {
    let capturedTheme = '';
    const Consumer: React.FC = () => {
      const ctx = React.useContext(ThemeContext);
      capturedTheme = ctx.theme;
      return null;
    };
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(capturedTheme).toBe('system');
  });

  it("setTheme('dark') persists to localStorage key ecypro-theme", () => {
    const Consumer: React.FC = () => {
      const ctx = React.useContext(ThemeContext);
      return (
        <button onClick={() => ctx.setTheme('dark')} data-testid="btn">
          set dark
        </button>
      );
    };

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn'));
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('ecypro-theme', 'dark');
  });

  it("setTheme('light') adds data-theme='light' on <html>", () => {
    const Consumer: React.FC = () => {
      const ctx = React.useContext(ThemeContext);
      return (
        <button onClick={() => ctx.setTheme('light')} data-testid="btn">
          set light
        </button>
      );
    };

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn'));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it("setTheme('hc-dark') adds data-theme='hc-dark' on <html>", () => {
    const Consumer: React.FC = () => {
      const ctx = React.useContext(ThemeContext);
      return (
        <button onClick={() => ctx.setTheme('hc-dark')} data-testid="btn">
          set hc-dark
        </button>
      );
    };

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn'));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('hc-dark');
  });
});
