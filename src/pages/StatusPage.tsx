/**
 * StatusPage — public uptime dashboard (Atlassian Statuspage tarzı)
 *
 * - `/api/status` 30s otomatik refresh (TanStack Query)
 * - 3 component card: API / Database / Cache
 * - Genel banner: tüm sistemler çalışıyor / kısmi sorun / büyük arıza
 * - SEO: helmet meta description, title
 * - Erişilebilir: aria-live, role=status, focus-visible odaklar
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Database,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiClient, IS_SIMULATION_MODE } from '../lib/api';
import { useTranslation } from '../lib/i18n';

type IndicatorLevel = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'critical';

interface ComponentStatus {
  name: string;
  status: IndicatorLevel | string;
}

interface StatusResponse {
  page: { name: string; url: string };
  status: { indicator: IndicatorLevel | string; description: string };
  components: ComponentStatus[];
  updatedAt: string;
}

const STATUS_META: Record<
  string,
  {
    color: string;
    bg: string;
    border: string;
    icon: React.ElementType;
    label: { tr: string; en: string };
  }
> = {
  operational: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
    label: { tr: 'Çalışıyor', en: 'Operational' },
  },
  degraded: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
    label: { tr: 'Performans düşük', en: 'Degraded' },
  },
  partial_outage: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: AlertTriangle,
    label: { tr: 'Kısmi arıza', en: 'Partial Outage' },
  },
  major_outage: {
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: XCircle,
    label: { tr: 'Büyük arıza', en: 'Major Outage' },
  },
  critical: {
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: XCircle,
    label: { tr: 'Kritik', en: 'Critical' },
  },
};

const COMPONENT_ICONS: Record<string, React.ElementType> = {
  API: Activity,
  Database: Database,
  Cache: Zap,
};

function getMeta(status: string): (typeof STATUS_META)[keyof typeof STATUS_META] {
  return STATUS_META[status] ?? STATUS_META.operational!;
}

export const StatusPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const { data, isLoading, isError, refetch, isFetching } = useQuery<StatusResponse>({
    queryKey: ['public-status'],
    // IS_SIMULATION_MODE (no VITE_API_URL → apiClient baseURL is '') means a
    // bare '/status' call resolves RELATIVE TO THE SPA ORIGIN, colliding with
    // this very page's own client-side route (`/status` in App.tsx) — the
    // request returns the SPA's index.html instead of JSON, and
    // `data.status.indicator` throws on a string, which the ErrorBoundary
    // then rendered as "Hizmet Kesintisi" for every visitor. Force the
    // `/api` prefix in that mode so the request targets the actual status
    // endpoint; hybrid mode's baseURL already ends in `/api`.
    queryFn: () =>
      apiClient
        .get<StatusResponse>(IS_SIMULATION_MODE ? '/api/status' : '/status')
        .then((r) => r.data),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const overallStatus = data?.status?.indicator ?? 'operational';
  const overallMeta = getMeta(overallStatus);
  const OverallIcon = overallMeta.icon;

  return (
    <>
      <Helmet>
        <title>{lang === 'tr' ? 'Sistem Durumu | eCyPro' : 'System Status | eCyPro'}</title>
        <meta
          name="description"
          content={
            lang === 'tr'
              ? 'eCyPro platform sağlık paneli — API, veritabanı ve cache servislerinin canlı durumu.'
              : 'eCyPro platform health dashboard — live status of API, database, and cache services.'
          }
        />
        {/* P15 — Status sayfası operational; SERP'te değer üretmez, noindex. */}
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight mb-3">
              {lang === 'tr' ? 'Sistem Durumu' : 'System Status'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
              {lang === 'tr'
                ? 'eCyPro platformunun gerçek zamanlı sağlık göstergesi. Sayfa her 30 saniyede otomatik yenilenir.'
                : 'Real-time health indicator for the eCyPro platform. This page auto-refreshes every 30 seconds.'}
            </p>
          </header>

          {/* Overall Banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            role="status"
            aria-live="polite"
            data-testid="status-overall"
            className={`mb-10 rounded-2xl border ${overallMeta.border} ${overallMeta.bg} p-6`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <OverallIcon className={`w-10 h-10 ${overallMeta.color}`} aria-hidden="true" />
                <div>
                  <p
                    className={`text-xs uppercase tracking-widest font-medium ${overallMeta.color}`}
                  >
                    {overallMeta.label[lang]}
                  </p>
                  <p className="text-xl sm:text-2xl text-white font-medium mt-1">
                    {data?.status?.description ?? (lang === 'tr' ? 'Yükleniyor…' : 'Loading…')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                aria-label={lang === 'tr' ? 'Yenile' : 'Refresh'}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
              </button>
            </div>
          </motion.div>

          {/* Components */}
          <section aria-labelledby="components-heading" className="mb-10">
            <h2
              id="components-heading"
              className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3"
            >
              {lang === 'tr' ? 'Bileşenler' : 'Components'}
            </h2>

            {isLoading ? (
              <div className="space-y-2" data-testid="status-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300 text-sm"
              >
                {lang === 'tr'
                  ? 'Durum bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.'
                  : 'Could not load status. Please try again later.'}
              </div>
            ) : (
              <ul className="space-y-2" data-testid="status-components">
                {(data?.components ?? []).map((c) => {
                  const meta = getMeta(c.status);
                  const ComponentIcon = COMPONENT_ICONS[c.name] ?? Activity;
                  const StatusIcon = meta.icon;
                  return (
                    <li
                      key={c.name}
                      data-testid={`status-component-${c.name.toLowerCase()}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ComponentIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${meta.color}`}>
                        <StatusIcon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs sm:text-sm font-medium">{meta.label[lang]}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Last Updated */}
          {data?.updatedAt && (
            <footer className="text-center text-xs text-slate-500 font-mono">
              {lang === 'tr' ? 'Son güncelleme:' : 'Last updated:'}{' '}
              {new Date(data.updatedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
            </footer>
          )}
        </div>
      </div>
    </>
  );
};

export default StatusPage;
