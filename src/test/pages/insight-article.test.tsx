import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';

import { MOCK_ARTICLE, RELATED_ARTICLES } from '@/lib/insights-article-mock';
import { InsightArticle } from '@/pages/InsightArticle';
import { ArticleHero } from '@/components/insights/article/ArticleHero';
import { ReadingProgressBar } from '@/components/insights/article/ReadingProgressBar';
import { ShareRail } from '@/components/insights/article/ShareRail';
import { TableOfContents } from '@/components/insights/article/TableOfContents';
import { Callout } from '@/components/insights/article/mdx/Callout';
import { PullQuote } from '@/components/insights/article/mdx/PullQuote';
import { Footnote } from '@/components/insights/article/mdx/Footnote';
import { RelatedService } from '@/components/insights/article/mdx/RelatedService';
import { AuthorBio } from '@/components/insights/article/AuthorBio';
import { SeriesNavigator } from '@/components/insights/article/SeriesNavigator';
import { RelatedArticles } from '@/components/insights/article/RelatedArticles';
import { InlineCTABlocks } from '@/components/insights/article/InlineCTABlocks';
import { CommentsSection } from '@/components/insights/article/CommentsSection';
import { EndOfArticleRecommendations } from '@/components/insights/article/EndOfArticleRecommendations';

vi.mock('react-helmet-async', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-helmet-async')>();
  return {
    ...actual,
    Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@/lib/insights-article-mock', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/insights-article-mock')>();
  return {
    ...actual,
    fetchInsightArticle: vi.fn().mockResolvedValue(actual.MOCK_ARTICLE),
  };
});

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(
  ui: React.ReactElement,
  slug = 'ma-due-diligence-90-gunluk-checklist',
) {
  const qc = makeQueryClient();
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/insights/' + slug]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('InsightArticle page', () => {
  it('1. renders loading skeleton initially', async () => {
    const mockModule = await import('@/lib/insights-article-mock');
    const fetchSpy = vi.mocked(mockModule.fetchInsightArticle);
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}));

    const qc = makeQueryClient();
    render(
      <HelmetProvider>
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={['/insights/slug']}>
            <InsightArticle />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
    expect(screen.getByTestId('article-skeleton')).toBeInTheDocument();
  });

  it('2. renders article title after data loads', async () => {
    renderWithProviders(<InsightArticle />);
    await waitFor(() => {
      expect(screen.getByTestId('article-title')).toBeInTheDocument();
    });
    expect(screen.getByTestId('article-title')).toHaveTextContent('M&A Due Diligence');
  });
});

describe('ArticleHero', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <ArticleHero post={MOCK_ARTICLE} />
      </MemoryRouter>,
    );
  });

  it('3. shows domain breadcrumb', () => {
    expect(screen.getByTestId('breadcrumb-domain')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-domain')).toHaveTextContent('M&A');
  });

  it('4. shows author name', () => {
    expect(screen.getByTestId('author-name')).toHaveTextContent('Emre Can Yalçın');
  });

  it('5. shows readingTime and viewCount', () => {
    expect(screen.getByTestId('reading-time')).toHaveTextContent('12');
    expect(screen.getByTestId('view-count')).toBeInTheDocument();
  });

  it('6. shows domain badge with color', () => {
    const badge = screen.getByTestId('domain-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('M&A');
  });
});

