/**
 * HotLeadsTable — Tier A sıcak lead listesi (admin)
 *
 * - `/api/crm/leads/hot` endpoint'inden veri (admin token gerekli)
 * - Tier badge: A (kırmızı), B (sarı), C (gri)
 * - Action: "Telegram bildir" → POST /api/crm/notify
 * - Sort: skor desc default
 * - Empty state, loading skeleton, error state
 */

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Mail, Building2, Bell, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface HotLead {
  id: string;
  email: string;
  name: string;
  company: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  score: number;
  tier: 'A' | 'B' | 'C';
  tierLabel: string;
  tierColor: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: { items: HotLead[]; total: number; scannedTotal: number };
}

const TIER_BADGE_CLASSES: Record<HotLead['tier'], string> = {
  A: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  B: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  C: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export const HotLeadsTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [notifying, setNotifying] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['crm-hot-leads'],
    queryFn: () => apiClient.get<ApiResponse>('/crm/leads/hot').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const notifyMutation = useMutation({
    mutationFn: (lead: HotLead) =>
      apiClient.post('/crm/notify', {
        message: `🔥 Hot Lead: ${lead.name} <${lead.email}> | Skor: ${lead.score} (Tier ${lead.tier})`,
      }),
  });

  const items = useMemo<HotLead[]>(() => data?.data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter((l) =>
      [l.name, l.email, l.company ?? '', l.tier].some((f) => f.toLowerCase().includes(term)),
    );
  }, [items, search]);

  const handleNotify = async (lead: HotLead): Promise<void> => {
    setNotifying(lead.id);
    try {
      await notifyMutation.mutateAsync(lead);
    } finally {
      setNotifying(null);
    }
  };

  // ── States ──
  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="hot-leads-loading">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-rose-300 font-medium">Lead listesi yüklenemedi</p>
          <p className="text-rose-200/70 text-xs mt-1">
            Yetki sorunu olabilir. Admin oturumunuzun açık olduğundan emin olun.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="space-y-4" data-testid="hot-leads-table">
      {/* Search + Stats Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, email, şirket veya tier ara…"
            aria-label="Lead ara"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-secondary"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          {data?.data.total ?? 0} sıcak / {data?.data.scannedTotal ?? 0} taranan
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-white/5 bg-white/5 p-12 text-center"
          data-testid="hot-leads-empty"
        >
          <p className="text-slate-300 font-medium">
            {items.length === 0 ? 'Henüz Tier A lead yok' : 'Sonuç bulunamadı'}
          </p>
          <p className="text-slate-500 text-xs mt-2">
            {items.length === 0
              ? 'Yeni iletişim formu gelince burada görünecek.'
              : 'Arama kriterini değiştirin.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/5">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Şirket</th>
                <th className="px-4 py-3 font-medium text-center">Tier</th>
                <th className="px-4 py-3 font-medium text-right">Skor</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Tarih</th>
                <th className="px-4 py-3 font-medium text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  data-testid={`hot-lead-row-${lead.id}`}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-500 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{lead.name}</p>
                        <p className="text-xs text-slate-500 truncate font-mono">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {lead.company ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Building2 size={12} className="text-slate-500" aria-hidden="true" />
                        <span className="truncate">{lead.company}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md border font-bold text-xs ${TIER_BADGE_CLASSES[lead.tier]}`}
                      title={lead.tierLabel}
                    >
                      {lead.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-secondary font-medium">
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono hidden md:table-cell whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleString('tr-TR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void handleNotify(lead)}
                        disabled={notifying === lead.id}
                        aria-label={`Telegram'a bildir: ${lead.name}`}
                        title="Telegram'a bildir"
                        className="p-1.5 rounded-md text-slate-400 hover:text-secondary hover:bg-secondary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"
                      >
                        <Bell
                          size={14}
                          className={notifying === lead.id ? 'animate-pulse' : ''}
                          aria-hidden="true"
                        />
                      </button>
                      <a
                        href={`mailto:${lead.email}`}
                        aria-label={`Email gönder: ${lead.email}`}
                        title="Email gönder"
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
