/**
 * AP3 — AdminRetainersPage now wires the real /admin/retainers +
 * /admin/deals endpoints instead of MOCK_RETAINERS (fabricated companies
 * "Örnek A.Ş." / "Demo Ltd." / "Test Corp."). These tests guard against
 * regressing back to fake data and cover the AP4 loading/error/empty states.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getMock = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { AdminRetainersPage } from './AdminRetainersPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminRetainersPage />
    </QueryClientProvider>,
  );
}

describe('AdminRetainersPage', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  test('renders real deal names joined from /admin/deals — no fabricated companies', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/retainers') {
        return Promise.resolve({
          data: {
            data: [
              { id: 'r1', dealId: 'd1', currency: 'USD', monthlyAmount: '4500', status: 'ACTIVE' },
            ],
          },
        });
      }
      if (url === '/admin/deals') {
        return Promise.resolve({
          data: { data: [{ id: 'd1', name: 'Gerçek Müvekkil Holding' }] },
        });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    renderPage();

    expect(await screen.findByText('Gerçek Müvekkil Holding')).toBeInTheDocument();
    expect(screen.queryByText(/Örnek A\.Ş\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Ltd\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Test Corp\./)).not.toBeInTheDocument();
  });

  test('falls back to a deal-id label (not a fabricated name) when the deal lookup misses', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/retainers') {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'r1',
                dealId: 'unmatched-deal-id',
                currency: 'USD',
                monthlyAmount: '1000',
                status: 'ACTIVE',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderPage();

    expect(await screen.findByText(/Anlaşma unmatch/)).toBeInTheDocument();
  });

  test('shows empty state when there are no retainers', async () => {
    getMock.mockResolvedValue({ data: { data: [] } });
    renderPage();
    expect(await screen.findByText('Henüz aylık anlaşma yok')).toBeInTheDocument();
  });

  test('shows error state with retry when the fetch fails', async () => {
    getMock.mockRejectedValue({ response: { data: { message: 'Yetkisiz erişim' } } });
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Yetkisiz erişim')).toBeInTheDocument();

    getMock.mockResolvedValue({ data: { data: [] } });
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() => expect(screen.getByText('Henüz aylık anlaşma yok')).toBeInTheDocument());
  });
});