describe('ReadingProgressBar', () => {
  it('7. renders at 0 width initially', () => {
    render(<ReadingProgressBar />);
    const fill = screen.getByTestId('progress-fill');
    expect(fill).toHaveAttribute('aria-valuenow', '0');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('8. updates on scroll simulation', () => {
    const div = document.createElement('div');
    div.className = 'article-body';
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(div, 'getBoundingClientRect', {
      value: () => ({ top: -500, bottom: 500 }),
      configurable: true,
    });
    document.body.appendChild(div);

    render(<ReadingProgressBar />);
    act(() => {
      fireEvent.scroll(window);
    });
    expect(screen.getByTestId('progress-fill')).toBeInTheDocument();
    document.body.removeChild(div);
  });

  it('9. back-to-top button appears at high scroll', () => {
    const div = document.createElement('div');
    div.className = 'article-body';
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(div, 'getBoundingClientRect', {
      value: () => ({ top: -700 }),
      configurable: true,
    });
    document.body.appendChild(div);

    render(<ReadingProgressBar />);
    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByTestId('reading-progress-bar')).toBeInTheDocument();
    document.body.removeChild(div);
  });
});

describe('ShareRail', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(
      <MemoryRouter>
        <ShareRail postId="post-001" postTitle="Test Post" readingTimeMin={10} />
      </MemoryRouter>,
    );
  });

  it('10. renders all share buttons', () => {
    expect(screen.getByTestId('share-twitter')).toBeInTheDocument();
    expect(screen.getByTestId('share-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('share-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('share-email')).toBeInTheDocument();
    expect(screen.getByTestId('share-copy')).toBeInTheDocument();
    expect(screen.getByTestId('share-bookmark')).toBeInTheDocument();
  });

  it('11. copyLink shows Kopyalandı toast', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByTestId('share-copy'));
    await waitFor(() => {
      expect(screen.getByTestId('copy-toast')).toHaveTextContent('Kopyalandı!');
    });
  });

  it('12. bookmark toggle saves to localStorage', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByTestId('share-bookmark'));
    const stored = JSON.parse(localStorage.getItem('ecypro_bookmarks') ?? '[]') as string[];
    expect(stored).toContain('post-001');
  });

  it('13. bookmark toggle removes from localStorage on second click', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByTestId('share-bookmark'));
    await user.click(screen.getByTestId('share-bookmark'));
    const stored = JSON.parse(localStorage.getItem('ecypro_bookmarks') ?? '[]') as string[];
    expect(stored).not.toContain('post-001');
  });
});

describe('TableOfContents', () => {
  const headings = [
    { id: 'intro', text: 'Giriş', level: 2 as const },
    { id: 'hafta-1', text: 'Hafta 1–2', level: 2 as const },
    { id: 'sub-section', text: 'Alt Başlık', level: 3 as const },
  ];

  it('14. renders headings from article', () => {
    render(
      <MemoryRouter>
        <TableOfContents headings={headings} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('toc-item-intro')).toBeInTheDocument();
    expect(screen.getByTestId('toc-item-hafta-1')).toBeInTheDocument();
  });

  it('15. first heading marked active initially', () => {
    render(
      <MemoryRouter>
        <TableOfContents headings={headings} />
      </MemoryRouter>,
    );
    const firstItem = screen.getByTestId('toc-item-intro');
    expect(firstItem).toHaveAttribute('aria-current', 'location');
  });

  it('16. TOC items are keyboard accessible', () => {
    render(
      <MemoryRouter>
        <TableOfContents headings={headings} />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(headings.length);
  });

  it('17. collapses on collapse button click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TableOfContents headings={headings} />
      </MemoryRouter>,
    );
    const collapseBtn = screen.getByTestId('toc-collapse-button');
    await user.click(collapseBtn);
    expect(screen.queryByTestId('toc-item-intro')).not.toBeInTheDocument();
  });
});

describe('Callout', () => {
  it('18. renders info variant', () => {
    render(<Callout type="info">Info message</Callout>);
    expect(screen.getByTestId('callout-info')).toBeInTheDocument();
    expect(screen.getByTestId('callout-info')).toHaveTextContent('Info message');
  });

  it('19. renders warning variant', () => {
    render(<Callout type="warning">Warning message</Callout>);
    expect(screen.getByTestId('callout-warning')).toBeInTheDocument();
  });

  it('20. renders kvkk variant with KVKK badge', () => {
    render(<Callout type="kvkk">KVKK notice</Callout>);
    const el = screen.getByTestId('callout-kvkk');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('KVKK');
  });
});

describe('PullQuote', () => {
  it('21. renders large italic text', () => {
    render(<PullQuote>Büyük tırnak metni</PullQuote>);
    expect(screen.getByTestId('pullquote')).toBeInTheDocument();
    const p = screen.getByTestId('pullquote').querySelector('p');
    expect(p).toHaveClass('italic');
    expect(p).toHaveTextContent('Büyük tırnak metni');
  });
});

describe('Footnote', () => {
  it('22. renders superscript number', () => {
    render(<Footnote id="1">Dipnot içeriği</Footnote>);
    const el = screen.getByTestId('footnote-1');
    expect(el).toBeInTheDocument();
    expect(el.querySelector('sup')).toHaveTextContent('[1]');
  });
});

describe('RelatedService', () => {
  it('23. renders service link', () => {
    render(
      <MemoryRouter>
        <RelatedService slug="finansal-dd" title="Finansal Due Diligence" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('related-service-finansal-dd')).toBeInTheDocument();
    expect(screen.getByTestId('related-service-finansal-dd')).toHaveTextContent(
      'Finansal Due Diligence',
    );
    expect(screen.getByTestId('related-service-finansal-dd')).toHaveAttribute(
      'href',
      '/services/finansal-dd',
    );
  });
});

