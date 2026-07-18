import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../lib/data', () => ({
  getBlogPosts: () => [
    {
      slug: 'test-slug',
      title: 'Test Makale',
      excerpt: 'Test excerpt',
      date: '2024-01-15',
      author: 'Emre Can Yalçın',
      tags: ['Strateji'],
      readingTime: '3 dk',
      coverImage: '/test.jpg',
      category: 'Strateji',
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
vi.mock('@/i18n/canonical', () => ({
  buildCanonical: () => '/blog/test-slug',
  buildArticleAlternates: () => [],
}));
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

describe('atom-9-2: Article body', () => {
  it('renders article-body section', () => {
    renderPost();
    expect(screen.getByTestId('article-body')).toBeDefined();
  });

  it('article-body has prose class', () => {
    renderPost();
    const body = screen.getByTestId('article-body');
    expect(body.className).toContain('prose');
  });

  it('article-body is inside blog-article', () => {
    renderPost();
    const article = screen.getByTestId('blog-article');
    const body = article.querySelector('[data-testid="article-body"]');
    expect(body).toBeTruthy();
  });
});
