/**
 * Firefox e2e düzeltmesi — mega-menü klavye/focus ile açılır (a11y + cross-browser).
 *
 * Önceden mega-menü YALNIZCA onMouseEnter (hover) ile açılıyordu; bu hem klavye
 * kullanıcıları için bir erişilebilirlik bug'ı, hem de Firefox'ta Playwright
 * hover'ının kararsız kalmasının sebebiydi. Navbar artık trigger'a onFocus ile
 * de menüyü açıyor. Bu test, focus → panel görünür (opacity-100) dönüşümünü
 * jsdom'da (tarayıcıdan bağımsız) deterministik doğrular.
 *
 * merge 2026-06-12: panel aria-hidden → APG disclosure kontratı. Açık/kapalı
 * durum artık trigger'da (aria-expanded + aria-controls) yaşıyor; kapalı panel
 * `invisible` sınıfıyla erişilebilirlik ağacından çıkıyor (MegaMenu.tsx).
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { Navbar } from '@/components/layout/Navbar';

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );

describe('Navbar mega-menü — focus ile açılma (a11y)', () => {
  // Kapalı panel `invisible` ile erişilebilirlik ağacından çıktığı için
  // getByRole güvenilmez; panele kararlı şekilde aria-label ile erişiyoruz.
  const getPanel = (container: HTMLElement) =>
    container.querySelector('[aria-label="Hizmetler açılır paneli"]') as HTMLElement;

  it('services paneli başlangıçta kapalı (aria-expanded=false + opacity-0 + pointer-events-none)', () => {
    const { container } = renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');
    const panel = getPanel(container);
    expect(panel).toBeTruthy();
    // merge 2026-06-12: aria-hidden=true → trigger aria-expanded=false +
    // aria-controls ↔ panel id eşleşmesi (APG disclosure).
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('mega-menu-services');
    expect(panel.id).toBe('mega-menu-services');
    expect(panel.className).toContain('opacity-0');
    expect(panel.className).toContain('pointer-events-none');
    expect(panel.classList.contains('invisible')).toBe(true);
    expect(panel.className).not.toContain('opacity-100');
  });

  it('services trigger focus alınca panel açılır (aria-expanded=true + opacity-100 + pointer-events aktif)', () => {
    const { container } = renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');

    fireEvent.focus(trigger);

    const panel = getPanel(container);
    // merge 2026-06-12: aria-hidden=false → trigger aria-expanded=true;
    // pointer-events-auto sınıfı yok — açık durumda pointer-events-none düşer.
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.className).toContain('opacity-100');
    expect(panel.classList.contains('visible')).toBe(true);
    expect(panel.classList.contains('invisible')).toBe(false);
    expect(panel.className).not.toContain('opacity-0');
    expect(panel.className).not.toContain('pointer-events-none');
  });
});
