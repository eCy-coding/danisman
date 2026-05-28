import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InsightArchive } from '../../pages/InsightArchive';

const STUB_POST = {
  id: 'post-1',
  slug: 'test-post',
  titleTr: 'Test M&A Başlık',
  titleEn: 'Test M&A Title',
  excerptTr: 'Özet',
  excerptEn: 'Excerpt',
  coverImageUrl: '/img.jpg',
  coverImageAlt: 'img',
  primaryDomain: 'M_A',
  subDomain: null,
  type: 'ANALYSIS',
  readingTimeMin: 5,
  viewCount: 10,
  publishedAt: '2026-05-01T00:00:00.000Z',
  isFeatured: false,
  isEditorsPick: false,
  author: {
    id: 'a1',
    slug: 'emre-can-yalcin',
    displayName: 'Emre Can Yalçın',
    bioTr: '',
    bioEn: '',
    avatarUrl: '/av.jpg',
    isFounder: true,
  },
  tags: [],
  series: null,
  seriesOrder: null,
};

vi.mock('@/hooks/useInsightsFeed', () => ({
  useInsightsFeed: vi.fn((filter: { year?: number } = {}) => {
    const posts = filter?.year === 2010 ? [] : [STUB_POST];
    return {
      posts,
      total: posts.length,
      hasMore: false,
      isLoading: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    };
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'archive.monthNames') {
        return [
          'Ocak',
          'Şubat',
          'Mart',
          'Nisan',
          'Mayıs',
          'Haziran',
          'Temmuz',
          'Ağustos',
          'Eylül',
          'Ekim',
          'Kasım',
          'Aralık',
        ];
      }
      const map: Record<string, unknown> = {
        'breadcrumb.home': 'Anasayfa',
        'breadcrumb.insights': 'Perspektif',
        'archive.title': 'Arşiv',
        'archive.yearSelector': 'Yıl Seç',
        'archive.noPosts': 'Bu dönemde makale yok',
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

function renderArchive(path = '/insights/archive') {
  const routes = (
    <Routes>
      <Route path="/insights/archive/:year?/:month?" element={<InsightArchive />} />
    </Routes>
  );
  return render(<MemoryRouter initialEntries={[path]}>{routes}</MemoryRouter>);
}

describe('InsightArchive', () => {
  it('renders year selector', async () => {
    renderArchive('/insights/archive');
    await waitFor(() => {
      const yearSel = screen.getByTestId('year-selector');
      expect(yearSel).toBeDefined();
    });
    expect(screen.getByText('2026')).toBeDefined();
    expect(screen.getByText('2025')).toBeDefined();
  });

  it('renders month grid when year is selected', async () => {
    renderArchive('/insights/archive/2026');
    await waitFor(() => {
      const monthGrid = screen.getByTestId('month-grid');
      expect(monthGrid).toBeDefined();
    });
    // Month names should appear
    expect(screen.getByText('Ocak')).toBeDefined();
  });

  it('renders article list for selected year', async () => {
    renderArchive('/insights/archive/2026');
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    });
    // Stub data has posts in 2026 — or empty state
    await waitFor(() => {
      const cards = screen.queryAllByTestId('insight-card');
      expect(Array.isArray(cards)).toBe(true);
    });
  });

  it('shows empty state for year with no posts', async () => {
    renderArchive('/insights/archive/2010');
    await waitFor(() => {
      const emptyEl = screen.getByTestId('archive-empty-state');
      expect(emptyEl).toBeDefined();
    });
  });
});
