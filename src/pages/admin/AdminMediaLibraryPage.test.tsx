/**
 * AP4 — AdminMediaLibraryPage already talked to the real /admin/media
 * endpoint (no fabricated data) but had no error state for a failed list
 * fetch. These tests cover the new loading/error/empty branches.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getMock = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { AdminMediaLibraryPage } from './AdminMediaLibraryPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminMediaLibraryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminMediaLibraryPage', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  test('renders real media items from /admin/media', async () => {
    getMock.mockResolvedValue({
      data: {
        status: 'ok',
        data: {
          items: [
            {
              id: 'm1',
              filename: 'gercek-gorsel.png',
              url: '/x.png',
              mimetype: 'image/png',
              size: 10,
              createdAt: 1,
            },
          ],
          total: 1,
        },
      },
    });
    renderPage();
    expect(await screen.findByText('gercek-gorsel.png')).toBeInTheDocument();
  });

  test('shows empty state when there are no items', async () => {
    getMock.mockResolvedValue({ data: { status: 'ok', data: { items: [], total: 0 } } });
    renderPage();
    expect(await screen.findByText('Henüz görsel yok')).toBeInTheDocument();
  });

  test('shows error state with retry when the list fetch fails', async () => {
    getMock.mockRejectedValue({ response: { data: { message: 'Medya servisi kapalı' } } });
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Medya servisi kapalı')).toBeInTheDocument();

    getMock.mockResolvedValue({ data: { status: 'ok', data: { items: [], total: 0 } } });
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() => expect(screen.getByText('Henüz görsel yok')).toBeInTheDocument());
  });
});
