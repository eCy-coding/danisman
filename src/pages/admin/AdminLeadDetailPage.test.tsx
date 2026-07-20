/**
 * AP4 — AdminLeadDetailPage error states (contact fetch + notes fetch),
 * plus the honest "score not computed" label replacing "Skor (stub)".
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getMock = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import { AdminLeadDetailPage } from './AdminLeadDetailPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/contacts/c1']}>
        <Routes>
          <Route path="/admin/contacts/:id" element={<AdminLeadDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminLeadDetailPage', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  test('shows error state with retry when the contact fetch fails', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/contacts/c1') {
        return Promise.reject({ response: { data: { message: 'Lead getirilemedi' } } });
      }
      return Promise.resolve({ data: { status: 'ok', data: [] } });
    });

    renderPage();
    expect(await screen.findByText('Lead getirilemedi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yeniden dene/i })).toBeInTheDocument();
  });

  test('renders honest "score not computed" label instead of a fabricated score', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/contacts/c1') {
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              id: 'c1',
              fullName: 'Ayşe Yıldız',
              email: 'ayse@x.com',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      if (url === '/admin/leads/c1/notes') {
        return Promise.resolve({ data: { status: 'ok', data: [] } });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    renderPage();
    expect(await screen.findByRole('heading', { name: 'Ayşe Yıldız' })).toBeInTheDocument();
    expect(screen.getByText('Skor')).toBeInTheDocument();
    expect(screen.queryByText(/Skor \(stub\)/)).not.toBeInTheDocument();
  });

  test('shows error state for notes when the notes fetch fails', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/contacts/c1') {
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              id: 'c1',
              fullName: 'Ayşe Yıldız',
              email: 'ayse@x.com',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      if (url === '/admin/leads/c1/notes') {
        return Promise.reject({ response: { data: { message: 'Notlar getirilemedi' } } });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    renderPage();
    expect(await screen.findByText('Notlar getirilemedi')).toBeInTheDocument();
  });
});
