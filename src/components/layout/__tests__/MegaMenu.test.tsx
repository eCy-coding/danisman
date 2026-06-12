/**
 * SVC P5 — Services mega menu: APG Disclosure Navigation contract.
 *
 * Panel facts (registry-driven render, unique content-true targets, opaque
 * surface, no ARIA menu-role misuse) + trigger semantics (aria-expanded /
 * aria-controls / Esc closes AND returns focus — APG disclosure pattern).
 * Written test-first; Esc-focus-return + role-removal were RED pre-impl.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { MegaMenu } from '@/components/layout/MegaMenu';
import { Navbar } from '@/components/layout/Navbar';
import { SERVICES_MEGA_MENU } from '@/data/service-taxonomy';

const renderPanel = (isOpen = true) =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <MegaMenu
          menuId="services"
          isOpen={isOpen}
          lang="tr"
          onClose={() => {}}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
      </MemoryRouter>
    </HelmetProvider>,
  );

const renderNavbar = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('MegaMenu services panel — registry render', () => {
  it('renders all 3 sections and 9 items from the taxonomy registry', () => {
    renderPanel();
    for (const section of SERVICES_MEGA_MENU.sections) {
      expect(screen.getByText(section.title.tr)).toBeTruthy();
      for (const item of section.items) {
        expect(screen.getByText(item.label.tr)).toBeTruthy();
      }
    }
  });

  it('9 links, 9 unique hrefs, zero dead/duplicate targets', () => {
    renderPanel();
    const panel = screen.getByTestId('mega-menu-services');
    const hrefs = Array.from(panel.querySelectorAll('a'))
      .map((a) => a.getAttribute('href'))
      .filter((h): h is string => !!h && h.startsWith('/services/'));
    expect(hrefs).toHaveLength(9);
    expect(new Set(hrefs).size).toBe(9);
  });

  it('renders the featured assessment card linking to /maturity-assessment', () => {
    renderPanel();
    const panel = screen.getByTestId('mega-menu-services');
    const featured = Array.from(panel.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === '/maturity-assessment',
    );
    expect(featured).toBeTruthy();
  });

  it('is a labelled region whose id matches the trigger aria-controls contract', () => {
    renderPanel();
    const panel = screen.getByTestId('mega-menu-services');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.id).toBe('mega-menu-services');
    expect(panel.getAttribute('aria-label')).toBeTruthy();
  });

  it('does NOT misuse ARIA menu roles (APG disclosure = plain link lists)', () => {
    renderPanel();
    const panel = screen.getByTestId('mega-menu-services');
    expect(panel.querySelectorAll('[role="menu"], [role="menuitem"]')).toHaveLength(0);
  });

  it('panel surface is fully opaque (doctrine: no translucent ghosting under H1)', () => {
    renderPanel();
    const panel = screen.getByTestId('mega-menu-services');
    const surface = panel.querySelector('.rounded-2xl');
    expect(surface?.className).toContain('bg-[#0a0f1c]');
    expect(surface?.className).not.toContain('bg-[#0a0f1c]/');
  });
});

describe('Navbar services trigger — disclosure semantics', () => {
  it('trigger exposes aria-haspopup, aria-controls and toggles aria-expanded on focus', () => {
    renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('mega-menu-services');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.focus(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('Escape closes the panel AND returns focus to the trigger (APG)', () => {
    renderNavbar();
    const trigger = screen.getByTestId('navbar-link-services');
    fireEvent.focus(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });
});
