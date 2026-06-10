/**
 * Phase 6 — MegaMenu render testi (HİZMETLER paneli, TR + EN).
 *
 * Ekran görüntüsündeki yapıyı kilitler: 3 kategori (Strateji/Teknoloji/
 * Performans) + 9 hizmet linki + "AI Olgunluk Analizi / Analizi Başlat" CTA
 * (→ /maturity-assessment) + alt bar ("Tümünü gör" → /services).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MegaMenu } from '../MegaMenu';

const noop = () => {};

function renderMenu(lang: 'tr' | 'en') {
  return render(
    <MegaMenu
      menuId="services"
      isOpen
      lang={lang}
      onClose={noop}
      onMouseEnter={noop}
      onMouseLeave={noop}
    />,
  );
}

const DEEP_LINKS = [
  '/services/strategic-transformation',
  '/services/mergers-acquisitions',
  '/services/organizational-design',
  '/services/ai-analytics',
  '/services/digital-strategy',
  '/services/cloud-platform-modernization',
  '/services/revenue-growth-strategy',
  '/services/cost-optimization',
  '/services/digital-operations',
];

describe('MegaMenu (services) — TR render', () => {
  it('3 kategori başlığını gösterir', () => {
    renderMenu('tr');
    expect(screen.getByText('Strateji')).toBeTruthy();
    expect(screen.getByText('Teknoloji')).toBeTruthy();
    expect(screen.getByText('Performans')).toBeTruthy();
  });

  it('9 hizmet etiketini gösterir', () => {
    renderMenu('tr');
    [
      'Kurumsal Strateji',
      'M&A Danışmanlığı',
      'Organizasyonel Tasarım',
      'Yapay Zeka & Veri',
      'Dijital Dönüşüm',
      'Bulut & Platform',
      'Gelir Büyümesi',
      'Maliyet Dönüşümü',
      'Dijital Operasyonlar',
    ].forEach((label) => expect(screen.getByText(label), `eksik: ${label}`).toBeTruthy());
  });

  it('9 öğenin tümü doğru derin-link href taşır', () => {
    const { container } = renderMenu('tr');
    for (const href of DEEP_LINKS) {
      expect(container.querySelector(`a[href="${href}"]`), `eksik link: ${href}`).toBeTruthy();
    }
  });

  it('öne çıkan kart + CTA doğru', () => {
    const { container } = renderMenu('tr');
    expect(screen.getByText('AI Olgunluk Analizi')).toBeTruthy();
    expect(screen.getByText('Analizi Başlat')).toBeTruthy();
    expect(container.querySelector('a[href="/maturity-assessment"]')).toBeTruthy();
  });

  it('alt bar "Tümünü gör" → /services', () => {
    const { container } = renderMenu('tr');
    expect(screen.getByText('Tümünü gör')).toBeTruthy();
    expect(container.querySelector('a[href="/services"]')).toBeTruthy();
  });
});

describe('MegaMenu (services) — EN render', () => {
  it('EN kategori + CTA etiketlerini gösterir', () => {
    renderMenu('en');
    expect(screen.getByText('Strategy')).toBeTruthy();
    expect(screen.getByText('Technology')).toBeTruthy();
    expect(screen.getByText('Performance')).toBeTruthy();
    expect(screen.getByText('Start Analysis')).toBeTruthy();
    expect(screen.getByText('View all')).toBeTruthy();
  });

  it('EN modunda da 9 derin-link korunur', () => {
    const { container } = renderMenu('en');
    for (const href of DEEP_LINKS) {
      expect(container.querySelector(`a[href="${href}"]`), `eksik link: ${href}`).toBeTruthy();
    }
  });
});
