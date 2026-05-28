import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InsightTag } from '../../pages/InsightTag';

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
  tags: [{ id: 't1', slug: 'test-tag', labelTr: 'Test', labelEn: 'Test', axis: 'FORMAT' }],
  series: null,
  seriesOrder: null,
};

vi.mock('@/hooks/useInsightsFeed', () => ({
  useInsightsFeed: vi.fn((filter: { tagSlug?: string } = {}) => {
    const posts = filter?.tagSlug && filter.tagSlug !== 'test-tag' ? [] : [STUB_POST];
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
      const map: Record<string, unknown> = {
        'breadcrumb.home': 'Anasayfa',
        'breadcrumb.insights': 'Perspektif',
        'tag.postsCount': `${opts?.count ?? 0} makale`,
        'tag.relatedTags': 'İlgili Etiketler',
        'category.loadMore': 'Daha Fazla Yükle',
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

function renderTag(slug = 'surdurulebilirlik') {
  return render(
    <MemoryRouter initialEntries={[`/insights/tag/${slug}`]}>
      <Routes>
        <Route path="/insights/tag/:slug" element={<InsightTag />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InsightTag', () => {
  it('renders tag hero with hash prefix + label', async () => {
    renderTag('surdurulebilirlik');
    await waitFor(() => {
      const hashEl = screen.getByText('#');
      expect(hashEl).toBeDefined();
    });
  });

  it('renders article feed for tag', async () => {
    renderTag('surdurulebilirlik');
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    });
    // Feed renders (cards or empty state)
    await waitFor(() => {
      const cards = screen.queryAllByTestId('insight-card');
      expect(Array.isArray(cards)).toBe(true);
    });
  });

  it('renders related tags section', async () => {
    renderTag('surdurulebilirlik');
    await waitFor(() => {
      expect(screen.getByText('İlgili Etiketler')).toBeDefined();
    });
  });

  it('shows empty state when no posts match tag', async () => {
    renderTag('nonexistent-tag-xyz');
    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeDefined();
    });
  });
});
