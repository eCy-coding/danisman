import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, PauseCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightSeries, SeriesStatus } from '@/types/insights';

interface SeriesShowcaseProps {
  series: InsightSeries[];
}

const STATUS_CONFIG: Record<
  SeriesStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  ACTIVE: {
    label: 'Devam Ediyor',
    icon: Play,
    className: 'bg-emerald-50 text-emerald-700',
  },
  COMPLETED: {
    label: 'Tamamlandı',
    icon: CheckCircle2,
    className: 'bg-blue-50 text-blue-700',
  },
  ON_HIATUS: {
    label: 'Ara Verildi',
    icon: PauseCircle,
    className: 'bg-amber-50 text-amber-700',
  },
};

function SeriesCard({ series }: { series: InsightSeries }) {
  const status = STATUS_CONFIG[series.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      data-testid="series-card"
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-slate-100">
        <img
          src={series.coverImageUrl}
          alt={series.titleTr}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              status.className,
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium" data-testid="series-part-count">
            {series.totalParts} bölüm
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{series.titleTr}</h3>

        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{series.descriptionTr}</p>

        <a
          href={`/insights/series/${series.slug}`}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors',
          )}
          data-testid="series-follow-btn"
        >
          Seriyi takip et
        </a>
      </div>
    </motion.div>
  );
}

export function SeriesShowcase({ series }: SeriesShowcaseProps) {
  if (!series.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10" data-testid="series-showcase">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Seri Yazılar</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </section>
  );
}
