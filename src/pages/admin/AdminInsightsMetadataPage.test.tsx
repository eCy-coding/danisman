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

import { apiClient } from '@/lib/api';
import { AdminInsightsMetadataPage } from './AdminInsightsMetadataPage';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAuthor = {
  id: 'a1',
  slug: 'emre-can-yalcin',
  displayName: 'Emre Can Yalçın',
  bioTr: 'Kurucu ortak ve yönetici danışman.',
  bioEn: null,
  avatarUrl: 'https://example.com/avatar.jpg',
  linkedinUrl: null,
  twitterUrl: null,
  isFounder: true,
};

const mockTag = {
  id: 't1',
  slug: 'sector:sell-side',
  labelTr: 'Satıcı Taraf',
  labelEn: 'Sell Side',
  axis: 'SECTOR',
};

const mockSeries = {
  id: 's1',
  slug: 'ma-rehberi',
  titleTr: 'M&A Rehberi',
  titleEn: null,
  descriptionTr: 'Kurumsal birleşme ve satın alma süreçleri.',
  totalParts: 5,
  status: 'ACTIVE',
};

const emptyArrayResponse = { data: { status: 'ok', data: [] } };
const authorsFilledResponse = { data: { status: 'ok', data: [mockAuthor] } };
const tagsFilledResponse = { data: { status: 'ok', data: [mockTag] } };
const seriesFilledResponse = { data: { status: 'ok', data: [mockSeries] } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQC = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminInsightsMetadataPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminInsightsMetadataPage — render', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders 3 tab buttons and defaults to Yazarlar', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('tab-yazarlar')).toBeDefined());
    expect(screen.getByTestId('tab-etiketler')).toBeDefined();
    expect(screen.getByTestId('tab-seriler')).toBeDefined();
    expect(screen.getByTestId('add-author-btn')).toBeDefined();
  });

  it('shows "Perspektif Metadata" heading', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() =>
      expect(screen.getByTestId('metadata-page').textContent).toContain('Perspektif Metadata'),
    );
  });
});

describe('AdminInsightsMetadataPage — Yazarlar tab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty state when no authors', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('authors-empty-state')).toBeDefined());
  });

  it('shows author row when data loaded', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(authorsFilledResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('author-row-a1')).toBeDefined());
    expect(screen.getByText('Emre Can Yalçın')).toBeDefined();
  });

  it('Yazar Ekle button opens author modal', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-author-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('add-author-btn'));
    await waitFor(() => expect(screen.getByTestId('author-modal')).toBeDefined());
  });

  it('create author calls POST', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: 'ok', data: mockAuthor } });
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('add-author-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('add-author-btn'));

    await waitFor(() => expect(screen.getByTestId('author-modal')).toBeDefined());
    fireEvent.change(screen.getByTestId('author-displayName'), {
      target: { value: 'Emre Can Yalçın' },
    });
    fireEvent.change(screen.getByTestId('author-bioTr'), {
      target: { value: 'Kurucu ortak ve yönetici danışman.' },
    });
    fireEvent.change(screen.getByTestId('author-avatarUrl'), {
      target: { value: 'https://example.com/avatar.jpg' },
    });

    fireEvent.click(screen.getByTestId('author-submit-btn'));
    await waitFor(() =>
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/admin/insights/authors',
        expect.objectContaining({ displayName: 'Emre Can Yalçın' }),
      ),
    );
  });

  it('edit author opens modal prefilled and calls PATCH', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(authorsFilledResponse);
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { status: 'ok', data: mockAuthor } });
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('author-row-a1')).toBeDefined());

    fireEvent.click(screen.getByTestId('edit-author-a1'));
    await waitFor(() => {
      const input = screen.getByTestId('author-displayName') as HTMLInputElement;
      expect(input.value).toBe('Emre Can Yalçın');
    });

    fireEvent.click(screen.getByTestId('author-submit-btn'));
    await waitFor(() =>
      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        '/admin/insights/authors/a1',
        expect.objectContaining({ displayName: 'Emre Can Yalçın' }),
      ),
    );
  });
});

