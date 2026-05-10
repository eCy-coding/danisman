/**
 * GeoBanner unit testleri
 *
 * Test senaryoları:
 *  1. Dismissed localStorage marker'ı varsa banner render edilmez
 *  2. TR ülkesi döndüğünde banner render edilmez
 *  3. TR-dışı ülke + dismissed=false → banner görünür
 *  4. Dismiss butonu localStorage.setItem çağırır
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GeoBanner } from './GeoBanner';

// apiClient mock
vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// motion mock — animasyonu bypass et, motion-specific props DOM'a geçmez
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      variants: _v,
      whileHover: _wh,
      whileTap: _wt,
      whileInView: _wiv,
      viewport: _vp,
      layout: _l,
      layoutId: _lid,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => true,
}));

import { apiClient } from '../../lib/api';
const mockedGet = vi.mocked(apiClient.get);

const BANNER_KEY = 'ecypro_geo_banner_dismissed';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function wrap(ui: React.ReactElement, client: QueryClient) {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('GeoBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("localStorage'da dismiss marker varsa render edilmez", async () => {
    // 5 dakika önce dismiss edilmiş
    localStorage.setItem(BANNER_KEY, String(Date.now() - 5 * 60 * 1000));

    mockedGet.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          country: 'DE',
          flag: '🇩🇪',
          message: "Almanya'dan görüntülüyorsunuz",
          suggestedLang: 'en',
          nameTr: 'Almanya',
          nameEn: 'Germany',
          currency: 'EUR',
        },
      },
    } as never);

    const client = makeClient();
    const { container } = render(wrap(<GeoBanner />, client));

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="geo-banner"]')).toBeNull();
  });

  it('TR ülkesi döndüğünde banner gösterilmez', async () => {
    localStorage.clear();

    mockedGet.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          country: 'TR',
          flag: '🇹🇷',
          message: "Türkiye'den görüntülüyorsunuz",
          suggestedLang: 'tr',
          nameTr: 'Türkiye',
          nameEn: 'Turkey',
          currency: 'TRY',
        },
      },
    } as never);

    const client = makeClient();
    render(wrap(<GeoBanner />, client));

    await waitFor(() => expect(mockedGet).toHaveBeenCalled(), { timeout: 3000 });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByTestId('geo-banner')).toBeNull();
  });

  it('TR-dışı ülke + dismiss=false → banner görünür', async () => {
    localStorage.clear();

    mockedGet.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          country: 'DE',
          flag: '🇩🇪',
          message: 'Sie sehen aus Deutschland',
          suggestedLang: 'en',
          nameTr: 'Almanya',
          nameEn: 'Germany',
          currency: 'EUR',
        },
      },
    } as never);

    const client = makeClient();
    render(wrap(<GeoBanner />, client));

    await waitFor(
      () => {
        expect(screen.queryByTestId('geo-banner')).not.toBeNull();
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId('geo-banner')).toBeDefined();
  });

  it("Dismiss butonu tıklandığında localStorage'a timestamp yazar ve banner kapanır", async () => {
    localStorage.clear();

    mockedGet.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          country: 'GB',
          flag: '🇬🇧',
          message: 'Viewing from United Kingdom',
          suggestedLang: 'en',
          nameTr: 'İngiltere',
          nameEn: 'United Kingdom',
          currency: 'GBP',
        },
      },
    } as never);

    const user = userEvent.setup();
    const client = makeClient();
    render(wrap(<GeoBanner />, client));

    await waitFor(
      () => {
        expect(screen.queryByTestId('geo-banner')).not.toBeNull();
      },
      { timeout: 3000 },
    );

    const dismissBtn = screen.getByTestId('geo-banner-dismiss');
    await user.click(dismissBtn);

    expect(localStorage.setItem).toHaveBeenCalledWith(BANNER_KEY, expect.any(String));
    await waitFor(
      () => {
        expect(screen.queryByTestId('geo-banner')).toBeNull();
      },
      { timeout: 1000 },
    );
  });
});
