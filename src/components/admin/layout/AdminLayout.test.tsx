/**
 * M8 — Mobile responsive tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Stub heavy dependencies
vi.mock('../../../hooks/useAdminShortcuts', () => ({
  useAdminShortcuts: () => ({ helpModalOpen: false, setHelpModalOpen: vi.fn() }),
  ALL_SHORTCUTS: [],
  openAdminHelpModal: vi.fn(),
}));
vi.mock('./AdminSidebar', () => ({
  AdminSidebar: () => <nav data-testid="admin-sidebar">Sidebar</nav>,
}));
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, Outlet: () => <div data-testid="outlet" /> };
});

import { AdminLayout } from './AdminLayout';

const renderLayout = () =>
  render(
    <MemoryRouter>
      <AdminLayout />
    </MemoryRouter>,
  );

describe('M8 — Mobile responsive layout', () => {
  it('renders hamburger button in mobile header', () => {
    renderLayout();
    expect(screen.getByTestId('hamburger-btn')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Menüyü Aç' })).toBeDefined();
  });

  it('sidebar overlay appears when hamburger clicked', () => {
    renderLayout();
    expect(screen.queryByTestId('sidebar-overlay')).toBeNull();
    fireEvent.click(screen.getByTestId('hamburger-btn'));
    expect(screen.getByTestId('sidebar-overlay')).toBeDefined();
  });

  it('sidebar overlay click closes sidebar', () => {
    renderLayout();
    fireEvent.click(screen.getByTestId('hamburger-btn'));
    const overlay = screen.getByTestId('sidebar-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByTestId('sidebar-overlay')).toBeNull();
  });
});
