import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { InsightPost } from '@/types/insights';
import { DOMAIN_META } from '@/types/insights';

interface InsightCardProps {
  post: InsightPost;
  size?: 'sm' | 'md' | 'lg';
  showExcerpt?: boolean;
  className?: string;
}

export function InsightCard({
  post,
  size = 'md',
  showExcerpt = false,
  className = '',
}: InsightCardProps) {
  const { t } = useTranslation('insights');
  const domainMeta = DOMAIN_META[post.primaryDomain];

  const titleClamp =
    size === 'sm' ? 'line-clamp-2' : size === 'lg' ? 'line-clamp-3' : 'line-clamp-2';
  const cardPadding = size === 'sm' ? 'p-[13px]' : 'p-[21px]';
  const imgHeight = size === 'lg' ? 'h-48' : size === 'md' ? 'h-36' : 'h-28';

  const publishedDate = new Date(post.publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link
      to={`/insights/${post.slug}`}
      data-testid="insight-card"
      className={[
        'group flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden',
        'transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-slate-900/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
        className,
      ].join(' ')}
    >
      {/* Cover image */}
      <div className={`relative ${imgHeight} overflow-hidden bg-slate-800`}>
        <img
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {post.isFeatured && (
          <span
            data-testid="featured-badge"
            className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-xs font-semibold px-2 py-0.5 rounded"
          >
            {t('card.featured')}
          </span>
        )}
        {post.isEditorsPick && (
          <span className="absolute top-2 right-2 bg-slate-900/80 text-amber-400 text-xs font-medium px-2 py-0.5 rounded border border-amber-500/30">
            {t('card.editorsPick')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${cardPadding} gap-[13px]`}>
        {/* Domain badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            data-testid="domain-badge"
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: domainMeta.bgColor, color: domainMeta.color }}
          >
            {domainMeta.labelTr}
          </span>
          {post.seriesOrder !== undefined && post.series && (
            <span
              data-testid="series-badge"
              className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
            >
              {t('card.seriesPart', { part: post.seriesOrder })}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`font-semibold text-slate-100 leading-snug ${titleClamp} ${size === 'lg' ? 'text-xl' : 'text-base'}`}
        >
          {post.titleTr}
        </h3>

        {/* Excerpt */}
        {showExcerpt && post.excerptTr && (
          <p className="text-sm text-slate-400 line-clamp-2">{post.excerptTr}</p>
        )}

        {/* Footer: author + meta */}
        <div className="flex items-center gap-[13px] mt-auto pt-[13px] border-t border-slate-800">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-7 h-7 rounded-full object-cover bg-slate-700 flex-shrink-0"
            loading="lazy"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-slate-300 truncate">
              {post.author.displayName}
            </span>
            <div className="flex items-center gap-[8px] text-xs text-slate-500">
              <span>{publishedDate}</span>
              <span aria-hidden="true">·</span>
              <span>
                {post.readingTimeMin} {t('card.minRead')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
