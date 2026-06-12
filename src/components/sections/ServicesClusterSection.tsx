/**
 * SVC P6 — Department lifecycle visualizer (taxonomy v2).
 *
 * Previous version hand-maintained a third service list with stale hrefs
 * (e.g. /services/esg-reporting → 404). Now every cluster, step order, label
 * and link derives from src/data/service-taxonomy.ts + the SERVICES catalog —
 * drift-proof and covered by src/test/pages/services-page-v2.test.tsx.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Handshake,
  Leaf,
  Cpu,
  Users,
  UserCog,
  ShieldAlert,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SERVICE_DEPARTMENTS, type ServiceDepartment } from '@/data/service-taxonomy';
import { SERVICES } from '@/data/services';

const DEPT_ICON: Record<ServiceDepartment['id'], React.ReactNode> = {
  ma: <Handshake size={22} aria-hidden="true" />,
  esg: <Leaf size={22} aria-hidden="true" />,
  fintech: <Cpu size={22} aria-hidden="true" />,
  aile: <Users size={22} aria-hidden="true" />,
  insan: <UserCog size={22} aria-hidden="true" />,
  risk: <ShieldAlert size={22} aria-hidden="true" />,
  buyume: <Rocket size={22} aria-hidden="true" />,
};

const DEPT_TONE: Record<ServiceDepartment['id'], { text: string; border: string; badge: string }> =
  {
    ma: { text: 'text-blue-400', border: 'border-blue-500/20', badge: 'bg-blue-500/10' },
    esg: { text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10' },
    fintech: {
      text: 'text-violet-400',
      border: 'border-violet-500/20',
      badge: 'bg-violet-500/10',
    },
    aile: { text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/10' },
    insan: { text: 'text-cyan-400', border: 'border-cyan-500/20', badge: 'bg-cyan-500/10' },
    risk: { text: 'text-rose-400', border: 'border-rose-500/20', badge: 'bg-rose-500/10' },
    buyume: { text: 'text-teal-400', border: 'border-teal-500/20', badge: 'bg-teal-500/10' },
  };

const titleOf = (slug: string): string =>
  SERVICES.find((s) => s.link.endsWith(`/${slug}`))?.title ?? slug;

interface ServicesClusterSectionProps {
  className?: string;
}

export const ServicesClusterSection: React.FC<ServicesClusterSectionProps> = ({ className }) => {
  const { i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  return (
    <section
      data-testid="services-cluster-section"
      aria-label={lang === 'tr' ? 'Hizmet yaşam döngüsü kümeleri' : 'Service lifecycle clusters'}
      className={cn('py-20 bg-[#060A14]', className)}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">
            {lang === 'tr' ? 'Engagement Yaşam Döngüleri' : 'Engagement Lifecycles'}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {lang === 'tr'
              ? 'Her küme sıralı bir çalışma akışıdır — nereden başlanacağı ve yolculuğun nereye gittiği baştan bellidir.'
              : 'Each cluster is a sequential workflow — where to start and where the journey leads is clear from day one.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {SERVICE_DEPARTMENTS.map((dept) => {
            const tone = DEPT_TONE[dept.id];
            return (
              <div
                key={dept.id}
                data-testid={`lifecycle-cluster-${dept.id}`}
                className={cn(
                  'bg-[#0A0F1C] border rounded-2xl p-8 hover:border-white/15 transition-colors duration-300',
                  tone.border,
                )}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn('mt-0.5', tone.text)}>{DEPT_ICON[dept.id]}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {dept.label[lang]}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {dept.description[lang]}
                    </p>
                  </div>
                </div>

                <ol
                  className="space-y-1.5"
                  aria-label={
                    lang === 'tr'
                      ? `${dept.label.tr} çalışma akışı adımları`
                      : `${dept.label.en} workflow steps`
                  }
                >
                  {dept.lifecycle.map((slug, idx) => (
                    <li key={slug} data-testid={`lifecycle-step-${dept.id}`}>
                      <Link
                        to={`/services/${slug}`}
                        className="group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors duration-150 text-sm text-slate-300 hover:text-white"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums',
                            tone.badge,
                            tone.text,
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">{titleOf(slug)}</span>
                        <ArrowRight
                          size={13}
                          className={cn(
                            'shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150',
                            tone.text,
                          )}
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
