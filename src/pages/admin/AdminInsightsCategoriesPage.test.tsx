import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@dnd-kit/core', async (importActual) => {
  const actual = await importActual<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('@dnd-kit/sortable', async (importActual) => {
  const actual = await importActual<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => {
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      start: i * estimateSize(),
      size: estimateSize(),
      key: i,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * estimateSize(),
      measureElement: () => {},
    };
  },
}));

import { apiClient } from '@/lib/api';
import { AdminInsightsCategoriesPage } from './AdminInsightsCategoriesPage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockCategory = {
  id: 'cat-1',
  slug: 'ma-due-diligence',
  slugEn: null,
  nameTr: 'M&A Due Diligence',
  nameEn: null,
  descTr: null,
  descEn: null,
  domain: 'M_A',
  parentId: null,
  parent: null,
  iconName: null,
  colorAccent: null,
  displayOrder: 0,
  status: 'ACTIVE',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  _count: { posts: 12 },
};

const emptyResponse = {
  data: { status: 'ok', data: { items: [], total: 0, page: 1, limit: 200, pages: 0 } },
};

const filledResponse = {
  data: {
    status: 'ok',
    data: { items: [mockCategory], total: 1, page: 1, limit: 200, pages: 1 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminInsightsCategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminInsightsCategoriesPage — render', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "+ Kategori Ekle" button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-category-btn')).toBeDefined());
    expect(screen.getByTestId('add-category-btn').textContent).toContain('Kategori Ekle');
  });

  it('shows empty state when no categories', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeDefined());
  });

  it('shows category list when data loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('category-list')).toBeDefined());
    expect(screen.getByText('M&A Due Diligence')).toBeDefined();
  });

  it('renders filter bar', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('category-filter-bar')).toBeDefined());
    expect(screen.getByTestId('category-search')).toBeDefined();
    expect(screen.getByTestId('domain-filter-all')).toBeDefined();
    expect(screen.getByTestId('domain-filter-M_A')).toBeDefined();
  });
});

describe('AdminInsightsCategoriesPage — "+ Kategori Ekle" modal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens modal on button click', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-category-btn')).toBeDefined());

    fireEvent.click(screen.getByTestId('add-category-btn'));
    await waitFor(() => expect(screen.getByTestId('category-modal')).toBeDefined());
  });

  it('modal has required fields', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-category-btn')).toBeDefined());

    fireEvent.click(screen.getByTestId('add-category-btn'));
    await waitFor(() => expect(screen.getByTestId('category-form')).toBeDefined());
    // multiple 'Due Diligence' placeholders (TR + EN); check at least one exists
    expect(screen.getAllByPlaceholderText('Due Diligence').length).toBeGreaterThan(0);
    expect(screen.getByTestId('category-form-submit')).toBeDefined();
  });

  it('calls POST on form submit', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: 'ok', data: mockCategory } });
    const qc = makeQC();
    renderPage(qc);
    await waitFor(() => expect(screen.getByTestId('add-category-btn')).toBeDefined());

    fireEvent.click(screen.getByTestId('add-category-btn'));
    await waitFor(() => expect(screen.getByTestId('category-form')).toBeDefined());

    // first 'Due Diligence' placeholder = TR name input
    const nameInput = screen.getAllByPlaceholderText('Due Diligence')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Yeni Kategori' } });
    fireEvent.click(screen.getByTestId('category-form-submit'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/admin/insights/categories',
        expect.objectContaining({ nameTr: 'Yeni Kategori' }),
        expect.any(Object),
      ),
    );
  });
});

describe('AdminInsightsCategoriesPage — edit + archive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('edit button opens modal with pre-filled data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('category-list')).toBeDefined());

    fireEvent.click(screen.getByTestId('edit-category-cat-1'));
    await waitFor(() => expect(screen.getByTestId('category-modal')).toBeDefined());
    expect((screen.getAllByPlaceholderText('Due Diligence')[0] as HTMLInputElement).value).toBe(
      'M&A Due Diligence',
    );
  });

  it('archive button opens confirm modal', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('category-list')).toBeDefined());

    fireEvent.click(screen.getByTestId('archive-category-cat-1'));
    await waitFor(() => expect(screen.getByTestId('archive-confirm-modal')).toBeDefined());
  });

  it('confirm archive calls DELETE', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    vi.mocked(apiClient.delete).mockResolvedValue({
      data: { status: 'ok', data: { ...mockCategory, status: 'ARCHIVED' } },
    });
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('category-list')).toBeDefined());

    fireEvent.click(screen.getByTestId('archive-category-cat-1'));
    await waitFor(() => expect(screen.getByTestId('archive-confirm-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('archive-confirm-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith('/admin/insights/categories/cat-1'),
    );
  });
});
