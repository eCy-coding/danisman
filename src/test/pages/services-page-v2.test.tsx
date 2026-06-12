/**
 * SVC P6 — /services index v2 contract (test-first).
 *
 * Debounced search, registry chips with aria-pressed, aria-live result count,
 * 7-cluster grouped view, empty state, and the registry-driven lifecycle
 * stepper (ServicesClusterSection had a third hand-maintained list with dead
 * hrefs like /services/esg-reporting — taxonomy violation).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Heavy below-fold lazies would drag recharts/booking into jsdom — stub them.
vi.mock('@/components/features/interactive/GrowthCalculator', () => ({
  GrowthCalculator: () => null,
}));
vi.mock('@/components/features/interactive/BookingWizard', () => ({
  BookingWizard: () => null,
}));
vi.mock('@/lib/analytics', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/analytics')>();
  return { ...mod, trackEvent: vi.fn() };
});

import ServicesPage from '@/pages/ServicesPage';
import { ServicesClusterSection } from '@/components/sections/ServicesClusterSection';
import { SERVICE_DEPARTMENTS, isCanonicalServiceSlug } from '@/data/service-taxonomy';
import { trackEvent } from '@/lib/analytics';

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('/services index v2', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders 8 registry chips (HEPSİ + 7) with aria-pressed state', () => {
    renderPage();
    const all = screen.getByTestId('services-filter-all');
    expect(all.getAttribute('aria-pressed')).toBe('true');
    for (const d of SERVICE_DEPARTMENTS) {
      const chip = screen.getByTestId(`services-filter-${d.id}`);
      expect(chip.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('idle grouped view renders all 7 department clusters', () => {
    renderPage();
    for (const d of SERVICE_DEPARTMENTS) {
      expect(screen.getByTestId(`cluster-heading-${d.id}`)).toBeTruthy();
    }
  });

  it('search is debounced (≥150ms) and announces the result count via aria-live', () => {
    renderPage();
    const input = screen.getByTestId('services-search-input');
    const count = screen.getByTestId('services-result-count');
    expect(count.getAttribute('aria-live')).toBe('polite');

    fireEvent.change(input, { target: { value: 'Bordro' } });
    // Before the debounce window the grouped view must still be intact.
    expect(screen.getByTestId('cluster-heading-ma')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    // After debounce: filtered flat view, count announces a single match.
    expect(screen.queryByTestId('cluster-heading-ma')).toBeNull();
    expect(count.getAttribute('data-count')).toBe('1');
    const cards = document.querySelectorAll('[data-testid="service-card"]');
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute('data-service-id')).toBe('payroll-audit');
  });

  it('junk query shows the empty state and clear restores the grouped view', () => {
    renderPage();
    const input = screen.getByTestId('services-search-input');
    fireEvent.change(input, { target: { value: 'zzz-yok-boyle-hizmet' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('services-no-results')).toBeTruthy();

    fireEvent.click(screen.getByTestId('services-filter-clear'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('cluster-heading-ma')).toBeTruthy();
  });

  it('chip filter narrows to the department after debounce-free click', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('services-filter-insan'));
    expect(screen.queryByTestId('cluster-heading-ma')).toBeNull();
    const cards = Array.from(document.querySelectorAll('[data-testid="service-card"]'));
    expect(cards).toHaveLength(4);
    expect(cards.every((c) => c.getAttribute('data-category') === 'insan')).toBe(true);
  });
});

describe('consent-gated analytics events (KVKK: no raw query, no PII)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(trackEvent).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('chip select fires service_filter with the department id', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('services-filter-risk'));
    expect(trackEvent).toHaveBeenCalledWith('services', 'service_filter', 'risk');
  });

  it('debounced search fires service_search with query LENGTH + hit count (never the raw text)', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('services-search-input'), {
      target: { value: 'Bordro' },
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(trackEvent).toHaveBeenCalledWith('services', 'service_search', 'len:6|hits:1');
    const rawLeak = vi
      .mocked(trackEvent)
      .mock.calls.some((c) => c.some((arg) => String(arg).includes('Bordro')));
    expect(rawLeak).toBe(false);
  });
});

describe('ServicesClusterSection — registry-driven lifecycle stepper', () => {
  it('renders all 7 departments with numbered lifecycle steps', () => {
    render(
      <MemoryRouter>
        <ServicesClusterSection />
      </MemoryRouter>,
    );
    for (const d of SERVICE_DEPARTMENTS) {
      expect(screen.getByTestId(`lifecycle-cluster-${d.id}`)).toBeTruthy();
      const steps = screen.getAllByTestId(`lifecycle-step-${d.id}`);
      expect(steps, `${d.id} steps`).toHaveLength(d.lifecycle.length);
    }
  });

  it('every lifecycle link targets a canonical slug (no dead hrefs)', () => {
    const { container } = render(
      <MemoryRouter>
        <ServicesClusterSection />
      </MemoryRouter>,
    );
    const hrefs = Array.from(container.querySelectorAll('a'))
      .map((a) => a.getAttribute('href'))
      .filter((h): h is string => !!h && h.startsWith('/services/'));
    expect(hrefs.length).toBeGreaterThanOrEqual(35);
    const dead = hrefs.filter((h) => !isCanonicalServiceSlug(h.split('/').pop() as string));
    expect(dead, `dead hrefs: ${dead.join(', ')}`).toHaveLength(0);
  });
});
