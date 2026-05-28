import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Clock as ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DomainSpotlight } from '@/types/insights';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/types/insights';

interface DomainSpotlightCardsProps {
  spotlights: DomainSpotlight[];
}

const DOMAIN_ICONS: Record<string, string> = {
  M_A: '⚡',
  ESG: '🌿',
  FINTECH: '💳',
  AILE_SIRKETI: '🏛️',
};

function MiniCard({
  post,
  label,
  icon: Icon,
}: {
  post: DomainSpotlight['latest'];
  label: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <Link
          to={`/insights/${post.slug}`}
          className="text-sm font-medium text-slate-800 hover:text-amber-700 transition-colors line-clamp-2"
        >
          {post.titleTr}
        </Link>
        <p className="text-xs text-slate-400 mt-1">
          <ClockIcon className="inline w-3 h-3 mr-0.5" />
          {post.readingTimeMin} dk
        </p>
      </div>
    </div>
  );
}

export function DomainSpotlightCards({ spotlights }: DomainSpotlightCardsProps) {
  return (
    <section className="bg-slate-50 py-10" data-testid="domain-spotlight-cards">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Alana Göre</h2>

        <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
          {spotlights.map((spotlight) => {
            const color = DOMAIN_COLORS[spotlight.domain];
            const label = DOMAIN_LABELS[spotlight.domain].tr;
            const emoji = DOMAIN_ICONS[spotlight.domain];

            return (
              <div
                key={spotlight.domain}
                className={cn(
                  'flex-shrink-0 w-72 bg-white rounded-xl border border-slate-200 overflow-hidden',
                )}
                data-testid={`domain-spotlight-${spotlight.domain}`}
              >
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: color.bg }}
                >
                  <span className="text-xl">{emoji}</span>
                  <h3 className={cn('font-bold text-base', color.text)}>{label}</h3>
                </div>

                <div className="px-5 py-2">
                  <MiniCard post={spotlight.latest} label="En Yeni" icon={ClockIcon} />
                  <MiniCard post={spotlight.popular} label="En Popüler" icon={TrendingUp} />
                  <MiniCard post={spotlight.editorsPick} label="Editör Seçimi" icon={Star} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
