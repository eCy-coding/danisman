/**
 * Phase 5.5 — AdminContactsPage FilterBuilder adoption tests (P5)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: { status: 'ok', data: { items: [], total: 0, page: 1, limit: 100 } },
    }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../hooks/useAdminEvents', () => ({
  useAdminEvents: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AdminContactsPage } from './AdminContactsPage';

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = (qc: QueryClient) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminContactsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('AdminContactsPage — FilterBuilder adoption (P5)', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = makeQC();
  });

  it('renders FilterBuilder container with role=search', async () => {
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('contacts-filter-builder')).toBeDefined());
  });

  it('renders text search filter inside FilterBuilder', async () => {
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('contacts-filter-builder')).toBeDefined());
    expect(screen.getByRole('searchbox')).toBeDefined();
  });

  it('renders read status select filter inside FilterBuilder', async () => {
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('contacts-filter-builder')).toBeDefined());
    expect(screen.getByRole('combobox')).toBeDefined();
  });
});
