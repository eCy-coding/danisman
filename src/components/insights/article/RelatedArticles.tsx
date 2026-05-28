import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { InsightPostCard } from '@/types/insights';
import { DOMAIN_COLORS, DOMAIN_LABELS } from '@/types/insights';

interface ArticleCardProps {
  post: InsightPostCard;
}

function ArticleCard({ post }: ArticleCardProps) {
  const domainColors = DOMAIN_COLORS[post.primaryDomain];
  const domainLabel = DOMAIN_LABELS[post.primaryDomain].tr;

  return (
    <Link
      to={`/insights/${post.slug}`}
      className="group flex gap-fib-4 rounded-xl border border-slate-200 bg-white p-fib-5 hover:border-amber-300 hover:shadow-md transition-all"
      data-testid={`related-article-${post.slug}`}
    >
      <img
        src={post.coverImageUrl}
        alt={post.coverImageAlt}
        className="h-16 w-16 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
          style={{ backgroundColor: domainColors.bg, color: domainColors.primary }}
        >
          {domainLabel}
        </span>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
          {post.titleTr}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{post.readingTimeMin} dk okuma</p>
      </div>
    </Link>
  );
}

interface RelatedArticlesProps {
  manual: InsightPostCard[];
  algorithmic: InsightPostCard[];
  className?: string;
}

export function RelatedArticles({ manual, algorithmic, className }: RelatedArticlesProps) {
  const combined = [...manual, ...algorithmic].slice(0, 6);

  if (combined.length === 0) return null;

  return (
    <section
      className={cn('', className)}
      aria-label="İlgili yazılar"
      data-testid="related-articles"
    >
      <h2 className="text-lg font-bold text-slate-800 mb-fib-5">
        Bu yazıyı okuyanlar şunları da okudu
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-fib-4">
        {combined.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
