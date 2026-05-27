/**
 * Phase 5.5 — AdminSidebar carry-over tests
 * P2: ThemeToggle wired in sidebar footer
 * P3: LanguageToggle wired in sidebar footer
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({ logout: vi.fn() }),
}));
vi.mock('../../../hooks/useCan', () => ({
  useCan: () => () => true,
}));
vi.mock('../../../hooks/useAdminShortcuts', () => ({
  openAdminHelpModal: vi.fn(),
}));
vi.mock('../CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
}));
vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" aria-label="Tema" />,
}));
vi.mock('../LanguageToggle', () => ({
  LanguageToggle: () => <div data-testid="language-toggle" />,
}));

import { AdminSidebar } from './AdminSidebar';

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <AdminSidebar />
    </MemoryRouter>,
  );

describe('AdminSidebar Phase 5.5 — ThemeToggle + LanguageToggle wiring', () => {
  it('renders ThemeToggle in sidebar footer', () => {
    renderSidebar();
    expect(screen.getByTestId('theme-toggle')).toBeDefined();
  });

  it('renders LanguageToggle in sidebar footer', () => {
    renderSidebar();
    expect(screen.getByTestId('language-toggle')).toBeDefined();
  });

  it('CommandPalette still renders (P1 preserved)', () => {
    renderSidebar();
    expect(screen.getByTestId('command-palette')).toBeDefined();
  });

  it('Logout button still renders after toggle additions', () => {
    renderSidebar();
    expect(screen.getByText('Logout')).toBeDefined();
  });
});
