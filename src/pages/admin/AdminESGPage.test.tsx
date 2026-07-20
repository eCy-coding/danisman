/**
 * AP3/AP4 — AdminESGPage already talked to the real /api/admin/esg/datapoints
 * endpoint (genuine stub — no fabricated data), but had no error state and
 * no explicit empty state when the catalogue is unseeded. These tests cover
 * the new branches.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const adminFetchMock = vi.fn();
vi.mock('../../lib/admin-fetch', () => ({
  adminFetch: (...args: unknown[]) => adminFetchMock(...args),
}));

import { AdminESGPage } from './AdminESGPage';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminESGPage />
    </QueryClientProvider>,
  );
}

describe('AdminESGPage', () => {
  beforeEach(() => {
    adminFetchMock.mockReset();
  });

  test('shows empty state when the datapoint catalogue is unseeded', async () => {
    adminFetchMock.mockReturnValue(jsonResponse({ data: [] }));
    renderPage();
    expect(await screen.findByText('ESG veri kümesi henüz yüklenmedi')).toBeInTheDocument();
  });

  test('shows error state with retry when the fetch fails', async () => {
    adminFetchMock.mockReturnValue(jsonResponse({}, false, 500));
    renderPage();

    expect(await screen.findByText('ESG veri kümesi yüklenemedi')).toBeInTheDocument();

    adminFetchMock.mockReturnValue(jsonResponse({ data: [] }));
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() =>
      expect(screen.getByText('ESG veri kümesi henüz yüklenmedi')).toBeInTheDocument(),
    );
  });

  test('renders real datapoints', async () => {
    adminFetchMock.mockReturnValue(
      jsonResponse({
        data: [
          {
            id: 'e1',
            esrsCode: 'E1-1',
            pillar: 'ENVIRONMENTAL',
            category: 'İklim',
            topic: 'Emisyon',
            metricName: 'Sera gazı emisyonu',
            isDoubleMaterial: true,
            isMandatory: true,
          },
        ],
      }),
    );
    renderPage();
    expect(await screen.findByText('Sera gazı emisyonu')).toBeInTheDocument();
  });
});
