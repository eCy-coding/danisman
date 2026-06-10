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
  it('services paneli başlangıçta kapalı (opacity-0)', () => {
    renderNavbar();
    const panel = screen.getByRole('region', { name: 'Hizmetler açılır paneli' });
    expect(panel.className).toContain('opacity-0');
    expect(panel.className).not.toContain('opacity-100');
  });

  it('services trigger focus alınca panel açılır (opacity-100)', () => {
    renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');
    const panel = screen.getByRole('region', { name: 'Hizmetler açılır paneli' });

    // React onFocus = focusin (bubbles); fireEvent.focusIn doğru olanı tetikler.
    fireEvent.focusIn(trigger);

    expect(panel.className).toContain('opacity-100');
    expect(panel.className).not.toContain('opacity-0');
  });
});
