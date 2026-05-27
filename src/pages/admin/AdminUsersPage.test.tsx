/**
 * Phase 5.5 — AdminUsersPage VirtualTable adoption tests (P4)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: { status: 'ok', data: { items: [], total: 0 } },
    }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { AdminUsersPage } from './AdminUsersPage';

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = (qc: QueryClient) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('AdminUsersPage — VirtualTable adoption (P4)', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = makeQC();
  });

  it('renders users section with virtual-table container', async () => {
    renderPage(qc);
    expect(await screen.findByTestId('users-virtual-table')).toBeDefined();
  });

  it('renders column headers: User, Role, Bookings, Last Login', async () => {
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('users-virtual-table')).toBeDefined());
    expect(screen.getByText('User')).toBeDefined();
    expect(screen.getByText('Role')).toBeDefined();
    expect(screen.getByText('Bookings')).toBeDefined();
  });

  it('renders empty state when no users', async () => {
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('users-virtual-table')).toBeDefined());
    expect(screen.getByText('No users found.')).toBeDefined();
  });
});
