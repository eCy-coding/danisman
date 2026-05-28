import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InsightSearch } from '../../pages/InsightSearch';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, unknown> = {
        'breadcrumb.home': 'Anasayfa',
        'breadcrumb.insights': 'Perspektif',
        'nav.search': 'Ara',
        'search.placeholder': 'Makale, konu veya yazar ara...',
        'search.resultsCount': `${opts?.count ?? 0} sonuç bulundu`,
        'search.noResults': 'Sonuç bulunamadı',
        'search.noResultsHint': 'Farklı anahtar kelimeler deneyin',
        'search.fallbackCta': 'Aradığınızı bulamadınız mı?',
        'search.fallbackDesc': 'Direkt olarak Emre ile görüşün',
        'card.minRead': 'dk okuma',
        'card.featured': 'Öne Çıkan',
        'card.editorsPick': 'Editör Seçimi',
        'card.seriesPart': `Bölüm ${opts?.part ?? ''}`,
      };
      return (map[key] as string) ?? key;
    },
    i18n: { language: 'tr', resolvedLanguage: 'tr', changeLanguage: vi.fn() },
  })),
}));

function renderSearch(q = '') {
  const path = q ? `/insights/search?q=${encodeURIComponent(q)}` : '/insights/search';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/insights/search" element={<InsightSearch />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InsightSearch', () => {
  it('renders search input', () => {
    renderSearch();
    const input = screen.getByTestId('search-input');
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).placeholder).toBe('Makale, konu veya yazar ara...');
  });

  it('filters posts on input matching stub data', async () => {
    renderSearch('M&A');
    // Wait for debounce
    await waitFor(
      () => {
        const cards = screen.queryAllByTestId('insight-card');
        expect(cards.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );
  });

  it('shows "no results" state for non-matching query', async () => {
    renderSearch('zzznomatch999');
    await waitFor(
      () => {
        const noResults = screen.getByTestId('no-results');
        expect(noResults).toBeDefined();
      },
      { timeout: 1000 },
    );
    expect(screen.getByText('Sonuç bulunamadı')).toBeDefined();
  });

  it('renders Discovery CTA fallback', () => {
    renderSearch();
    const cta = screen.getByText('Aradığınızı bulamadınız mı?');
    expect(cta).toBeDefined();
  });
});
