/**
 * useTranslation() wrapper — namespace passthrough.
 *
 * Extended to accept an optional `ns` (default 'translation') so pages that
 * already import `useTranslation` from `@/lib/i18n` for `language` can also
 * scope `t()` to another namespace (e.g. 'insights' for the EN article-parity
 * "Turkish only" notice on BlogPostPage) without bypassing this wrapper to
 * call `react-i18next` directly. Must stay 100% backward-compatible with the
 * ~40 existing no-arg call sites across the app.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const useTranslationMock = vi.fn((_ns?: string | string[]) => ({
  t: (k: string) => k,
  i18n: { language: 'tr', changeLanguage: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => useTranslationMock(ns),
}));
vi.mock('./i18n-react', () => ({ default: {} }));

import { useTranslation } from './i18n';

describe('useTranslation wrapper (src/lib/i18n.tsx)', () => {
  it('defaults to the "translation" namespace when called with no args', () => {
    renderHook(() => useTranslation());
    expect(useTranslationMock).toHaveBeenLastCalledWith('translation');
  });

  it('forwards an explicit namespace (e.g. "insights") to react-i18next', () => {
    renderHook(() => useTranslation('insights'));
    expect(useTranslationMock).toHaveBeenLastCalledWith('insights');
  });

  it('exposes language derived from i18n.language, stripped of region', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.language).toBe('tr');
  });
});
