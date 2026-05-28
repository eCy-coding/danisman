import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightPostCard } from '@/types/insights';
import { DOMAIN_LABELS, ARTICLE_TYPE_LABELS } from '@/types/insights';
import { insightsI18n } from '@/i18n/keys/insights';

interface EditorialHeroProps {
  featuredPost: InsightPostCard | null;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function EditorialHero({ featuredPost }: EditorialHeroProps) {
  const i18n = insightsI18n.hub;

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: '#fefdf9' }}
      data-testid="editorial-hero"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/40 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="max-w-3xl mb-10">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold tracking-widest uppercase text-amber-600 mb-4"
            data-testid="hero-eyebrow"
          >
            {i18n.eyebrow.tr}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-5"
            data-testid="hero-h1"
          >
            {i18n.h1.tr}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-lg text-slate-600 mb-7"
          >
            {i18n.sub.tr}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href="#newsletter"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
                'bg-amber-600 text-white font-semibold text-sm',
                'hover:bg-amber-700 transition-colors',
              )}
              data-testid="newsletter-cta"
            >
              {i18n.subscribeNewsletter.tr}
              <ArrowRight className="w-4 h-4" />
            </a>

            <span
              className="flex items-center gap-1.5 text-xs text-slate-500"
              data-testid="kvkk-badge"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {i18n.kvkkBadge.tr}
            </span>
          </motion.div>
        </div>

        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm"
            data-testid="hero-featured-post"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative overflow-hidden">
                <div className="aspect-[16/10] md:aspect-auto md:h-full min-h-[220px]">
                  <img
                    src={featuredPost.coverImageUrl}
                    alt={featuredPost.coverImageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 pointer-events-none" />
              </div>

              <div className="p-8 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    {DOMAIN_LABELS[featuredPost.primaryDomain].tr}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500">
                    {ARTICLE_TYPE_LABELS[featuredPost.type].tr}
                  </span>
                </div>

                <Link to={`/insights/${featuredPost.slug}`}>
                  <h2 className="text-2xl font-bold text-slate-900 leading-snug hover:text-amber-700 transition-colors mb-3">
                    {featuredPost.titleTr}
                  </h2>
                </Link>

                {featuredPost.excerptTr && (
                  <p className="text-slate-600 text-sm leading-relaxed mb-5 line-clamp-3">
                    {featuredPost.excerptTr}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <img
                    src={featuredPost.author.avatarUrl}
                    alt={featuredPost.author.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-slate-700">{featuredPost.author.displayName}</p>
                    {featuredPost.publishedAt && (
                      <time dateTime={featuredPost.publishedAt}>
                        {formatDate(featuredPost.publishedAt)}
                      </time>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readingTimeMin} dk
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {featuredPost.viewCount.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
