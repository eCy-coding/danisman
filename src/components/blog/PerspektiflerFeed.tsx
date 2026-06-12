import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import BlogCard from './BlogCard';
import { NewsletterSidebar } from './NewsletterSidebar';
import { PerspektiflerHero } from './PerspektiflerHero';
import { PerspektiflerFacetBar } from './PerspektiflerFacetBar';
import {
  parseHubFilter,
  serializeHubFilter,
  filterItems,
  facetOptions,
  topTopics,
  visibleWindow,
  getFeatured,
  ALL_ITEMS,
  PAGE_SIZE,
  type HubFilter,
} from '@/lib/perspektifler';
import { usePublishedPosts } from '@/hooks/usePublishedPosts';
import { trackEvent } from '@/lib/analytics';

interface FeedProps {
  /** Pillar pages lock the category facet. */
  lockedCategory?: string;
}

export const PerspektiflerFeed: React.FC<FeedProps> = ({ lockedCategory }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qInputRef = useRef<HTMLInputElement>(null);
  const qDebounceRef = useRef<number | null>(null);

  const filter = useMemo(() => {
    const f = parseHubFilter(searchParams);
    return lockedCategory ? { ...f, kategori: lockedCategory } : f;
  }, [searchParams, lockedCategory]);

  // Published DB posts (NotebookLM pipeline) join the static corpus; static
  // slugs win on collision so the curated MDX library stays authoritative.
  const dbItems = usePublishedPosts();
  const allItems = useMemo(() => {
    if (dbItems.length === 0) return ALL_ITEMS;
    const staticSlugs = new Set(ALL_ITEMS.map((i) => i.slug));
    return [...ALL_ITEMS, ...dbItems.filter((i) => !staticSlugs.has(i.slug))];
  }, [dbItems]);

  const results = useMemo(() => filterItems(filter, allItems), [filter, allItems]);
  const options = useMemo(() => facetOptions(filter, allItems), [filter, allItems]);
  const chips = useMemo(() => topTopics(filter, 12, allItems), [filter, allItems]);
  const visible = visibleWindow(results, filter.page);
  const hasMore = results.length > filter.page * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  const isPristine = !filter.kategori && !filter.format && !filter.konu && !filter.yil && !filter.q;
  const { lead, secondary } = useMemo(getFeatured, []);
  const showHero = isPristine && filter.page === 1 && !lockedCategory;

  const update = (next: Partial<HubFilter>) => {
    // Functional form: two rapid facet changes (chip click then select) used
    // to merge against the previous render's stale filter and dropped the
    // first param from the URL. Deriving from `prev` makes updates race-free.
    setSearchParams(
      (prev) => {
        const current = lockedCategory
          ? { ...parseHubFilter(prev), kategori: lockedCategory }
          : parseHubFilter(prev);
        const merged: HubFilter = { ...current, ...next };
        if (lockedCategory) merged.kategori = undefined; // path carries the category
        return serializeHubFilter(merged);
      },
      { replace: false },
    );
  };

  const onSearchInput = (value: string) => {
    if (qDebounceRef.current) window.clearTimeout(qDebounceRef.current);
    qDebounceRef.current = window.setTimeout(() => {
      update({ q: value.trim() || undefined, page: 1 });
    }, 300);
  };

  const loadMore = () => {
    trackEvent('Perspektifler', 'load_more', `page_${filter.page + 1}`);
    update({ page: filter.page + 1 });
  };

  // GATE-5 analytics: every committed query + explicit zero-result flag.
  // Fires through the consent-gated helper; the URL-debounce above already
  // throttles, so each distinct q emits exactly once.
  useEffect(() => {
    if (!filter.q) return;
    trackEvent('Perspektifler', 'search_query', filter.q);
    if (results.length === 0) {
      trackEvent('Perspektifler', 'zero_result', filter.q);
    }
  }, [filter.q, results.length]);

  const batchOne = visible.slice(0, PAGE_SIZE);
  const rest = visible.slice(PAGE_SIZE);

  return (
    <div>
      {showHero && <PerspektiflerHero lead={lead} secondary={secondary} />}

      {/* Prominent search (BUG-09) */}
      <div className="relative max-w-xl mb-8">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          ref={qInputRef}
          type="search"
          defaultValue={filter.q ?? ''}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="İçgörülerde ara…"
          aria-label="İçgörülerde ara"
          data-testid="perspektifler-search"
          className="w-full rounded-xl border border-white/10 bg-[#0a0f1c] pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
        />
      </div>

      <PerspektiflerFacetBar
        filter={filter}
        options={options}
        resultCount={results.length}
        lockCategory={Boolean(lockedCategory)}
        onChange={(next) => {
          if (next.kategori !== undefined || next.format !== undefined) {
            trackEvent('Perspektifler', 'category_click', next.kategori ?? next.format ?? '');
          }
          update(next);
        }}
      />

      {/* Topic chips ≤12 + full vocabulary page */}
      {chips.length > 0 && (
        <nav aria-label="Konular" className="mb-10">
          <ul className="flex flex-wrap gap-2 items-center">
            {chips.map((chip) => {
              const active = filter.konu === chip.value;
              return (
                <li key={chip.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ konu: active ? undefined : chip.value, page: 1 })}
                    className={`rounded-full border px-3 py-1 text-xs transition outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${
                      active
                        ? 'border-yellow-400 bg-yellow-500/20 text-yellow-100'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {chip.label}{' '}
                    {/* a11y: inherit (slate-400 @ opacity) hit 4.34:1 — explicit slate-300 clears 4.5 in both chip states. */}
                    <span className="tabular-nums text-slate-300">{chip.count}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <Link
                to="/perspektifler/konular"
                className="text-xs font-semibold text-secondary hover:underline px-2 py-1"
              >
                Tüm Konular →
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Result grid */}
      {visible.length > 0 ? (
        <>
          <div
            data-testid="insights-article-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
          >
            {batchOne.map((post, index) => (
              <div role="listitem" key={post.slug}>
                <BlogCard post={post} index={index} />
              </div>
            ))}
          </div>

          {/* Founder Letter capsule after the first 12 cards (KVKK copy intact) */}
          {batchOne.length >= PAGE_SIZE && (
            <div className="my-12 max-w-2xl mx-auto">
              <NewsletterSidebar />
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8" role="list">
              {rest.map((post, index) => (
                <div role="listitem" key={post.slug}>
                  <BlogCard post={post} index={index + PAGE_SIZE} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                data-testid="perspektifler-load-more"
                className="btn-premium px-8 py-3 text-sm font-bold rounded-lg"
              >
                Daha Fazla Yükle
              </button>
            )}
            {/* Crawlable pagination links for bots (canonicalized in SEO layer) */}
            {totalPages > 1 && (
              <nav aria-label="Sayfalar" className="mt-5">
                <ul className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <li key={n}>
                      <a
                        href={`?${serializeHubFilter({ ...filter, page: n }).toString()}`}
                        aria-current={n === filter.page ? 'page' : undefined}
                        className={`inline-block min-w-6 px-2 py-1.5 text-center rounded hover:text-white ${n === filter.page ? 'text-white border border-white/20' : ''}`}
                      >
                        {n}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </>
      ) : (
        <div role="status" className="text-center text-slate-400 py-16">
          <p className="mb-4">Bu filtreyle eşleşen içgörü bulunamadı.</p>
          <p className="text-sm">
            Kategorilere göz atın:{' '}
            {options.kategoriler.slice(0, 3).map((c, i) => (
              <React.Fragment key={c.value}>
                {i > 0 && ' · '}
                <button
                  type="button"
                  onClick={() =>
                    update({ kategori: c.value, q: undefined, konu: undefined, page: 1 })
                  }
                  className="text-secondary hover:underline"
                >
                  {c.label}
                </button>
              </React.Fragment>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};
