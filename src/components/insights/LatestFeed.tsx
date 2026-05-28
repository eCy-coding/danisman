import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InsightCard } from './InsightCard';
import type { InsightPostCard } from '@/types/insights';
import { cn } from '@/lib/utils';

interface LatestFeedProps {
  posts: InsightPostCard[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

function CardSkeleton() {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
      data-testid="card-skeleton"
    >
      <div className="aspect-[16/9] bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-slate-200 rounded-full" />
          <div className="h-5 w-12 bg-slate-200 rounded-full" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-4/5" />
        <div className="h-4 bg-slate-200 rounded w-3/5" />
        <div className="h-3 bg-slate-100 rounded w-2/5" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="col-span-2 flex flex-col items-center justify-center py-20 text-slate-500"
      data-testid="empty-state"
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <p className="text-lg font-medium mb-1">Sonuç bulunamadı</p>
      <p className="text-sm">Farklı filtreler deneyebilirsiniz</p>
    </div>
  );
}

export function LatestFeed({ posts, hasMore, onLoadMore, isLoading }: LatestFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(posts.length / 2);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => document.documentElement,
    estimateSize: () => 380,
    overscan: 2,
  });

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (isLoading && posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-10" data-testid="latest-feed">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Son Yazılar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-10" data-testid="latest-feed">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Son Yazılar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyState />
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-10" data-testid="latest-feed">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Son Yazılar</h2>

      <div ref={parentRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const left = posts[virtualRow.index * 2];
            const right = posts[virtualRow.index * 2 + 1];

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  'grid gap-5 pb-5',
                  right ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
                )}
              >
                {left && <InsightCard post={left} data-testid="latest-feed-card" />}
                {right && <InsightCard post={right} data-testid="latest-feed-card" />}
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      <div ref={loadMoreRef} className="h-10" data-testid="load-more-trigger" />
    </section>
  );
}