describe('AdminInsightsMetadataPage — Etiketler tab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking Etiketler tab shows add-tag-btn', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('tab-etiketler')).toBeDefined());
    fireEvent.click(screen.getByTestId('tab-etiketler'));
    await waitFor(() => expect(screen.getByTestId('add-tag-btn')).toBeDefined());
  });

  it('shows tags-empty-state when no tags', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-etiketler'));
    await waitFor(() => expect(screen.getByTestId('tags-empty-state')).toBeDefined());
  });

  it('shows tag row when data loaded', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/tags')) return Promise.resolve(tagsFilledResponse);
      return Promise.resolve(emptyArrayResponse);
    });
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-etiketler'));
    await waitFor(() => expect(screen.getByTestId('tag-row-t1')).toBeDefined());
  });

  it('create tag calls POST', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: 'ok', data: mockTag } });
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-etiketler'));
    await waitFor(() => expect(screen.getByTestId('add-tag-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('add-tag-btn'));

    await waitFor(() => expect(screen.getByTestId('tag-modal')).toBeDefined());
    fireEvent.change(screen.getByTestId('tag-slug'), {
      target: { value: 'sector:sell-side' },
    });
    fireEvent.change(screen.getByTestId('tag-labelTr'), {
      target: { value: 'Satıcı Taraf' },
    });
    fireEvent.click(screen.getByTestId('tag-submit-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/admin/insights/tags',
        expect.objectContaining({ slug: 'sector:sell-side', labelTr: 'Satıcı Taraf' }),
      ),
    );
  });

  it('delete tag calls DELETE', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/tags')) return Promise.resolve(tagsFilledResponse);
      return Promise.resolve(emptyArrayResponse);
    });
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { status: 'ok' } });
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-etiketler'));
    await waitFor(() => expect(screen.getByTestId('tag-row-t1')).toBeDefined());

    fireEvent.click(screen.getByTestId('delete-tag-t1'));
    await waitFor(() =>
      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith('/admin/insights/tags/t1'),
    );
  });
});

describe('AdminInsightsMetadataPage — Seriler tab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clicking Seriler tab shows add-series-btn', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    await waitFor(() => expect(screen.getByTestId('tab-seriler')).toBeDefined());
    fireEvent.click(screen.getByTestId('tab-seriler'));
    await waitFor(() => expect(screen.getByTestId('add-series-btn')).toBeDefined());
  });

  it('shows series-empty-state when no series', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-seriler'));
    await waitFor(() => expect(screen.getByTestId('series-empty-state')).toBeDefined());
  });

  it('shows series row when data loaded', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/series')) return Promise.resolve(seriesFilledResponse);
      return Promise.resolve(emptyArrayResponse);
    });
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-seriler'));
    await waitFor(() => expect(screen.getByTestId('series-row-s1')).toBeDefined());
  });

  it('create series calls POST', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyArrayResponse);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: 'ok', data: mockSeries } });
    renderPage(makeQC());
    fireEvent.click(screen.getByTestId('tab-seriler'));
    await waitFor(() => expect(screen.getByTestId('add-series-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('add-series-btn'));

    await waitFor(() => expect(screen.getByTestId('series-modal')).toBeDefined());
    fireEvent.change(screen.getByTestId('series-titleTr'), {
      target: { value: 'M&A Rehberi' },
    });
    fireEvent.change(screen.getByTestId('series-descriptionTr'), {
      target: { value: 'Kurumsal birleşme ve satın alma süreçleri.' },
    });
    fireEvent.change(screen.getByTestId('series-coverImageUrl'), {
      target: { value: 'https://example.com/cover.jpg' },
    });
    fireEvent.change(screen.getByTestId('series-totalParts'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('series-submit-btn'));

    await waitFor(() =>
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/admin/insights/series',
        expect.objectContaining({ titleTr: 'M&A Rehberi' }),
      ),
    );
  });
});
