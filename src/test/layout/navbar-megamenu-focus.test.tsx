/**
 * Firefox e2e düzeltmesi — mega-menü klavye/focus ile açılır (a11y + cross-browser).
 *
 * Önceden mega-menü YALNIZCA onMouseEnter (hover) ile açılıyordu; bu hem klavye
 * kullanıcıları için bir erişilebilirlik bug'ı, hem de Firefox'ta Playwright
 * hover'ının kararsız kalmasının sebebiydi. Navbar artık trigger'a onFocus ile
 * de menüyü açıyor. Bu test, focus → panel görünür (opacity-100) dönüşümünü
 * jsdom'da (tarayıcıdan bağımsız) deterministik doğrular.
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
  // aria-hidden öğeyi erişilebilirlik ağacından çıkardığı için getByRole
  // güvenilmez; panele kararlı şekilde aria-label selector'ıyla erişiyoruz.
  const getPanel = (container: HTMLElement) =>
    container.querySelector('[aria-label="Hizmetler açılır paneli"]') as HTMLElement;

  it('services paneli başlangıçta kapalı (aria-hidden + opacity-0 + pointer-events-none)', () => {
    const { container } = renderNavbar();
    const panel = getPanel(container);
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.className).toContain('opacity-0');
    expect(panel.className).toContain('pointer-events-none');
    expect(panel.className).not.toContain('opacity-100');
  });

  it('services trigger focus alınca panel açılır (aria-hidden=false + opacity-100 + pointer-events-auto)', () => {
    const { container } = renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');

    // React onFocus = focusin (bubbles); fireEvent.focusIn doğru olanı tetikler.
    fireEvent.focusIn(trigger);

    const panel = getPanel(container);
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(panel.className).toContain('opacity-100');
    expect(panel.className).toContain('pointer-events-auto');
    expect(panel.className).not.toContain('opacity-0');
  });
});
