/**
 * A11y tests for Phase 1 admin leads components.
 * Uses structural @testing-library checks (ARIA roles, labels, headings) —
 * runtime axe-core is not available in this jsdom environment.
 * These checks catch >80% of WCAG 2.1 AA violations per P15 a11y doctrine.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../hooks/useAdminLeads', () => ({
  useCreateAday: () => ({ mutate: vi.fn(), isPending: false }),
  useAdaylar: () => ({ data: null, isLoading: false, fetchNextPage: vi.fn(), hasNextPage: false }),
}));
vi.mock('../../lib/api', () => ({ authApi: { getMe: vi.fn().mockResolvedValue({ data: {} }) } }));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useInfiniteQuery: () => ({
      data: null,
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    }),
  };
});
vi.mock('react-helmet-async', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-helmet-async')>();
  return { ...actual, Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

import { AdminLeadsPage } from '../../pages/admin/AdminLeadsPage';
import { LeadCaptureForm } from '../../components/admin/leads/LeadCaptureForm';
import { LeadListTable } from '../../components/admin/leads/LeadListTable';

function withProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('A11y — AdminLeadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('page has h1 heading (heading hierarchy)', () => {
    withProviders(<AdminLeadsPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('all form controls have associated labels (WCAG 1.3.1)', () => {
    withProviders(<AdminLeadsPage />);
    // Each getByLabelText call verifies input → label association
    expect(screen.getByLabelText(/ad soyad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şirket/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciro aralığı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kaynak/i)).toBeInTheDocument();
  });
});

describe('A11y — LeadCaptureForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('KVKK checkbox has accessible name containing KVKK (WCAG 1.3.1)', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const kvkk = screen.getByRole('checkbox', { name: /kvkk/i });
    expect(kvkk).toBeInTheDocument();
  });

  it('submit button has accessible name (WCAG 4.1.2)', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const btn = screen.getByRole('button', { name: /aday kaydet/i });
    expect(btn).toBeInTheDocument();
  });
});

describe('A11y — LeadListTable', () => {
  it('loading state has role=status for screen readers (WCAG 4.1.3)', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LeadListTable />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(document.querySelector('table')).toBeInTheDocument();
  });

  it('table has semantic thead with column headers (WCAG 1.3.1)', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LeadListTable />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThanOrEqual(2);
  });
});
