import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AdminInsightsPage } from '../../pages/admin/AdminInsightsPage';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('recharts', () => {
  const mockChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  );
  return {
    BarChart: mockChart,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const mockStats = {
  pipeline: {
    DRAFT: 5,
    IN_REVIEW: 3,
    COPY_EDIT: 1,
    SEO_REVIEW: 2,
    LEGAL_REVIEW: 0,
    SCHEDULED: 4,
    PUBLISHED: 100,
    ARCHIVED: 12,
  },
  topPosts: [
    {
      id: 'p1',
      slug: 'test-article',
      titleTr: 'Test Makale',
      viewCount: 500,
      avgScrollDepth: 0.65,
      commentCount: 12,
    },
  ],
  recentPosts: [],
  tagGaps: [{ slug: 'format-checklist', labelTr: 'Checklist', axis: 'FORMAT', postCount: 2 }],
  seoIssues: [
    { id: 'p2', slug: 'no-meta', titleTr: 'Meta Başlıksız Makale', issue: 'Meta başlık eksik' },
  ],
  commentQueue: [
    {
      id: 'c1',
      authorName: 'Ali Veli',
      bodyMd: 'Harika bir makale!',
      createdAt: new Date().toISOString(),
      post: { slug: 'test-article', titleTr: 'Test Makale' },
    },
  ],
  publishCalendar: [
    {
      id: 'p3',
      slug: 'upcoming',
      titleTr: 'Yakında',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
};

import { apiClient } from '../../lib/api';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <AdminInsightsPage />
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('AdminInsightsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: mockStats } });
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { data: { id: 'c1', status: 'APPROVED' } },
    });
  });

  it('renders without crashing', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Perspektif Dashboard')).toBeInTheDocument();
    });
  });

  it('shows 6 tab navigation buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByRole('tab')).toHaveLength(6);
    });
  });

  it('defaults to Pipeline tab', async () => {
    renderPage();
    await waitFor(() => {
      const pipelineTab = screen.getByRole('tab', { name: /pipeline/i });
      expect(pipelineTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('renders pipeline status columns', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Taslak')).toBeInTheDocument();
      expect(screen.getByText('Yayında')).toBeInTheDocument();
    });
  });

  it('shows correct count in pipeline column', async () => {
    renderPage();
    await waitFor(() => {
      // DRAFT = 5
      const counts = screen.getAllByText('5');
      expect(counts.length).toBeGreaterThan(0);
    });
  });

  it('switches to Performance tab and renders BarChart', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Performans'));
    fireEvent.click(screen.getByRole('tab', { name: /performans/i }));
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('switches to Calendar tab', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Takvim'));
    fireEvent.click(screen.getByRole('tab', { name: /takvim/i }));
    await waitFor(() => {
      expect(screen.getByText('Yakında')).toBeInTheDocument();
    });
  });

  it('shows SEO issues count in SEO panel', async () => {
    renderPage();
    await waitFor(() => screen.getByText('SEO Sağlığı'));
    fireEvent.click(screen.getByRole('tab', { name: /seo/i }));
    await waitFor(() => {
      expect(screen.getByText(/1 SEO sorunu/i)).toBeInTheDocument();
    });
  });

  it('shows "All clear" when no SEO issues', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { ...mockStats, seoIssues: [] } },
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /seo/i }));
    await waitFor(() => {
      expect(screen.getByText(/tamam/i)).toBeInTheDocument();
    });
  });

  it('highlights tag gaps in Tag Analysis panel', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Etiket Analizi'));
    fireEvent.click(screen.getByRole('tab', { name: /etiket/i }));
    await waitFor(() => {
      expect(screen.getByText('Checklist')).toBeInTheDocument();
    });
  });

  it('renders PENDING comments in Moderation panel', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Moderasyon'));
    fireEvent.click(screen.getByRole('tab', { name: /moderasyon/i }));
    await waitFor(() => {
      expect(screen.getByText('Ali Veli')).toBeInTheDocument();
    });
  });

  it('calls PATCH when Approve button clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /moderasyon/i }));
    await waitFor(() => screen.getByLabelText('Yorumu onayla'));
    fireEvent.click(screen.getByLabelText('Yorumu onayla'));
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/admin/insights/comments/c1', {
        status: 'APPROVED',
      });
    });
  });
});
