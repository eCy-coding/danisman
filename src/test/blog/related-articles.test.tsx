import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', rest, children),
  },
}));

import { RelatedArticles } from '../../components/blog/RelatedArticles';
import type { BlogPost } from '../../schemas/blog';

const fakePosts: BlogPost[] = [
  {
    slug: 'a',
    title: 'Makale A',
    excerpt: 'excerpt a',
    date: '2024-01-01',
    author: 'Emre Can Yalçın',
    tags: ['M&A'],
    readingTime: '3 dk',
    coverImage: '/a.jpg',
    category: 'Strateji',
  },
  {
    slug: 'b',
    title: 'Makale B',
    excerpt: 'excerpt b',
    date: '2024-02-01',
    author: 'Emre Can Yalçın',
    tags: ['Strateji'],
    readingTime: '4 dk',
    coverImage: '/b.jpg',
    category: 'Strateji',
  },
];

function renderRelated() {
  return render(
    <MemoryRouter>
      <RelatedArticles posts={fakePosts} />
    </MemoryRouter>,
  );
}

describe('atom-9-4: RelatedArticles component', () => {
  it('renders related-articles section', () => {
    renderRelated();
    expect(screen.getByTestId('related-articles')).toBeDefined();
  });

  it('renders article cards for each post', () => {
    renderRelated();
    const section = screen.getByTestId('related-articles');
    const links = section.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('shows post titles', () => {
    renderRelated();
    expect(screen.getByText('Makale A')).toBeDefined();
    expect(screen.getByText('Makale B')).toBeDefined();
  });

  it('renders nothing when posts empty', () => {
    render(
      <MemoryRouter>
        <RelatedArticles posts={[]} />
      </MemoryRouter>,
    );
    expect(document.querySelector('[data-testid="related-articles"]')).toBeNull();
  });
});
