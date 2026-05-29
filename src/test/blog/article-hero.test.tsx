import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../lib/data', () => ({
  getBlogPosts: () => [
    {
      slug: 'test-slug',
      title: 'Strateji Makale Başlığı',
      excerpt: 'Test excerpt metni',
      date: '2024-01-15',
      author: 'Emre Can Yalçın',
      tags: ['M&A'],
      readingTime: '5 dk',
      coverImage: '/test.jpg',
      category: 'M&A & Değerleme',
    },
  ],
}));
vi.mock('../../lib/structured-data', () => ({
  buildArticleSchema: () => ({}),
  buildBreadcrumbSchema: () => ({}),
}));
vi.mock('../../components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ language: 'tr', t: (k: string) => k }),
}));
vi.mock('@/i18n/canonical', () => ({ buildCanonical: () => '/blog/test-slug' }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav /> }));
vi.mock('../../components/layout/Footer', () => ({ Footer: () => <footer /> }));
vi.mock('../../components/ui/VoicePlayer', () => ({ VoicePlayer: () => null }));
vi.mock('../../components/ui/ScrollProgressBar', () => ({ ScrollProgressBar: () => null }));
vi.mock('../../components/ui/StickyTableOfContents', () => ({
  StickyTableOfContents: () => null,
}));
vi.mock('@mdx-js/react', () => ({
  MDXProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('motion/react', () => ({
  motion: {
    article: ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
      React.createElement('article', rest, children),
  },
}));

import BlogPostPage from '../../pages/BlogPostPage';

function renderPost() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/blog/test-slug']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('atom-9-1: Article hero section', () => {
  it('renders article-hero section', () => {
    renderPost();
    expect(screen.getByTestId('article-hero')).toBeDefined();
  });

  it('article-hero contains h1 with post title', () => {
    renderPost();
    const hero = screen.getByTestId('article-hero');
    expect(hero.querySelector('h1')).toBeTruthy();
    expect(hero.textContent).toContain('Strateji Makale');
  });

  it('article-hero contains date', () => {
    renderPost();
    const hero = screen.getByTestId('article-hero');
    expect(hero.textContent).toMatch(/2024|ocak|january/i);
  });

  it('article-hero contains cover image', () => {
    renderPost();
    const hero = screen.getByTestId('article-hero');
    expect(hero.querySelector('img')).toBeTruthy();
  });
});
