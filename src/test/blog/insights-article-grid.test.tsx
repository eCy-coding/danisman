import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/data', () => ({
  getBlogPosts: () => [
    {
      slug: 'test-article',
      title: 'Test Makale Başlığı',
      excerpt: 'Bu bir test excerpt',
      date: '2024-01-15',
      author: 'Emre Can Yalçın',
      tags: ['M&A'],
      readingTime: '5 dk',
      coverImage: '/test.jpg',
      category: 'Strateji',
    },
    {
      slug: 'second',
      title: 'İkinci Makale',
      excerpt: 'İkinci excerpt',
      date: '2024-02-01',
      author: 'Emre Can Yalçın',
      tags: ['Strateji'],
      readingTime: '4 dk',
      coverImage: '/b.jpg',
      category: 'Strateji',
    },
    {
      slug: 'third',
      title: 'Üçüncü Makale',
      excerpt: 'Üçüncü excerpt',
      date: '2024-03-01',
      author: 'Emre Can Yalçın',
      tags: ['M&A'],
      readingTime: '6 dk',
      coverImage: '/c.jpg',
      category: 'M&A & Değerleme',
    },
  ],
}));
// NOT (M5): BlogCard #1'de `useReducedMotion` kullanmaya başladı; eski mock onu
// export etmediği için "No useReducedMotion export" hatası veriyordu. Eklendi.
vi.mock('motion/react', () => {
  const mk = (Tag: string) =>
    React.forwardRef(
      ({ children, ...props }: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLElement>) =>
        React.createElement(Tag, { ref, ...props }, children),
    );
  return {
    motion: { article: mk('article'), div: mk('div'), section: mk('section'), span: mk('span') },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useReducedMotion: () => false,
    useInView: () => true,
  };
});

import BlogList from '../../components/blog/BlogList';

function renderList() {
  return render(
    <MemoryRouter>
      <BlogList />
    </MemoryRouter>,
  );
}

describe('atom-8-2: Blog article grid', () => {
  it('renders insights-article-grid container', () => {
    renderList();
    expect(screen.getByTestId('insights-article-grid')).toBeDefined();
  });

  it('renders article-card elements', () => {
    renderList();
    const cards = screen.getAllByTestId('article-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('article-card contains post title', () => {
    renderList();
    const cards = screen.getAllByTestId('article-card');
    expect(cards[0]?.textContent).toContain('Test Makale');
  });

  it('filter nav has aria-label', () => {
    renderList();
    expect(screen.getByRole('navigation', { name: /filtreleri/i })).toBeDefined();
  });

  it('filter buttons have aria-pressed attribute', () => {
    renderList();
    const pressed = document.querySelectorAll('[aria-pressed]');
    expect(pressed.length).toBeGreaterThanOrEqual(1);
  });
});
