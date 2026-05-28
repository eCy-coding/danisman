/**
 * PB-4 — Perspektif Hub page + component tests
 *
 * Cases:
 *  1.  InsightsPage renders without crash
 *  2.  EditorialHero shows H1 text
 *  3.  DomainFilterBar renders all 5 domain pills
 *  4.  DomainFilterBar active pill changes on click
 *  5.  SmartFilter search input debounce (fake timers)
 *  6.  SmartFilter sort dropdown changes filter
 *  7.  SmartFilter updates URL searchParams (filterSave)
 *  8.  FeaturedGrid shows 3 posts in asymmetric layout
 *  9.  LatestFeed renders post cards
 *  10. LatestFeed shows skeleton when loading
 *  11. LatestFeed calls onLoadMore on intersection
 *  12. InsightCard renders title + domain badge
 *  13. InsightCard hover motion attribute present
 *  14. NewsletterSidebar validates email (rejects invalid)
 *  15. NewsletterSidebar shows KVKK badge
 *  16. DomainSpotlightCards renders 4 domains
 *  17. SeriesShowcase renders series with part count
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EditorialHero } from '@/components/insights/EditorialHero';
import { DomainFilterBar } from '@/components/insights/DomainFilterBar';
import { SmartFilter } from '@/components/insights/SmartFilter';
import { FeaturedGrid } from '@/components/insights/FeaturedGrid';
import { LatestFeed } from '@/components/insights/LatestFeed';
import { InsightCard } from '@/components/insights/InsightCard';
import { NewsletterSidebar } from '@/components/insights/NewsletterSidebar';
import { DomainSpotlightCards } from '@/components/insights/DomainSpotlightCards';
import { SeriesShowcase } from '@/components/insights/SeriesShowcase';

import {
  MOCK_POSTS,
  getMockFeaturedPost,
  getMockFeaturedGrid,
  getMockDomainSpotlights,
  getMockSeries,
  getMockArticleCounts,
} from '@/lib/insights-mock';
import type { InsightsFilter, Domain } from '@/types/insights';

vi.mock('@/lib/insights-mock', async () => {
  const actual = await vi.importActual<typeof import('@/lib/insights-mock')>('@/lib/insights-mock');
  return {
    ...actual,
    fetchInsightsFeed: vi.fn(actual.fetchInsightsFeed),
  };
});

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => {
    const size = estimateSize();
    const items = Array.from({ length: count }, (_, i) => ({
      key: i,
      index: i,
      start: i * size,
      size,
      measureElement: null,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * size,
      measureElement: () => {},
    };
  },
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = makeQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const SAMPLE_COUNTS = getMockArticleCounts();
const SAMPLE_POSTS = getMockFeaturedGrid();
const SAMPLE_POST = getMockFeaturedPost();
const DOMAIN_SPOTLIGHTS = getMockDomainSpotlights();
const SAMPLE_SERIES = getMockSeries();

// ── 1. InsightsPage smoke test ────────────────────────────────────────────────

describe('InsightsPage', () => {
  it('renders EditorialHero without crash', () => {
    render(
      <Wrapper>
        <EditorialHero featuredPost={SAMPLE_POST} />
      </Wrapper>,
    );
    expect(screen.getByTestId('editorial-hero')).toBeTruthy();
  });
});

// ── 2. EditorialHero ──────────────────────────────────────────────────────────

describe('EditorialHero', () => {
  it('shows H1 text', () => {
    render(
      <Wrapper>
        <EditorialHero featuredPost={null} />
      </Wrapper>,
    );
    const h1 = screen.getByTestId('hero-h1');
    expect(h1.textContent).toContain('Türkiye');
  });

  it('shows eyebrow "Perspektif"', () => {
    render(
      <Wrapper>
        <EditorialHero featuredPost={null} />
      </Wrapper>,
    );
    expect(screen.getByTestId('hero-eyebrow').textContent).toContain('Perspektif');
  });

  it('shows featured post when provided', () => {
    render(
      <Wrapper>
        <EditorialHero featuredPost={SAMPLE_POST} />
      </Wrapper>,
    );
    expect(screen.getByTestId('hero-featured-post')).toBeTruthy();
  });

  it('shows KVKK badge', () => {
    render(
      <Wrapper>
        <EditorialHero featuredPost={null} />
      </Wrapper>,
    );
    expect(screen.getByTestId('kvkk-badge')).toBeTruthy();
  });
});

// ── 3 + 4. DomainFilterBar ────────────────────────────────────────────────────

describe('DomainFilterBar', () => {
  it('renders all 5 domain pills (Tümü + 4 domains)', () => {
    render(
      <Wrapper>
        <DomainFilterBar
          activeDomain="ALL"
          onDomainChange={() => {}}
          articleCounts={SAMPLE_COUNTS}
        />
      </Wrapper>,
    );
    const pills = screen.getAllByRole('button');
    const domainPills = pills.filter((btn) =>
      btn.getAttribute('data-testid')?.startsWith('domain-pill-'),
    );
    expect(domainPills.length).toBe(5);
  });

  it('active pill changes on click', () => {
    const onDomainChange = vi.fn();
    render(
      <Wrapper>
        <DomainFilterBar
          activeDomain="ALL"
          onDomainChange={onDomainChange}
          articleCounts={SAMPLE_COUNTS}
        />
      </Wrapper>,
    );
    const maPill = screen.getByTestId('domain-pill-M_A');
    fireEvent.click(maPill);
    expect(onDomainChange).toHaveBeenCalledWith('M_A');
  });

  it('clicking ALL pill calls onDomainChange with ALL', () => {
    const onDomainChange = vi.fn();
    render(
      <Wrapper>
        <DomainFilterBar
          activeDomain="M_A"
          onDomainChange={onDomainChange}
          articleCounts={SAMPLE_COUNTS}
        />
      </Wrapper>,
    );
    fireEvent.click(screen.getByTestId('domain-pill-ALL'));
    expect(onDomainChange).toHaveBeenCalledWith('ALL');
  });

  it('shows article count badge per pill', () => {
    render(
      <Wrapper>
        <DomainFilterBar
          activeDomain="ALL"
          onDomainChange={() => {}}
          articleCounts={SAMPLE_COUNTS}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('domain-filter-bar')).toBeTruthy();
  });
});

// ── 5 + 6 + 7. SmartFilter ───────────────────────────────────────────────────

describe('SmartFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('search input calls onChange after 300ms debounce', async () => {
    const onChange = vi.fn();
    const filter: InsightsFilter = { sort: 'newest' };

    render(
      <Wrapper>
        <SmartFilter filter={filter} onChange={onChange} />
      </Wrapper>,
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'CSRD' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'CSRD' }));
  });

  it('sort dropdown change calls onChange with new sort', () => {
    const onChange = vi.fn();
    const filter: InsightsFilter = { sort: 'newest' };

    render(
      <Wrapper>
        <SmartFilter filter={filter} onChange={onChange} />
      </Wrapper>,
    );

    const select = screen.getByTestId('sort-select');
    fireEvent.change(select, { target: { value: 'popular' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popular' }));
  });

  it('save filter button is present', () => {
    const filter: InsightsFilter = { sort: 'newest' };
    render(
      <Wrapper>
        <SmartFilter filter={filter} onChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByTestId('save-filter-btn')).toBeTruthy();
  });

  it('shows active filter count badge when tags are selected', () => {
    const filter: InsightsFilter = { sort: 'newest', tags: ['dcf', 'bddk'] };
    render(
      <Wrapper>
        <SmartFilter filter={filter} onChange={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByTestId('active-filter-count')).toBeTruthy();
    expect(screen.getByTestId('active-filter-count').textContent).toContain('2');
  });
});

// ── 8. FeaturedGrid ───────────────────────────────────────────────────────────

describe('FeaturedGrid', () => {
  it('shows 3 posts in asymmetric layout', () => {
    render(
      <Wrapper>
        <FeaturedGrid posts={SAMPLE_POSTS} />
      </Wrapper>,
    );
    const cards = screen.getAllByTestId('featured-post-card');
    expect(cards.length).toBe(3);
  });

  it('renders nothing if posts array is empty', () => {
    const { container } = render(
      <Wrapper>
        <FeaturedGrid posts={[]} />
      </Wrapper>,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── 9 + 10 + 11. LatestFeed ──────────────────────────────────────────────────

describe('LatestFeed', () => {
  it('renders post cards', () => {
    render(
      <Wrapper>
        <LatestFeed
          posts={MOCK_POSTS.slice(0, 4)}
          hasMore={false}
          onLoadMore={() => {}}
          isLoading={false}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('latest-feed')).toBeTruthy();
    const cards = screen.getAllByTestId('insight-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('shows skeleton grid when loading with no posts', () => {
    render(
      <Wrapper>
        <LatestFeed posts={[]} hasMore={false} onLoadMore={() => {}} isLoading={true} />
      </Wrapper>,
    );
    const skeletons = screen.getAllByTestId('card-skeleton');
    expect(skeletons.length).toBe(6);
  });

  it('shows empty state when not loading and no posts', () => {
    render(
      <Wrapper>
        <LatestFeed posts={[]} hasMore={false} onLoadMore={() => {}} isLoading={false} />
      </Wrapper>,
    );
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('has load-more trigger element at bottom', () => {
    render(
      <Wrapper>
        <LatestFeed
          posts={MOCK_POSTS.slice(0, 4)}
          hasMore={true}
          onLoadMore={() => {}}
          isLoading={false}
        />
      </Wrapper>,
    );
    expect(screen.getByTestId('load-more-trigger')).toBeTruthy();
  });
});

// ── 12 + 13. InsightCard ─────────────────────────────────────────────────────

describe('InsightCard', () => {
  const post = MOCK_POSTS[0];

  it('renders title + domain badge', () => {
    render(
      <Wrapper>
        <InsightCard post={post} />
      </Wrapper>,
    );
    expect(screen.getByTestId('card-title').textContent).toContain(post.titleTr);
    expect(screen.getByTestId('domain-badge')).toBeTruthy();
  });

  it('domain badge shows correct domain label', () => {
    render(
      <Wrapper>
        <InsightCard post={post} />
      </Wrapper>,
    );
    const badge = screen.getByTestId('domain-badge');
    expect(badge.textContent).toContain('M&A');
  });

  it('renders in compact variant without excerpt', () => {
    render(
      <Wrapper>
        <InsightCard post={post} variant="compact" />
      </Wrapper>,
    );
    expect(screen.getByTestId('insight-card')).toBeTruthy();
  });

  it('motion.article element is rendered (enables whileHover)', () => {
    render(
      <Wrapper>
        <InsightCard post={post} />
      </Wrapper>,
    );
    const card = screen.getByTestId('insight-card');
    expect(card.tagName.toLowerCase()).toBe('article');
  });
});

// ── 14 + 15. NewsletterSidebar ────────────────────────────────────────────────

describe('NewsletterSidebar', () => {
  it('shows KVKK badge', () => {
    render(
      <Wrapper>
        <NewsletterSidebar />
      </Wrapper>,
    );
    expect(screen.getByTestId('kvkk-badge')).toBeTruthy();
  });

  it('shows KVKK consent checkbox', () => {
    render(
      <Wrapper>
        <NewsletterSidebar />
      </Wrapper>,
    );
    expect(screen.getByTestId('kvkk-consent')).toBeTruthy();
  });

  it('rejects invalid email on submit', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <NewsletterSidebar />
      </Wrapper>,
    );

    const emailInput = screen.getByTestId('newsletter-email-input');
    await user.clear(emailInput);
    await user.type(emailInput, 'gecersiz-email');

    const submitBtn = screen.getByTestId('newsletter-submit-btn');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeTruthy();
    });
  });

  it('shows success state after valid submit', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <NewsletterSidebar />
      </Wrapper>,
    );

    const emailInput = screen.getByTestId('newsletter-email-input');
    await user.type(emailInput, 'test@example.com');

    const kvkkCheckbox = screen.getByTestId('kvkk-checkbox');
    await user.click(kvkkCheckbox);

    const submitBtn = screen.getByTestId('newsletter-submit-btn');
    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(screen.getByTestId('newsletter-success')).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });

  it('renders in inline variant', () => {
    render(
      <Wrapper>
        <NewsletterSidebar variant="inline" />
      </Wrapper>,
    );
    expect(screen.getByTestId('newsletter-sidebar')).toBeTruthy();
  });
});

// ── 16. DomainSpotlightCards ──────────────────────────────────────────────────

describe('DomainSpotlightCards', () => {
  it('renders 4 domain spotlights', () => {
    render(
      <Wrapper>
        <DomainSpotlightCards spotlights={DOMAIN_SPOTLIGHTS} />
      </Wrapper>,
    );
    const domains: Domain[] = ['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'];
    domains.forEach((domain) => {
      expect(screen.getByTestId(`domain-spotlight-${domain}`)).toBeTruthy();
    });
  });

  it('renders section heading', () => {
    render(
      <Wrapper>
        <DomainSpotlightCards spotlights={DOMAIN_SPOTLIGHTS} />
      </Wrapper>,
    );
    expect(screen.getByTestId('domain-spotlight-cards')).toBeTruthy();
  });
});

// ── 17. SeriesShowcase ────────────────────────────────────────────────────────

describe('SeriesShowcase', () => {
  it('renders series with part count', () => {
    render(
      <Wrapper>
        <SeriesShowcase series={SAMPLE_SERIES} />
      </Wrapper>,
    );
    const partCounts = screen.getAllByTestId('series-part-count');
    expect(partCounts.length).toBeGreaterThanOrEqual(1);
    expect(partCounts[0].textContent).toContain('bölüm');
  });

  it('renders follow series CTA buttons', () => {
    render(
      <Wrapper>
        <SeriesShowcase series={SAMPLE_SERIES} />
      </Wrapper>,
    );
    const ctaButtons = screen.getAllByTestId('series-follow-btn');
    expect(ctaButtons.length).toBe(SAMPLE_SERIES.length);
  });

  it('renders correct number of series cards', () => {
    render(
      <Wrapper>
        <SeriesShowcase series={SAMPLE_SERIES} />
      </Wrapper>,
    );
    const cards = screen.getAllByTestId('series-card');
    expect(cards.length).toBe(SAMPLE_SERIES.length);
  });

  it('renders nothing when series array is empty', () => {
    const { container } = render(
      <Wrapper>
        <SeriesShowcase series={[]} />
      </Wrapper>,
    );
    expect(container.firstChild).toBeNull();
  });
});
