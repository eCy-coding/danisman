/**
 * AP3 — AdminDealsPage now wires the real /admin/deals endpoint instead of
 * a hardcoded empty MOCK_DEALS array. These tests cover the AP4
 * loading/error/empty states + confirm real deal data renders.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dnd-context">{children}</div>
    ),
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
    useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  };
});

const getMock = vi.fn();
const patchMock = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

import AdminDealsPage from './AdminDealsPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminDealsPage />
    </QueryClientProvider>,
  );
}

describe('AdminDealsPage', () => {
  beforeEach(() => {
    getMock.mockReset();
    patchMock.mockReset();
    patchMock.mockResolvedValue({ data: {} });
  });

  test('renders real deal names from /admin/deals', async () => {
    getMock.mockResolvedValue({
      data: {
        data: [
          {
            id: 'd1',
            name: 'Anadolu Sanayi A.Ş. satış süreci',
            type: 'SELL_SIDE',
            stage: 'DISCOVERY',
            transactionValueUsd: '50000000',
            successFeePct: '0.02',
            ownerId: 'user-1',
          },
        ],
      },
    });

    renderPage();
    expect(await screen.findByText('Anadolu Sanayi A.Ş. satış süreci')).toBeInTheDocument();
  });

  test('shows empty state when there are no deals', async () => {
    getMock.mockResolvedValue({ data: { data: [] } });
    renderPage();
    expect(await screen.findByText('Henüz M&A süreci yok')).toBeInTheDocument();
  });

  test('shows error state with retry on fetch failure', async () => {
    getMock.mockRejectedValue({ response: { data: { message: 'Sunucu hatası' } } });
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Sunucu hatası')).toBeInTheDocument();

    getMock.mockResolvedValue({ data: { data: [] } });
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() => expect(screen.getByText('Henüz M&A süreci yok')).toBeInTheDocument());
  });
});
