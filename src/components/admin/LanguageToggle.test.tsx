/**
 * M3 — Admin i18n + LanguageToggle tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock i18next so tests don't need actual HTTP backend
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: {
      language: 'tr',
      resolvedLanguage: 'tr',
      changeLanguage: vi.fn(),
    },
  })),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

import { LanguageToggle } from './LanguageToggle';
import { useTranslation } from 'react-i18next';

describe('M3 — i18n admin namespace', () => {
  it('TR locale file has ≥300 keys', async () => {
    const trFile = await import('../../../public/locales/tr/admin.json', {
      assert: { type: 'json' },
    });
    function countKeys(obj: Record<string, unknown>): number {
      return Object.values(obj).reduce<number>((acc, v) => {
        return (
          acc + (typeof v === 'object' && v !== null ? countKeys(v as Record<string, unknown>) : 1)
        );
      }, 0);
    }
    expect(countKeys(trFile.default as Record<string, unknown>)).toBeGreaterThanOrEqual(300);
  });

  it('EN locale file has ≥300 keys matching TR count', async () => {
    const trFile = await import('../../../public/locales/tr/admin.json', {
      assert: { type: 'json' },
    });
    const enFile = await import('../../../public/locales/en/admin.json', {
      assert: { type: 'json' },
    });
    function countKeys(obj: Record<string, unknown>): number {
      return Object.values(obj).reduce<number>((acc, v) => {
        return (
          acc + (typeof v === 'object' && v !== null ? countKeys(v as Record<string, unknown>) : 1)
        );
      }, 0);
    }
    const trCount = countKeys(trFile.default as Record<string, unknown>);
    const enCount = countKeys(enFile.default as Record<string, unknown>);
    expect(enCount).toBeGreaterThanOrEqual(300);
    expect(enCount).toBe(trCount);
  });

  it('LanguageToggle renders TR and EN buttons', () => {
    render(<LanguageToggle />);
    expect(screen.getByRole('button', { name: /switch to türkçe/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /switch to english/i })).toBeDefined();
  });

  it('LanguageToggle calls changeLanguage on click', () => {
    const mockChange = vi.fn();
    vi.mocked(useTranslation).mockReturnValue({
      t: (k: string) => k,
      i18n: {
        language: 'tr',
        resolvedLanguage: 'tr',
        changeLanguage: mockChange,
      },
    } as ReturnType<typeof useTranslation>);

    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole('button', { name: /switch to english/i }));
    expect(mockChange).toHaveBeenCalledWith('en');
  });

  it('rbac.viewAs.banner key has {{role}} interpolation placeholder', async () => {
    const trFile = await import('../../../public/locales/tr/admin.json', {
      assert: { type: 'json' },
    });
    const locale = trFile.default as Record<string, Record<string, string>>;
    expect(locale.rbac['viewAs.banner']).toContain('{{role}}');
  });
});
