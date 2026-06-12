/**
 * GATE-2 (jsdom) — Perspektifler mega-menü kapsam + BUG-02/03/04 regresyonu.
 *
 * BUG-03: panel insights-only olmalı (Sektörler/Hakkımızda grupları YOK).
 * BUG-04: footer "Tüm içgörüleri keşfedin" (services metni değil), link /perspektifler.
 * Link sayısı ≤30. BUG-02: ikon kutusu YALNIZCA gerçek bir ikon varsa basılır.
 *
 * merge 2026-06-12: insights paneli artık insightsMenuData (canlı içerik
 * indeksi) üzerinden render ediliyor; NAV_ITEMS iconName ile gerçek lucide
 * ikonları taşıyor — BUG-02 guard'ı etiket-only senaryosuyla test edilir.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { Navbar } from '@/components/layout/Navbar';

// merge 2026-06-12: NAV_ITEMS.icon taşımıyordu → main her öğeye iconName verdi.
// BUG-02'nin asıl invariantı ("ikon çözülemiyorsa kutu render edilmez") guard'ını
// sınamak için home öğesini gate-2'deki gibi etiket-only'ye indiriyoruz
// (veri seam mock'u — bileşen davranışı mock'lanmaz, MEGA_MENUS aynen kalır).
vi.mock('@/data/copy/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/copy/common')>();
  return {
    ...actual,
    NAV_ITEMS: {
      ...actual.NAV_ITEMS,
      home: { ...actual.NAV_ITEMS.home, iconName: undefined },
    },
  };
});

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
    // home mock ile etiket-only (icon yok, iconName yok) → ikon chip'i olmamalı.
    // (BUG-02'den önce her label'dan önce boş bir w-8 h-8 kutu vardı.)
    const homeLink = container.querySelector('[data-testid="navbar-link-home"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink?.querySelector('.w-8.h-8')).toBeNull();
  });

  it('ikonlu öğeler kutuyu yalnızca gerçek ikonla basar (boş chip YOK)', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
    // merge 2026-06-12: iconName: 'Briefcase' → kutu var VE içi dolu (svg).
    const servicesLink = container.querySelector('[data-testid="navbar-link-services"]');
    const box = servicesLink?.querySelector('.w-8.h-8');
    expect(box).toBeTruthy();
    expect(box?.querySelector('svg')).toBeTruthy();
    // Navbar genelinde tek bir BOŞ ikon kutusu bile olmamalı (BUG-02 regresyonu).
    const boxes = container.querySelectorAll('[data-testid^="navbar-link-"] .w-8.h-8');
    boxes.forEach((b) => {
      expect(b.querySelector('svg'), 'boş w-8 h-8 ikon kutusu (BUG-02)').toBeTruthy();
    });
  });
});
