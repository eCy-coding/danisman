import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

import { apiClient } from '@/lib/api';
import { AdminInsightsPostEditPage } from './AdminInsightsPostEditPage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPost = {
  id: 'post-1',
  slug: 'ma-due-diligence-rehberi',
  type: 'ANALYSIS',
  titleTr: 'M&A Due Diligence Rehberi',
  titleEn: null,
  excerptTr: 'Özet metni',
  excerptEn: null,
  bodyTrMdx: '# İçerik\n\nLorem ipsum.',
  bodyEnMdx: null,
  status: 'DRAFT',
  primaryDomain: 'M_A',
  subDomain: 'due-diligence',
  authorId: 'author-1',
  coverImageUrl: 'https://example.com/cover.jpg',
  coverImageAlt: 'Cover alt',
  publishedAt: null,
  isFeatured: false,
  isEditorsPick: false,
  language: 'TR_ONLY',
};

const mockPostResponse = {
  data: { status: 'ok', data: mockPost },
};

const emptyListResponse = {
  data: { status: 'ok', data: { items: [], total: 0 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderNew(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/insights/posts/new']}>
        <Routes>
          <Route path="/admin/insights/posts/new" element={<AdminInsightsPostEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderEdit(qc: QueryClient, postId = 'post-1') {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/admin/insights/posts/${postId}/edit`]}>
        <Routes>
          <Route path="/admin/insights/posts/:id/edit" element={<AdminInsightsPostEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminInsightsPostEditPage — new post', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders "Yeni Yazı" heading and 3 tabs', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyListResponse);
    renderNew(makeQC());
    await waitFor(() => expect(screen.getByTestId('post-edit-page')).toBeDefined());
    expect(screen.getByTestId('post-edit-page').textContent).toContain('Yeni Yazı');
    expect(screen.getByTestId('tab-icerik')).toBeDefined();
    expect(screen.getByTestId('tab-seo')).toBeDefined();
    expect(screen.getByTestId('tab-yayinlama')).toBeDefined();
  });

  it('shows TR title input on İçerik tab', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyListResponse);
    renderNew(makeQC());
    await waitFor(() => expect(screen.getByTestId('post-title-tr')).toBeDefined());
  });

  it('shows save draft button', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyListResponse);
    renderNew(makeQC());
    await waitFor(() => expect(screen.getByTestId('save-draft-btn')).toBeDefined());
  });
});

describe('AdminInsightsPostEditPage — edit post', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pre-fills titleTr from fetched post', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/admin/insights/posts/post-1')) return Promise.resolve(mockPostResponse);
      return Promise.resolve(emptyListResponse);
    });
    renderEdit(makeQC());
    await waitFor(() => {
      const input = screen.getByTestId('post-title-tr') as HTMLInputElement;
      expect(input.value).toBe('M&A Due Diligence Rehberi');
    });
  });

  it('shows "Değerlendirmeye Gönder" button for DRAFT post', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/admin/insights/posts/post-1')) return Promise.resolve(mockPostResponse);
      return Promise.resolve(emptyListResponse);
    });
    renderEdit(makeQC());
    await waitFor(() => expect(screen.getByTestId('submit-review-btn')).toBeDefined());
  });

  it('save draft calls PATCH for existing post', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/admin/insights/posts/post-1')) return Promise.resolve(mockPostResponse);
      return Promise.resolve(emptyListResponse);
    });
    vi.mocked(apiClient.patch).mockResolvedValue(mockPostResponse);
    renderEdit(makeQC());

    await waitFor(() => {
      const input = screen.getByTestId('post-title-tr') as HTMLInputElement;
      expect(input.value).toBe('M&A Due Diligence Rehberi');
    });

    fireEvent.click(screen.getByTestId('save-draft-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        '/admin/insights/posts/post-1',
        expect.objectContaining({ titleTr: 'M&A Due Diligence Rehberi' }),
      ),
    );
  });

  it('"Değerlendirmeye Gönder" calls POST transition', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/admin/insights/posts/post-1')) return Promise.resolve(mockPostResponse);
      return Promise.resolve(emptyListResponse);
    });
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { status: 'ok', data: { ...mockPost, status: 'IN_REVIEW' } },
    });
    renderEdit(makeQC());

    await waitFor(() => expect(screen.getByTestId('submit-review-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('submit-review-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/admin/insights/posts/post-1/transition',
        { toStatus: 'IN_REVIEW' },
      ),
    );
  });
});
