import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { FeedItem } from '@/lib/perspektifler';
import { BLOG_CATEGORY_META, type BlogCategory } from '@/types/blog';

/** Curated editorial layer above the chronological stream: 1 featured lead +
 *  up to 3 secondary picks (istek.md v2 §PHASE 3a). Rendered only on the
 *  unfiltered first page. */
export const PerspektiflerHero: React.FC<{ lead: FeedItem | null; secondary: FeedItem[] }> = ({
  lead,
  secondary,
}) => {
  if (!lead) return null;
  const leadMeta = BLOG_CATEGORY_META[lead.category as BlogCategory];

  return (
    <section
      data-testid="perspektifler-featured"
      aria-label="Öne çıkan içgörüler"
      className="mb-14"
    >
      <div className="grid lg:grid-cols-5 gap-6">
        <Link
          to={lead.href}
          className="lg:col-span-3 group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0f1c] focus-visible:ring-2 focus-visible:ring-secondary outline-none min-h-72 flex flex-col justify-end"
        >
          {lead.coverImage && (
            <img
              src={lead.coverImage}
              alt=""
              width={1200}
              height={675}
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-[1.02] transition-all duration-500"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#050810] via-[#050810]/40 to-transparent" />
          <div className="relative p-7">
            <span
              className={`inline-block border text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-4 ${leadMeta?.bg ?? 'bg-white/10'} ${leadMeta?.border ?? 'border-white/20'} ${leadMeta?.color ?? 'text-white/90'}`}
            >
              {lead.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-serif text-white leading-snug mb-3 group-hover:text-blue-200 transition-colors">
              {lead.title}
            </h2>
            <p className="text-sm text-slate-300 line-clamp-2 max-w-xl mb-3">{lead.excerpt}</p>
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={13} className="text-yellow-500" />
              {lead.readingTime}
              <span aria-hidden="true">·</span>
              {new Date(lead.date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </Link>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {secondary.map((item) => {
            const meta = BLOG_CATEGORY_META[item.category as BlogCategory];
            return (
              <Link
                key={item.slug}
                to={item.href}
                className="group flex gap-4 items-start rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all p-4 focus-visible:ring-2 focus-visible:ring-secondary outline-none"
              >
                {item.coverImage && (
                  <img
                    src={item.coverImage}
                    alt=""
                    width={112}
                    height={63}
                    loading="lazy"
                    className="w-28 h-16 shrink-0 rounded-lg object-cover border border-white/10"
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${meta?.color ?? 'text-slate-400'}`}
                  >
                    {item.category}
                  </span>
                  <span className="block text-sm font-semibold text-slate-200 group-hover:text-white leading-snug line-clamp-2 mt-1">
                    {item.title}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
