/**
 * StatusPage unit testleri
 *
 * Test senaryoları:
 *  1. Loading durumunda skeleton render edilir
 *  2. Error durumunda hata mesajı gösterilir
 *  3. Başarılı veri ile component listesi render edilir
 *  4. Genel durum banner'ı doğru status gösterir
 *  5. Yenile butonu mevcut ve tıklanabilir
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { StatusPage } from './StatusPage';

// apiClient mock
vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// i18n mock
vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    i18n: { language: 'tr' },
    t: (k: string) => k,
  }),
}));

// motion mock
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import { apiClient } from '../lib/api';
const mockedGet = vi.mocked(apiClient.get);

const OK_RESPONSE = {
  page: { name: 'eCyPro', url: 'https://ecypro.com' },
  status: { indicator: 'operational', description: 'Tüm sistemler çalışıyor' },
  components: [
    { name: 'API', status: 'operational' },
    { name: 'Database', status: 'operational' },
    { name: 'Cache', status: 'degraded' },
  ],
  updatedAt: new Date().toISOString(),
};

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <MemoryRouter>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </MemoryRouter>
      </HelmetProvider>
    );
  };
}

describe('StatusPage', () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
  });

  it('loading durumunda skeleton render edilir', () => {
    mockedGet.mockReturnValue(new Promise(() => {}) as never);

    render(<StatusPage />, { wrapper: makeWrapper(client) });

    const loading = screen.queryByTestId('status-loading');
    expect(loading).not.toBeNull();
  });

  it('error durumunda hata mesajı gösterilir', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'));

    render(<StatusPage />, { wrapper: makeWrapper(client) });

    await waitFor(
      () => {
        const alert = screen.queryByRole('alert');
        expect(alert).not.toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it('başarılı veri ile bileşen listesi render edilir', async () => {
    mockedGet.mockResolvedValue({ data: OK_RESPONSE } as never);

    render(<StatusPage />, { wrapper: makeWrapper(client) });

    await waitFor(
      () => {
        expect(screen.queryByTestId('status-components')).not.toBeNull();
      },
      { timeout: 5000 },
    );

    expect(screen.queryByTestId('status-component-api')).not.toBeNull();
    expect(screen.queryByTestId('status-component-database')).not.toBeNull();
    expect(screen.queryByTestId('status-component-cache')).not.toBeNull();
  });

  it("genel durum banner'ı açıklamayı gösterir", async () => {
    mockedGet.mockResolvedValue({ data: OK_RESPONSE } as never);

    render(<StatusPage />, { wrapper: makeWrapper(client) });

    await waitFor(
      () => {
        const banner = screen.queryByTestId('status-overall');
        const desc = banner?.textContent ?? '';
        expect(desc).toContain('Tüm sistemler çalışıyor');
      },
      { timeout: 5000 },
    );
  });

  it('yenile butonu tıklanabilir ve mevcut', async () => {
    mockedGet.mockResolvedValue({ data: OK_RESPONSE } as never);

    const user = userEvent.setup();
    render(<StatusPage />, { wrapper: makeWrapper(client) });

    await waitFor(
      () => {
        expect(screen.queryByTestId('status-overall')).not.toBeNull();
      },
      { timeout: 5000 },
    );

    const refreshBtn = screen.queryByRole('button', { name: /yenile/i });
    expect(refreshBtn).not.toBeNull();

    await user.click(refreshBtn!);

    expect(mockedGet).toHaveBeenCalled();
  });
});
