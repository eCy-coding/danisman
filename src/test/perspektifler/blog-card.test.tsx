/**
 * Perspektifler kart (BlogCard) — alan regresyonu + a11y (prefers-reduced-motion).
 * İyileştirme 2026-06-12: kart girişi reduced-motion'da animasyonsuz render olur.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Reduced-motion AÇIK senaryosu + jsdom-güvenli motion mock.
// NOT (M2): importOriginal ile gerçek motion jsdom'da BOŞ render ediyordu.
// Repodaki kanıtlı pattern: motion.* öğelerini düz forwardRef DOM'a indir.
vi.mock('motion/react', () => {
  const mk = (Tag: string) =>
    React.forwardRef(
      ({ children, ...props }: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLElement>) =>
        React.createElement(Tag, { ref, ...props }, children),
    );
  return {
    motion: { article: mk('article'), div: mk('div'), section: mk('section'), span: mk('span') },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    useReducedMotion: () => true,
    useInView: () => true,
  };
});

import BlogCard from '@/components/blog/BlogCard';

const post = {
  slug: 'ornek-makale',
  title: 'Örnek İçgörü Başlığı',
  excerpt: 'Kısa bir özet metni.',
  date: '2026-05-15T00:00:00.000Z',
  coverImage: '/brand/blog-covers/x.svg',
  category: 'Strateji',
  readingTime: '7 dk',
  format: 'makale',
};

const renderCard = () =>
  render(
    <MemoryRouter>
      <BlogCard post={post} index={0} />
    </MemoryRouter>,
  );

describe('BlogCard — alanlar + reduced-motion', () => {
  it('reduced-motion açıkken hatasız render olur ve kart alanlarını gösterir', () => {
    renderCard();
    expect(screen.getByText('Örnek İçgörü Başlığı')).toBeTruthy();
    expect(screen.getByText('Kısa bir özet metni.')).toBeTruthy();
    expect(screen.getByText('7 dk')).toBeTruthy();
    expect(screen.getByText('Strateji')).toBeTruthy();
    expect(screen.getByText('Makale')).toBeTruthy();
  });

  it('tüm kart bir link hedefidir (/perspektifler/<slug>)', () => {
    const { container } = renderCard();
    expect(container.querySelector('a[href="/perspektifler/ornek-makale"]')).toBeTruthy();
  });

  it('16:9 görsel lazy + async decode, <picture> ile sarılı', () => {
    const { container } = renderCard();
    expect(container.querySelector('picture')).toBeTruthy();
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');
    expect(img?.getAttribute('width')).toBe('800');
    expect(img?.getAttribute('height')).toBe('450');
  });

  it("kırık /images/* kapağı gerçek default asset'e düşer (/og-default.jpg)", () => {
    const { container } = render(
      <MemoryRouter>
        <BlogCard post={{ ...post, coverImage: '/images/blog-default.jpg' }} index={0} />
      </MemoryRouter>,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/og-default.jpg');
  });

  it('optimized raster kapakta AVIF + WebP <source> emit edilir', () => {
    const { container } = render(
      <MemoryRouter>
        <BlogCard
          post={{ ...post, coverImage: '/brand/blog-covers/x.jpg', coverOptimized: true }}
          index={0}
        />
      </MemoryRouter>,
    );
    expect(container.querySelector('source[type="image/avif"]')).toBeTruthy();
    expect(container.querySelector('source[type="image/webp"]')).toBeTruthy();
  });
});
