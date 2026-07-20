/**
 * AP3 — AdminAnalyticsPage no longer renders MOCK_TREND / MOCK_SOURCES as
 * if they were real GA4 traffic data. No GA4 backend endpoint exists, so
 * the "Weekly Visits & Conversions" / "Traffic Sources" panels now show an
 * explicit "GA4 bağlantısı yapılandırılmamış" empty state instead of fake
 * numbers. These tests guard against regressing back to fabricated charts
 * and cover the AP4 error state for the real /admin/stats KPI query.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useSSE', () => ({
  useSSE: vi.fn(() => ({ isConnected: false, reconnect: vi.fn() })),
}));

const getMock = vi.fn();
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

import { AdminAnalyticsPage } from './AdminAnalyticsPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminAnalyticsPage />
    </QueryClientProvider>,
  );
}

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockImplementation((url: string) => {
      if (url === '/admin/stats') {
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              unreadContacts: 3,
              totalContacts: 40,
              activeSubscribers: 120,
              pendingBookings: 5,
              weeklyInteractions: 88,
            },
          },
        });
      }
      if (url === '/bookings/analytics') {
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              summary: {
                total: 10,
                confirmed: 4,
                completed: 5,
                cancelled: 1,
                noShow: 0,
                cancelRate: 10,
                noShowRate: 0,
              },
              last30: { total: 10, byStatus: { COMPLETED: 5 } },
              trend: [],
              byService: [],
            },
          },
        });
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    });
  });

  test('shows GA4-unconfigured empty state instead of fabricated traffic numbers', async () => {
    renderPage();
    await screen.findByText((_content, el) => el?.textContent === '3');

    const notices = screen.getAllByText('GA4 bağlantısı yapılandırılmamış');
    expect(notices.length).toBe(2);

    // The old fake series values must never render as chart data.
    expect(screen.queryByText('312')).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly Visits & Conversions')).toBeInTheDocument();
  });

  test('renders real KPI values from /admin/stats', async () => {
    renderPage();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  test('shows error state with retry when /admin/stats fails', async () => {
    const bookingsResponse = {
      data: {
        status: 'ok',
        data: {
          summary: {
            total: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
            cancelRate: 0,
            noShowRate: 0,
          },
          last30: { total: 0, byStatus: {} },
          trend: [],
          byService: [],
        },
      },
    };

    getMock.mockImplementation((url: string) => {
      if (url === '/admin/stats') {
        return Promise.reject({
          response: { data: { message: 'İstatistik servisine ulaşılamadı' } },
        });
      }
      return Promise.resolve(bookingsResponse);
    });

    renderPage();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('İstatistik servisine ulaşılamadı')).toBeInTheDocument();

    getMock.mockImplementation((url: string) => {
      if (url === '/admin/stats') {
        return Promise.resolve({
          data: {
            status: 'ok',
            data: {
              unreadContacts: 7,
              totalContacts: 10,
              activeSubscribers: 1,
              pendingBookings: 0,
              weeklyInteractions: 2,
            },
          },
        });
      }
      return Promise.resolve(bookingsResponse);
    });
    await userEvent.click(screen.getByRole('button', { name: /yeniden dene/i }));

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
  });
});