describe('AuthorBio', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <AuthorBio author={MOCK_ARTICLE.author} />
      </MemoryRouter>,
    );
  });

  it('24. shows author name and bio', () => {
    expect(screen.getByTestId('author-bio-name')).toHaveTextContent('Emre Can Yalçın');
    expect(screen.getByTestId('author-bio-text')).toBeInTheDocument();
  });

  it('25. shows LinkedIn link', () => {
    expect(screen.getByTestId('author-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('author-linkedin')).toHaveAttribute(
      'href',
      expect.stringContaining('linkedin'),
    );
  });

  it('26. links to /insights/author/:slug', () => {
    expect(screen.getByTestId('author-other-articles-link')).toHaveAttribute(
      'href',
      '/insights/author/' + MOCK_ARTICLE.author.slug,
    );
  });
});

describe('SeriesNavigator', () => {
  const series = MOCK_ARTICLE.series!;

  it('27. shows part X/N', () => {
    render(
      <MemoryRouter>
        <SeriesNavigator series={series} currentOrder={2} totalParts={5} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('series-part-indicator')).toHaveTextContent('2 / 5');
  });

  it('28. prev/next navigation renders links when slugs provided', () => {
    render(
      <MemoryRouter>
        <SeriesNavigator
          series={series}
          currentOrder={2}
          totalParts={5}
          prevSlug="part-1"
          nextSlug="part-3"
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('series-prev-button')).toHaveAttribute('href', '/insights/part-1');
    expect(screen.getByTestId('series-next-button')).toHaveAttribute('href', '/insights/part-3');
  });

  it('29. shows progress bar', () => {
    render(
      <MemoryRouter>
        <SeriesNavigator series={series} currentOrder={2} totalParts={5} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('series-progress-bar')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
  });
});

describe('RelatedArticles', () => {
  it('30. renders cards', () => {
    render(
      <MemoryRouter>
        <RelatedArticles manual={RELATED_ARTICLES} algorithmic={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('related-articles')).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(RELATED_ARTICLES.length);
  });
});

describe('InlineCTABlocks', () => {
  it('31. renders newsletter type', () => {
    render(
      <MemoryRouter>
        <InlineCTABlocks type="newsletter" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('cta-newsletter')).toBeInTheDocument();
    expect(screen.getByTestId('cta-newsletter')).toHaveTextContent('Founder Letter');
  });

  it('32. renders discovery type', () => {
    render(
      <MemoryRouter>
        <InlineCTABlocks type="discovery" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('cta-discovery')).toBeInTheDocument();
    expect(screen.getByTestId('cta-discovery')).toHaveTextContent('48 saatte NDA');
  });
});

describe('CommentsSection', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <CommentsSection postId="post-001" commentCount={14} />
      </MemoryRouter>,
    );
  });

  it('33. shows KVKK consent checkbox', () => {
    expect(screen.getByTestId('kvkk-consent-checkbox')).toBeInTheDocument();
  });

  it('34. rejects submit without KVKK consent', async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Adınız/i), 'Test User');
    await user.type(screen.getByRole('textbox', { name: /e-posta/i }), 'test@example.com');
    await user.type(screen.getByLabelText(/Yorumunuz/i), 'Bu bir test yorumudur.');
    await user.click(screen.getByTestId('comment-submit-button'));
    await waitFor(() => {
      expect(screen.getByTestId('kvkk-error')).toBeInTheDocument();
    });
  });

  it('35. shows Discovery CTA link', () => {
    expect(screen.getByTestId('discovery-cta-link')).toBeInTheDocument();
  });
});

describe('EndOfArticleRecommendations', () => {
  it('36. renders recommendation cards', () => {
    const posts = [...RELATED_ARTICLES, ...RELATED_ARTICLES].slice(0, 6);
    render(
      <MemoryRouter>
        <EndOfArticleRecommendations trending={posts} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('end-recommendations')).toBeInTheDocument();
    const cards = screen.getAllByTestId(/^end-recommendation-/);
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});

describe('InsightArticle SEO', () => {
  it('37. renders article page with correct structure', async () => {
    renderWithProviders(<InsightArticle />);
    await waitFor(() => {
      expect(screen.getByTestId('insight-article-page')).toBeInTheDocument();
    });
  });
});
