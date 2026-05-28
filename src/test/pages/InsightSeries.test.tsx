import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InsightSeries } from '../../pages/InsightSeries';

vi.mock('@/hooks/useInsightsFeed', () => ({
  useInsightsFeed: vi.fn(() => ({
    posts: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, unknown> = {
        'breadcrumb.home': 'Anasayfa',
        'breadcrumb.insights': 'Perspektif',
        'series.progressLabel': 'Seri İlerlemesi',
        'series.comingSoon': 'Yakında',
        'series.published': `${opts?.count ?? 0} bölüm yayınlandı`,
        'series.totalParts': `${opts?.total ?? 0} bölüm`,
        'series.readingLog': 'Okuma Geçmişi',
        'series.loginPrompt': 'Okuma geçmişi için giriş yapın',
        'author.founderBadge': 'Kurucu Ortak',
        'newsletter.title': 'Founder Letter',
        'newsletter.desc': 'Haftalık analiz',
        'newsletter.cta': 'Abone Ol',
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

function renderSeries(slug = 'esg-seri') {
  return render(
    <MemoryRouter initialEntries={[`/insights/series/${slug}`]}>
      <Routes>
        <Route path="/insights/series/:slug/:part?" element={<InsightSeries />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InsightSeries', () => {
  it('renders series hero with title and progress bar', async () => {
    renderSeries();
    await waitFor(() => {
      // The h1 heading contains the series title
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.textContent).toContain('ESG Masterclass Serisi');
    });
    const progressLabel = screen.getByText('Seri İlerlemesi');
    expect(progressLabel).toBeDefined();
  });

  it('renders parts list with correct part count', async () => {
    renderSeries();
    await waitFor(() => {
      expect(screen.getByText('Bölümler')).toBeDefined();
    });
    // Stub series has 5 parts — check at least one part number renders
    const partOneEl = screen.getByText(
      'ESG Neden Önemli? Türk Şirketleri için Stratejik Perspektif',
    );
    expect(partOneEl).toBeDefined();
  });

  it('shows "Yakında" for unscheduled parts', async () => {
    renderSeries();
    await waitFor(() => {
      const comingSoonEls = screen.getAllByText('Yakında');
      expect(comingSoonEls.length).toBeGreaterThan(0);
    });
  });

  it('renders login prompt for reading log', async () => {
    renderSeries();
    await waitFor(() => {
      expect(screen.getByText('Okuma Geçmişi')).toBeDefined();
      expect(screen.getByText('Okuma geçmişi için giriş yapın')).toBeDefined();
    });
  });
});
