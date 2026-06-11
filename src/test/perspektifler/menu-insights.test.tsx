/**
 * GATE-2 (jsdom) — Perspektifler mega-menü kapsam + BUG-02/03/04 regresyonu.
 *
 * BUG-03: panel insights-only olmalı (Sektörler/Hakkımızda grupları YOK).
 * BUG-04: footer "Tüm içgörüleri keşfedin" (services metni değil), link /perspektifler.
 * Link sayısı ≤30. BUG-02: NAV_ITEMS icon taşımaz → boş ikon kutusu basılmamalı.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { Navbar } from '@/components/layout/Navbar';

const noop = () => {};

const renderInsights = (lang: 'tr' | 'en' = 'tr') =>
  render(
    <MegaMenu
      menuId="insights"
      isOpen
      lang={lang}
      onClose={noop}
      onMouseEnter={noop}
      onMouseLeave={noop}
    />,
  );

describe('Perspektifler mega-menü — insights-only (BUG-03/04)', () => {
  it('3 insights kategorisi gösterir (Kategoriler/Formatlar/Öne Çıkanlar)', () => {
    renderInsights();
    expect(screen.getByText('Kategoriler')).toBeTruthy();
    expect(screen.getByText('Formatlar')).toBeTruthy();
    expect(screen.getByText('Öne Çıkanlar')).toBeTruthy();
  });

  it('Sektörler ve Hakkımızda grupları KALDIRILDI (BUG-03)', () => {
    const { container } = renderInsights();
    const text = container.textContent || '';
    expect(text).not.toContain('Metodolojimiz');
    expect(text).not.toContain('Firmamız');
    // "Sektörler"/"Hakkımızda" başlıkları panelde olmamalı (nav item'larında yaşar)
    expect(screen.queryByText('Hakkımızda')).toBeNull();
  });

  it('footer insights metni + /perspektifler linki (BUG-04)', () => {
    const { container } = renderInsights();
    expect(screen.getByText('Tüm içgörüleri keşfedin')).toBeTruthy();
    expect(container.textContent).not.toContain('Tüm hizmetlerimizi keşfedin');
    expect(container.querySelector('a[href="/perspektifler"]')).toBeTruthy();
  });

  it('panel link sayısı ≤30', () => {
    const { container } = renderInsights();
    const links = container.querySelectorAll('a[href]');
    expect(links.length).toBeLessThanOrEqual(30);
  });

  it('tüm kategori linkleri /perspektifler/kategori/* hedefler', () => {
    const { container } = renderInsights();
    [
      'strateji',
      'yapay-zeka-teknoloji',
      'operasyon',
      'insan-organizasyon',
      'kamu-esg',
      'ma-degerleme',
    ].forEach((slug) =>
      expect(
        container.querySelector(`a[href="/perspektifler/kategori/${slug}"]`),
        `eksik kategori: ${slug}`,
      ).toBeTruthy(),
    );
  });
});

describe('Navbar — BUG-02 (boş ikon kutusu)', () => {
  it('etiket-only nav öğelerinde w-8 h-8 ikon kutusu render edilmez', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
    // NAV_ITEMS hiçbir icon taşımıyor → hiçbir item'da ikon chip'i olmamalı.
    // (BUG-02'den önce her label'dan önce boş bir w-8 h-8 kutu vardı.)
    const homeLink = container.querySelector('[data-testid="navbar-link-home"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink?.querySelector('.w-8.h-8')).toBeNull();
  });
});
