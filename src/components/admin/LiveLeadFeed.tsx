/**
 * LiveLeadFeed — gerçek zamanlı lead akışı (SSE + polling fallback)
 *
 * - SSE: `GET /api/admin/analytics-stream` eventi "contact_new" dinler
 * - Fallback: 30s polling `/api/admin/contacts?limit=10`
 * - Son 10 entry animasyonlu ring görünümünde
 * - Unread badge, tier renklendirilmesi (score > 80 → A)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, User, Clock, Building2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useAppStore } from '../../stores/useAppStore';

interface LiveLead {
  id: string;
  fullName: string;
  email: string;
  company?: string | null;
  createdAt: string;
  isRead: boolean;
  service?: string | null;
}

interface ApiPage {
  status: string;
  data: { items: LiveLead[]; total: number };
}

const MAX_FEED = 10;
const POLL_MS = 30_000;

function scoreToTier(lead: LiveLead): 'high' | 'mid' | 'low' {
  if (lead.company && !lead.isRead) return 'high';
  if (!lead.isRead) return 'mid';
  return 'low';
}

const TIER_DOT: Record<'high' | 'mid' | 'low', string> = {
  high: 'bg-rose-400',
  mid: 'bg-amber-400',
  low: 'bg-emerald-400',
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}g`;
  if (h > 0) return `${h}s`;
  if (m > 0) return `${m}dk`;
  return 'az önce';
}

export const LiveLeadFeed: React.FC = () => {
  const [leads, setLeads] = useState<LiveLead[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storeToken = useAppStore((s) => s.token);

  const fetchRecent = useCallback(async (): Promise<void> => {
    try {
      if (!storeToken) return;
      const res = await apiClient.get<ApiPage>('/admin/contacts?limit=10&sort=createdAt:desc');
      setLeads(res.data.data.items.slice(0, MAX_FEED));
      setError(false);
    } catch {
      setError(true);
    }
  }, [storeToken]);

  // Initial load
  useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  // SSE connection
  useEffect(() => {
    const token = storeToken;
    const baseUrl =
      (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api';
    const url = `${baseUrl}/admin/analytics-stream?token=${token ?? ''}`;

    let es: EventSource;
    try {
      es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('open', () => {
        setConnected(true);
        setError(false);
      });
      es.addEventListener('error', () => {
        setConnected(false);
        // SSE unavailable → polling fallback
        if (!pollRef.current) {
          pollRef.current = setInterval(() => void fetchRecent(), POLL_MS);
        }
      });
      es.addEventListener('contact_new', (e: MessageEvent) => {
        try {
          const lead = JSON.parse(e.data as string) as LiveLead;
          setLeads((prev) => [lead, ...prev].slice(0, MAX_FEED));
        } catch {
          /* ignore */
        }
      });
      es.addEventListener('heartbeat', () => {
        setConnected(true);
      });
    } catch {
      setConnected(false);
      // P14 — guard: error handler above may have already started the poll.
      if (!pollRef.current) {
        pollRef.current = setInterval(() => void fetchRecent(), POLL_MS);
      }
    }

    return () => {
      es?.close();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchRecent, storeToken]);

  return (
    <div
      className="rounded-xl border border-white/5 bg-linear-to-br from-slate-900/50 to-slate-800/30 p-5"
      data-testid="live-lead-feed"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-medium text-white">Live Lead Feed</h3>
        </div>
        {connected ? (
          <Wifi size={14} className="text-emerald-400" aria-label="SSE bağlı" />
        ) : (
          <WifiOff size={14} className="text-slate-500" aria-label="Polling modu" />
        )}
      </div>

      {/* Feed */}
      {error ? (
        <p className="text-xs text-rose-300 text-center py-6">
          Veri alınamadı. Oturumu kontrol edin.
        </p>
      ) : leads.length === 0 ? (
        <div className="py-8 text-center" data-testid="live-feed-empty">
          <User size={28} className="mx-auto text-slate-700 mb-2" aria-hidden="true" />
          <p className="text-xs text-slate-500">Henüz lead yok</p>
        </div>
      ) : (
        <ul className="space-y-1" aria-label="Son lead'ler">
          <AnimatePresence initial={false}>
            {leads.map((lead) => {
              const tier = scoreToTier(lead);
              return (
                <motion.li
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  data-testid={`live-lead-${lead.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                    !lead.isRead
                      ? 'bg-white/5 border-white/10'
                      : 'border-transparent hover:bg-white/3'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[tier]}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate font-medium">{lead.fullName}</p>
                    {lead.company && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2
                          size={9}
                          className="text-slate-500 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[10px] text-slate-500 truncate">{lead.company}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500 font-mono">
                    <Clock size={9} aria-hidden="true" />
                    {relativeTime(lead.createdAt)}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};
