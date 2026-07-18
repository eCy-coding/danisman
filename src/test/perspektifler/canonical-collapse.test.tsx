/**
 * Canonical-collapse leftovers (EN article-parity mechanism, item 7):
 * BlogPage + PerspektiflerKategoriPage previously hardcoded apex literal
 * canonicals (`https://ecypro.com/perspektifler...`) — every locale
 * collapsed onto one URL, contradicting the site-wide
 * `https://ecypro.com/{locale}{path}` convention enforced by
 * buildCanonical. These tests pin the canonicals to the locale-aware form.
 *
 * Uses the REAL Helmet shim (react-helmet-async is aliased to
 * src/lib/seo-helmet.tsx in vitest.config.ts) so we assert the actual
 * <link rel="canonical"> landing in document.head.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

let mockLanguage: 'tr' | 'en' = 'en';
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    language: mockLanguage,
    t: (k: string) => k,
    toggleLanguage: () => {},
    i18n: { language: mockLanguage },
  }),
}));
vi.mock('../../components/blog/PerspektiflerFeed', () => ({
  PerspektiflerFeed: () => <div data-testid="feed" />,
}));
vi.mock('@/components/blog/PerspektiflerFeed', () => ({
  PerspektiflerFeed: () => <div data-testid="feed" />,
}));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => <nav /> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <footer /> }));
vi.mock('@/components/blog/BlogCard', () => ({ default: () => <div /> }));

import BlogPage from '../../pages/BlogPage';
import PerspektiflerKategoriPage from '../../pages/PerspektiflerKategoriPage';

function canonicalHref(): string | null {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
}

describe('canonical-collapse fix — BlogPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });
  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
  });

  it('en locale → /en/perspektifler canonical (not the apex literal)', async () => {
    mockLanguage = 'en';
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/perspektifler']}>
          <BlogPage />
        </MemoryRouter>,
      );
    });
    expect(canonicalHref()).toBe('https://ecypro.com/en/perspektifler');
  });

  it('tr locale → /tr/perspektifler canonical', async () => {
    mockLanguage = 'tr';
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/perspektifler']}>
          <BlogPage />
        </MemoryRouter>,
      );
    });
    expect(canonicalHref()).toBe('https://ecypro.com/tr/perspektifler');
  });
});

describe('canonical-collapse fix — PerspektiflerKategoriPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });
  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
  });

  function renderKategori() {
    return render(
      <MemoryRouter initialEntries={['/perspektifler/kategori/strateji']}>
        <Routes>
          <Route path="/perspektifler/kategori/:slug" element={<PerspektiflerKategoriPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('en locale → locale-prefixed category canonical', async () => {
    mockLanguage = 'en';
    await act(async () => {
      renderKategori();
    });
    expect(canonicalHref()).toBe('https://ecypro.com/en/perspektifler/kategori/strateji');
  });

  it('tr locale → /tr category canonical', async () => {
    mockLanguage = 'tr';
    await act(async () => {
      renderKategori();
    });
    expect(canonicalHref()).toBe('https://ecypro.com/tr/perspektifler/kategori/strateji');
  });
});
