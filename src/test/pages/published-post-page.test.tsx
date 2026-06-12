import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// DB-backed published-post page: the NotebookLM pipeline's public surface.
// Covers the two contract points: a PUBLISHED slug renders title + markdown
// body + cover; an unknown slug falls back to the existing 404 copy.

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ language: 'tr' }),
}));
vi.mock('../../i18n/canonical', () => ({
  buildCanonical: (p: string) => `https://www.ecypro.com${p}`,
}));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav /> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer /> }));
vi.mock('../../components/ui/ScrollProgressBar', () => ({
  ScrollProgressBar: () => null,
}));
vi.mock('../../components/blog/ShareButtons', () => ({
  ShareButtons: () => <div data-testid="share" />,
}));
vi.mock('../../components/blog/NewsletterSidebar', () => ({
  NewsletterSidebar: () => <div data-testid="newsletter" />,
}));

const get = vi.fn();
vi.mock('../../lib/api', () => ({ apiClient: { get: (...a: unknown[]) => get(...a) } }));

import PublishedPostPage from '../../components/blog/PublishedPostPage';

const POST = {
  slug: 'nlm-arastirma-testi',
  titleTr: 'NotebookLM Araştırma Yazısı',
  excerptTr: 'Kısa özet metni — en az yirmi karakter.',
  bodyTrMdx:
    '*Dek paragrafı burada.*\n\n## Önemli Çıkarımlar\n\n- Birinci çıkarım cümlesi.\n\n## Bölüm\n\nGövde metni.\n\n## Metodoloji\n\n10 kaynaklı araştırma.',
  coverImageUrl: '/insights-covers/aile-sirketi-1.webp',
  coverImageAlt: 'Aile şirketi temalı soyut illüstrasyon',
  ogImageUrl: '/insights-covers/aile-sirketi-1.webp',
  metaTitleTr: 'NotebookLM Araştırma Yazısı',
  metaDescTr: 'Meta açıklama.',
  publishedAt: '2026-06-12T12:54:44.000Z',
  readingTimeMin: 4,
  author: { displayName: 'Emre Can Yalçın', slug: 'emre', avatarUrl: null },
};

function mount(slug: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Suspense fallback={null}>
            <PublishedPostPage slug={slug} />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  get.mockReset();
});

describe('PublishedPostPage (DB-backed article)', () => {
  it('renders title, markdown body and cover for a published slug', async () => {
    get.mockResolvedValue({ data: { data: POST } });
    mount(POST.slug);

    expect(await screen.findByRole('heading', { level: 1, name: POST.titleTr })).toBeTruthy();
    expect(await screen.findByText('Önemli Çıkarımlar')).toBeTruthy();
    expect(await screen.findByText(/Birinci çıkarım cümlesi/)).toBeTruthy();
    expect(await screen.findByText('Metodoloji')).toBeTruthy();
    const img = screen.getByAltText(POST.coverImageAlt) as HTMLImageElement;
    expect(img.src).toContain('/insights-covers/aile-sirketi-1.webp');
    expect(get).toHaveBeenCalledWith(`/insights/posts/${POST.slug}`);
  });

  it('falls back to the 404 copy when the API rejects (unknown slug)', async () => {
    get.mockRejectedValue(new Error('404'));
    mount('boyle-bir-yazi-yok');

    expect(await screen.findByText('Makele Bulunamadı')).toBeTruthy();
    expect(screen.getByText("Blog'a Dön")).toBeTruthy();
  });
});
