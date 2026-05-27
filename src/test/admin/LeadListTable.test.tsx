import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

const mockFetchNextPage = vi.fn();

vi.mock('../../hooks/useAdminLeads', () => ({
  useAdaylar: vi.fn(),
  useCreateAday: () => ({ mutate: vi.fn(), isPending: false }),
}));

import * as adminLeadsHooks from '../../hooks/useAdminLeads';
import { LeadListTable } from '../../components/admin/leads/LeadListTable';

const SAMPLE_RESULTS = [
  { id: 'p1', name: 'Ahmet Yılmaz', company: 'ACME Holding', status: 'New' },
  { id: 'p2', name: 'Ayşe Kaya', company: 'Beta Corp', status: 'Contacted' },
];

describe('LeadListTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNextPage.mockReset();
  });

  it('renders skeleton rows when loading', () => {
    vi.mocked(adminLeadsHooks.useAdaylar).mockReturnValue({
      data: undefined,
      isLoading: true,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
    } as never);

    render(<LeadListTable />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders aday rows from data', () => {
    vi.mocked(adminLeadsHooks.useAdaylar).mockReturnValue({
      data: {
        pages: [{ data: { results: SAMPLE_RESULTS, hasMore: false, nextCursor: null } }],
      },
      isLoading: false,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
    } as never);

    render(<LeadListTable />);
    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByText('ACME Holding')).toBeInTheDocument();
    expect(screen.getByText('Ayşe Kaya')).toBeInTheDocument();
  });

  it('shows "Daha Fazla Yükle" button when hasNextPage=true', () => {
    vi.mocked(adminLeadsHooks.useAdaylar).mockReturnValue({
      data: {
        pages: [{ data: { results: SAMPLE_RESULTS, hasMore: true, nextCursor: 'abc' } }],
      },
      isLoading: false,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
    } as never);

    render(<LeadListTable />);
    expect(screen.getByRole('button', { name: /daha fazla yükle/i })).toBeInTheDocument();
  });

  it('calls fetchNextPage when "Daha Fazla Yükle" clicked', () => {
    vi.mocked(adminLeadsHooks.useAdaylar).mockReturnValue({
      data: {
        pages: [{ data: { results: SAMPLE_RESULTS, hasMore: true, nextCursor: 'abc' } }],
      },
      isLoading: false,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
    } as never);

    render(<LeadListTable />);
    fireEvent.click(screen.getByRole('button', { name: /daha fazla yükle/i }));
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not show "Daha Fazla Yükle" when hasNextPage=false', () => {
    vi.mocked(adminLeadsHooks.useAdaylar).mockReturnValue({
      data: {
        pages: [{ data: { results: SAMPLE_RESULTS, hasMore: false, nextCursor: null } }],
      },
      isLoading: false,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
    } as never);

    render(<LeadListTable />);
    expect(screen.queryByRole('button', { name: /daha fazla yükle/i })).not.toBeInTheDocument();
  });
});
