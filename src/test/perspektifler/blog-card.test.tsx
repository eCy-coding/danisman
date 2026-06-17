/**
 * Perspektifler kart (BlogCard) — alan regresyonu + a11y (prefers-reduced-motion).
 * İyileştirme 2026-06-12: kart girişi reduced-motion'da animasyonsuz render olur.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Reduced-motion AÇIK senaryosu: useReducedMotion → true (a11y dalını sına).
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return { ...actual, useReducedMotion: () => true };
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

  it('16:9 görsel lazy yüklenir', () => {
    const { container } = renderCard();
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('width')).toBe('800');
    expect(img?.getAttribute('height')).toBe('450');
  });
});
