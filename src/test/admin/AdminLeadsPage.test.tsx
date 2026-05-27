import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

// Mock API call
vi.mock('../../lib/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useInfiniteQuery: () => ({
      data: null,
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    }),
  };
});

vi.mock('../../hooks/useAdminLeads', () => ({
  useCreateAday: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAdaylar: () => ({
    data: null,
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
  }),
}));

// Silence react-helmet warning in test
vi.mock('react-helmet-async', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-helmet-async')>();
  return { ...actual, Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

import { AdminLeadsPage } from '../../pages/admin/AdminLeadsPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AdminLeadsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('AdminLeadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with required fields and KVKK consent checkbox', () => {
    renderPage();
    expect(screen.getByLabelText(/ad soyad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şirket/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciro aralığı/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /kvkk/i })).toBeInTheDocument();
  });

  it('shows conditional satın alma yetki field for high revenue', async () => {
    renderPage();
    const select = screen.getByLabelText(/ciro aralığı/i);
    await userEvent.selectOptions(select, '501M-1000M USD');
    expect(screen.getByLabelText(/satın alma kararı/i)).toBeInTheDocument();
  });

  it('submit button disabled until KVKK consent checked', async () => {
    renderPage();
    const submitBtn = screen.getByRole('button', { name: /aday kaydet/i });
    // Initially disabled (form not filled)
    expect(submitBtn).toBeDisabled();
  });

  it('submit button enabled when all required fields filled + KVKK checked', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/ad soyad/i), 'Ahmet Yılmaz');
    await userEvent.type(screen.getByLabelText(/e-posta/i), 'ahmet@example.com');
    await userEvent.type(screen.getByLabelText(/şirket/i), 'ACME Holding');
    await userEvent.selectOptions(screen.getByLabelText(/ciro aralığı/i), '100M-300M USD');
    // Service interest checkbox
    const serviceCheckboxes = screen.getAllByRole('checkbox');
    const kvkkBox = screen.getByRole('checkbox', { name: /kvkk/i });
    // Check first service
    const firstServiceBox = serviceCheckboxes.find((cb) => cb !== kvkkBox);
    if (firstServiceBox) await userEvent.click(firstServiceBox);
    await userEvent.selectOptions(screen.getByLabelText(/kaynak/i), 'Direct');
    // Check KVKK
    await userEvent.click(kvkkBox);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aday kaydet/i })).not.toBeDisabled();
    });
  });

  it('does not show conditional field for low revenue', async () => {
    renderPage();
    await userEvent.selectOptions(screen.getByLabelText(/ciro aralığı/i), '100M-300M USD');
    expect(screen.queryByLabelText(/satın alma kararı/i)).not.toBeInTheDocument();
  });
});
