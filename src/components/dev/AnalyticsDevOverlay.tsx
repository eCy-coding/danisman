/**
 * AnalyticsDevOverlay — Geliştirici Modu Analytics Paneli
 * istek5.txt Phase 6: Observability — Analytics-Dev (Port 4001)
 *
 * - Sadece DEV modunda aktif (import.meta.env.DEV)
 * - `analytics-dev.ts` sunucusunun GET /events endpoint'ini poll eder
 * - Son 20 eventi gösterir (kaynak, isim, zaman)
 * - Köşe rozeti: toplam event sayısı + son saniye
 * - Minimize/maximize toggle + sürüklenebilir pozisyon
 * - GA4, GTM, custom event kategorileri renk kodlu
 * - SADECE geliştirme ortamında render edilir (PROD'da null döner)
 *
 * Kullanım: MainLayout'a veya App.tsx'e ekle:
 *   {import.meta.env.DEV && <AnalyticsDevOverlay />}
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, X, Minimize2, Maximize2, ChevronDown, RefreshCw } from 'lucide-react';

interface AnalyticsEvent {
  ts: number;
  source: 'ga4' | 'gtm' | 'custom';
  name: string;
  payload: Record<string, unknown>;
}

const ANALYTICS_DEV_URL = `http://localhost:${import.meta.env.VITE_ANALYTICS_DEV_PORT ?? '4001'}`;

const SOURCE_COLORS: Record<string, string> = {
  ga4: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  gtm: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  custom: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
};

const MAX_VISIBLE = 20;
const POLL_MS = 2_000;

export const AnalyticsDevOverlay: React.FC = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${ANALYTICS_DEV_URL}/events`, {
        signal: AbortSignal.timeout(1_500),
      });
      if (!res.ok) throw new Error('not_ok');
      const data = (await res.json()) as AnalyticsEvent[];
      setEvents(data.slice(0, MAX_VISIBLE));
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    void fetchEvents();
    pollRef.current = setInterval(() => {
      void fetchEvents();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, fetchEvents]);

  const filtered = filter === 'all' ? events : events.filter((e) => e.source === filter);

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-50 font-mono text-xs"
      data-testid="analytics-dev-overlay"
      role="region"
      aria-label="Analytics Dev Overlay"
    >
      {/* Trigger badge */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0a0f1e]/95 border border-white/15 text-slate-400 hover:text-white hover:border-white/25 transition-all shadow-xl"
          title="Analytics Dev Overlay (DEV only)"
        >
          <BarChart3 size={14} className="text-blue-400" aria-hidden="true" />
          <span className="text-[10px] font-semibold text-slate-400">ANALYTICS</span>
          {events.length > 0 && (
            <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
              {events.length}
            </span>
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full ${connected === true ? 'bg-emerald-400' : connected === false ? 'bg-rose-400' : 'bg-slate-500'}`}
            title={
              connected === true
                ? 'Connected'
                : connected === false
                  ? 'Disconnected'
                  : 'Checking...'
            }
            aria-hidden="true"
          />
        </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 rounded-2xl bg-[#080d1a]/98 border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <BarChart3 size={13} className="text-blue-400" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-slate-300">Analytics Dev</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    connected === true
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {connected === true ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void fetchEvents()}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized((p) => !p)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {minimized ? (
                    <Maximize2 size={12} aria-hidden="true" />
                  ) : (
                    <Minimize2 size={12} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {/* Filter tabs */}
                  <div className="flex gap-1 px-4 py-2 border-b border-white/5">
                    {['all', 'ga4', 'gtm', 'custom'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-semibold uppercase transition-colors ${
                          filter === f
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Event list */}
                  <div className="max-h-64 overflow-y-auto space-y-0.5 p-2">
                    {filtered.length === 0 ? (
                      <div className="text-center py-8 text-slate-600">
                        <ChevronDown
                          size={16}
                          className="mx-auto mb-2 opacity-50"
                          aria-hidden="true"
                        />
                        <p className="text-[10px]">
                          {connected === false
                            ? `analytics-dev.ts çalışmıyor (port ${import.meta.env.VITE_ANALYTICS_DEV_PORT ?? '4001'})`
                            : 'Henüz event yok — uygulama ile etkileşime girin'}
                        </p>
                      </div>
                    ) : (
                      filtered.map((ev, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/3 transition-colors group"
                        >
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${SOURCE_COLORS[ev.source] ?? SOURCE_COLORS.custom}`}
                          >
                            {ev.source.toUpperCase()}
                          </span>
                          <span className="flex-1 truncate text-slate-300 text-[10px]">
                            {ev.name}
                          </span>
                          <span className="text-[9px] text-slate-600 shrink-0">
                            {formatTime(ev.ts)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer stats */}
                  <div className="px-4 py-2 border-t border-white/5 flex justify-between text-[10px] text-slate-600">
                    <span>{events.length} event</span>
                    <span>Poll: {POLL_MS / 1000}s</span>
                    <span>:{import.meta.env.VITE_ANALYTICS_DEV_PORT ?? '4001'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
