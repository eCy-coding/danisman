/**
 * Direct unit tests for useAdminLeads hook functions.
 * Exercises real hook code (not mocked) by mocking fetch.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { useCreateAday, useAdaylar } from '../../hooks/useAdminLeads';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useCreateAday', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('mutate calls POST /api/admin/leads', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: { id: 'p1', status: 'New' } }),
    });

    const { result } = renderHook(() => useCreateAday(), { wrapper });

    await act(async () => {
      result.current.mutate({
        name: 'Ahmet',
        email: 'ahmet@example.com',
        company: 'ACME',
        revenueRange: '100M-300M USD',
        serviceInterest: ['M&A advisory'],
        source: 'Direct',
        kvkkConsent: true,
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/leads',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('mutation throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Hata oluştu' }),
    });

    const { result } = renderHook(() => useCreateAday(), { wrapper });
    let errorCaught = false;

    await act(async () => {
      result.current.mutate(
        {
          name: 'A',
          email: 'a@b.com',
          company: 'C',
          revenueRange: '100M-300M USD',
          serviceInterest: ['M&A advisory'],
          source: 'Direct',
          kvkkConsent: true,
        },
        {
          onError: () => {
            errorCaught = true;
          },
        },
      );
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(errorCaught).toBe(true);
  });
});

describe('useAdaylar', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches first page from /api/admin/leads', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            results: [{ id: 'p1', name: 'Ahmet', company: 'ACME', status: 'New' }],
            hasMore: false,
            nextCursor: null,
          },
        }),
    });

    const { result } = renderHook(() => useAdaylar(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstPage = result.current.data?.pages[0];
    expect((firstPage as { data?: { results?: unknown[] } })?.data?.results).toHaveLength(1);
  });

  it('getNextPageParam returns nextCursor from last page', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { results: [], hasMore: true, nextCursor: 'cursor-xyz' },
        }),
    });

    const { result } = renderHook(() => useAdaylar(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasNextPage).toBe(true);
  });
});
