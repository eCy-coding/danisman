import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { InsightCard } from '../../components/insights/InsightCard';
import type { InsightPost } from '../../types/insights';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, unknown> = {
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

const BASE_POST: InsightPost = {
  id: 'test-1',
  slug: 'test-post',
  type: 'ANALYSIS',
  status: 'PUBLISHED',
  language: 'TR_ONLY',
  titleTr: 'Test Makale Başlığı',
  excerptTr: 'Test özet metni.',
  primaryDomain: 'M_A',
  subDomain: 'due-diligence',
  tags: [],
  author: {
    id: 'a1',
    slug: 'emre-can-yalcin',
    displayName: 'Emre Can Yalçın',
    bioTr: 'Kurucu',
    avatarUrl: '/images/avatar.jpg',
    isFounder: true,
  },
  coverImageUrl: '/images/cover.jpg',
  coverImageAlt: 'Test cover',
  readingTimeMin: 5,
  viewCount: 100,
  publishedAt: '2026-05-01T09:00:00Z',
  isFeatured: false,
  isEditorsPick: false,
};

function renderCard(overrides: Partial<InsightPost> = {}) {
  const post = { ...BASE_POST, ...overrides };
  return render(
    <MemoryRouter>
      <InsightCard post={post} />
    </MemoryRouter>,
  );
}

describe('InsightCard', () => {
  it('renders post title + author name', () => {
    renderCard();
    expect(screen.getByText('Test Makale Başlığı')).toBeDefined();
    expect(screen.getByText('Emre Can Yalçın')).toBeDefined();
  });

  it('renders domain badge with correct text for M_A domain', () => {
    renderCard({ primaryDomain: 'M_A' });
    const badge = screen.getByTestId('domain-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('M&A');
  });

  it('renders series badge when seriesOrder is set', () => {
    renderCard({
      seriesOrder: 3,
      series: {
        id: 's1',
        slug: 'test-series',
        titleTr: 'Test Serisi',
        descriptionTr: 'Açıklama',
        coverImageUrl: '/img.jpg',
        totalParts: 5,
        status: 'ACTIVE',
      },
    });
    const seriesBadge = screen.getByTestId('series-badge');
    expect(seriesBadge).toBeDefined();
    expect(seriesBadge.textContent).toContain('Bölüm');
  });

  it('renders featured badge when isFeatured is true', () => {
    renderCard({ isFeatured: true });
    const featuredBadge = screen.getByTestId('featured-badge');
    expect(featuredBadge).toBeDefined();
    expect(featuredBadge.textContent).toContain('Öne Çıkan');
  });
});
