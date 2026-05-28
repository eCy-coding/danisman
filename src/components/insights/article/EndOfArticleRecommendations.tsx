import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InsightPostCard } from '@/types/insights';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/types/insights';

interface EndCardProps {
  post: InsightPostCard;
}

function EndCard({ post }: EndCardProps) {
  const domainColors = DOMAIN_COLORS[post.primaryDomain];
  const domainLabel = DOMAIN_LABELS[post.primaryDomain].tr;

  return (
    <Link
      to={`/insights/${post.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-amber-300 hover:shadow-lg transition-all"
      data-testid={`end-recommendation-${post.slug}`}
    >
      <img src={post.coverImageUrl} alt={post.coverImageAlt} className="w-full h-40 object-cover" />
      <div className="p-fib-5 flex flex-col flex-1">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full mb-fib-3 inline-block self-start"
          style={{ backgroundColor: domainColors.bg, color: domainColors.primary }}
        >
          {domainLabel}
        </span>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors flex-1">
          {post.titleTr}
        </h3>
        <p className="text-xs text-slate-500 mt-fib-3">{post.readingTimeMin} dk okuma</p>
      </div>
    </Link>
  );
}

interface EndOfArticleRecommendationsProps {
  fromSeries?: InsightPostCard[];
  fromAuthor?: InsightPostCard[];
  trending?: InsightPostCard[];
  className?: string;
}

export function EndOfArticleRecommendations({
  fromSeries = [],
  fromAuthor = [],
  trending = [],
  className,
}: EndOfArticleRecommendationsProps) {
  const sections: { label: string; posts: InsightPostCard[] }[] = [
    { label: 'Seriden Devam Et', posts: fromSeries },
    { label: 'Aynı Yazardan', posts: fromAuthor },
    { label: 'Trend', posts: trending },
  ].filter((s) => s.posts.length > 0);

  if (sections.length === 0) return null;

  const allPosts = [...fromSeries, ...fromAuthor, ...trending]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 6);

  return (
    <section
      className={cn('', className)}
      aria-label="Sıradaki okuyun"
      data-testid="end-recommendations"
    >
      <h2 className="text-xl font-bold text-slate-800 mb-fib-6">Sırada ne okuyalım?</h2>

      {sections.length > 1 ? (
        <div className="space-y-fib-8">
          {sections.map((section) => (
            <div key={section.label}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-fib-4">
                {section.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-fib-4">
                {section.posts.slice(0, 3).map((post) => (
                  <EndCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-fib-4">
          {allPosts.map((post) => (
            <EndCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
