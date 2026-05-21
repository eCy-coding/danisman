/**
 * AdminDevAnalyticsPage — geliştirici GA4 mock event monitor
 *
 * - GET /api/dev-analytics/events → event listesi (polling 10s)
 * - SSE: bu sayfada polling yeterli (dev-only hafif endpoint)
 * - Event type badge renklendirmesi
 * - "Temizle" → DELETE /api/dev-analytics/events (dev ortamı)
 * - Sadece non-production ortamda görünür; production'da uyarı banner
 */

import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Trash2, RefreshCw, AlertTriangle, Search, Terminal } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface AnalyticsEvent {
  id: string;
  event: string;
  params: Record<string, unknown>;
  timestamp: string;
  sessionId?: string;
  referrer?: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: { events: AnalyticsEvent[]; total: number; mode: string };
}

const EVENT_COLORS: Record<string, string> = {
  page_view: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  click: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  scroll: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  form_submit: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  conversion: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  error: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function eventColor(eventName: string): string {
  return EVENT_COLORS[eventName] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

const isProd = import.meta.env.PROD;

export const AdminDevAnalyticsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useQuery<ApiResponse>({
    queryKey: ['dev-analytics-events'],
    queryFn: () => apiClient.get<ApiResponse>('/dev-analytics/events').then((r) => r.data),
    refetchInterval: 10_000,
    enabled: !isProd,
    retry: 1,
  });

  const clearMutation = useMutation({
    mutationFn: () => apiClient.delete('/dev-analytics/events'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dev-analytics-events'] }),
  });

  const events = useMemo<AnalyticsEvent[]>(() => data?.data.events ?? [], [data]);

  const filtered = useMemo(() => {
    if (!search) return events;
    const t = search.toLowerCase();
    return events.filter(
      (e) =>
        e.event.toLowerCase().includes(t) ||
        (e.sessionId ?? '').toLowerCase().includes(t) ||
        JSON.stringify(e.params).toLowerCase().includes(t),
    );
  }, [events, search]);

  return (
    <>
      <Helmet>
        <title>Dev Analytics — eCyPro Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="p-6 max-w-350 mx-auto">
        {/* Page Header */}
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-violet-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white tracking-tight">Dev Analytics</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Mock GA4 event monitor — geliştirme ortamı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ['dev-analytics-events'] })
              }
              disabled={isFetching}
              aria-label="Yenile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => void clearMutation.mutate()}
              disabled={clearMutation.isPending}
              aria-label="Eventleri temizle"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Temizle</span>
            </button>
          </div>
        </header>

        {/* Production warning */}
        {isProd && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Production ortamında devre dışı</p>
              <p className="text-amber-200/70 text-xs mt-1">
                Dev Analytics yalnızca geliştirme ve staging ortamlarında aktiftir.
              </p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Toplam Event', value: data?.data.total ?? 0, color: 'text-white' },
            { label: 'Filtrelenen', value: filtered.length, color: 'text-secondary' },
            { label: 'Mod', value: data?.data.mode ?? '—', color: 'text-slate-300' },
            { label: 'Yenileme', value: '10s', color: 'text-slate-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-mono font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Event adı, session ID, parametre…"
            aria-label="Event ara"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="space-y-2" data-testid="dev-analytics-loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl border border-white/5 bg-white/5 p-12 text-center"
            data-testid="dev-analytics-empty"
          >
            <Activity size={32} className="mx-auto text-slate-700 mb-3" aria-hidden="true" />
            <p className="text-slate-300 font-medium">
              {events.length === 0 ? 'Henüz event yok' : 'Sonuç bulunamadı'}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              {events.length === 0
                ? 'Sayfada gezinin, tıklayın ya da form gönderin.'
                : 'Arama terimini değiştirin.'}
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-white/5 overflow-hidden"
            data-testid="dev-analytics-table"
          >
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Parametreler</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Session</th>
                  <th className="px-4 py-3 font-medium text-right">Zaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-white/3 transition-colors text-sm"
                    data-testid={`dev-event-${ev.id}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-xs font-mono ${eventColor(ev.event)}`}
                      >
                        {ev.event}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs text-slate-400 font-mono line-clamp-1">
                        {Object.keys(ev.params).length > 0
                          ? JSON.stringify(ev.params).slice(0, 80)
                          : '{}'}
                      </code>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-500 font-mono">
                        {ev.sessionId ? ev.sessionId.slice(0, 8) + '…' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
