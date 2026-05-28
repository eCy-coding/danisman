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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
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
import { AdminInsightsPostsPage } from './AdminInsightsPostsPage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPost = {
  id: 'post-1',
  slug: 'ma-due-diligence-rehberi',
  titleTr: 'M&A Due Diligence Rehberi',
  titleEn: null,
  status: 'DRAFT',
  primaryDomain: 'M_A',
  subDomain: 'due-diligence',
  authorId: 'author-1',
  author: { nameTr: 'Emre Can Yalçın', slug: 'emre-can-yalcin' },
  viewCount: 0,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isFeatured: false,
  isEditorsPick: false,
};

const emptyResponse = {
  data: { status: 'ok', data: { items: [], total: 0, page: 1, limit: 50, pages: 0 } },
};

const filledResponse = {
  data: {
    status: 'ok',
    data: { items: [mockPost], total: 1, page: 1, limit: 50, pages: 1 },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminInsightsPostsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminInsightsPostsPage — render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders "+ Yazı Ekle" button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-post-btn')).toBeDefined());
    expect(screen.getByTestId('add-post-btn').textContent).toContain('Yazı Ekle');
  });

  it('shows empty state when no posts', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-empty-state')).toBeDefined());
  });

  it('shows posts table when data loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-table')).toBeDefined());
    expect(screen.getByText('M&A Due Diligence Rehberi')).toBeDefined();
  });

  it('renders filter bar with domain and status pills', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-filter-bar')).toBeDefined());
    expect(screen.getByTestId('posts-search')).toBeDefined();
    expect(screen.getByTestId('domain-filter-all')).toBeDefined();
    expect(screen.getByTestId('domain-filter-M_A')).toBeDefined();
    expect(screen.getByTestId('status-filter-all')).toBeDefined();
    expect(screen.getByTestId('status-filter-DRAFT')).toBeDefined();
  });
});

describe('AdminInsightsPostsPage — navigate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('+ Yazı Ekle navigates to new post editor', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-post-btn')).toBeDefined());

    fireEvent.click(screen.getByTestId('add-post-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/insights/posts/new');
  });

  it('edit button navigates to post editor', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-table')).toBeDefined());

    fireEvent.click(screen.getByTestId('edit-post-post-1'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/insights/posts/post-1/edit');
  });
});

describe('AdminInsightsPostsPage — archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('archive button opens confirm modal', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-table')).toBeDefined());

    fireEvent.click(screen.getByTestId('archive-post-post-1'));
    await waitFor(() => expect(screen.getByTestId('post-archive-confirm-modal')).toBeDefined());
  });

  it('confirm archive calls DELETE', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(filledResponse);
    vi.mocked(apiClient.delete).mockResolvedValue({
      data: { status: 'ok', data: { ...mockPost, status: 'ARCHIVED' } },
    });
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('posts-table')).toBeDefined());

    fireEvent.click(screen.getByTestId('archive-post-post-1'));
    await waitFor(() => expect(screen.getByTestId('post-archive-confirm-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('post-archive-confirm-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith('/admin/insights/posts/post-1'),
    );
  });
});
