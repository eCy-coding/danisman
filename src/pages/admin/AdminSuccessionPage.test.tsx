/**
 * AP3/AP4 — AdminSuccessionPage already talked to the real
 * /api/admin/succession-roadmaps endpoint (genuine stub — no fabricated
 * data), but had no error state and no explicit empty state. These tests
 * cover the new branches.
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

import { AdminSuccessionPage } from './AdminSuccessionPage';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminSuccessionPage />
    </QueryClientProvider>,
  );
}

describe('AdminSuccessionPage', () => {
  beforeEach(() => {
    adminFetchMock.mockReset();
  });

  test('shows empty state when there are no roadmaps', async () => {
    adminFetchMock.mockReturnValue(jsonResponse({ data: [] }));
    renderPage();
    expect(await screen.findByText('Henüz veraset planı yok')).toBeInTheDocument();
  });

  test('shows error state with retry when the fetch fails', async () => {
    adminFetchMock.mockReturnValue(jsonResponse({}, false, 500));
    renderPage();

    expect(await screen.findByText('Veraset planları yüklenemedi')).toBeInTheDocument();

    adminFetchMock.mockReturnValue(jsonResponse({ data: [] }));
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() => expect(screen.getByText('Henüz veraset planı yok')).toBeInTheDocument());
  });

  test('renders real roadmap client names', async () => {
    adminFetchMock.mockReturnValue(
      jsonResponse({
        data: [
          {
            id: 's1',
            clientId: 'c1',
            clientName: 'Doğan Aile Holding',
            generationFrom: 1,
            generationTo: 2,
            status: 'PLANNING',
            milestones: [],
            kpis: [],
          },
        ],
      }),
    );
    renderPage();
    expect(await screen.findByText('Doğan Aile Holding')).toBeInTheDocument();
  });
});
