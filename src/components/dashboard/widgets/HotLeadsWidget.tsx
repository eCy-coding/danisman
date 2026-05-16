/**
 * HotLeadsWidget — dashboard küçük hot lead özet kartı
 * Veri: GET /api/crm/leads/hot (60s refresh)
 * Top 3 lead + "Tümünü gör → /admin/crm" link
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { QueryKeys } from '../../../lib/query-client';

interface HotLead {
  id: string;
  email: string;
  name: string;
  score: number;
  tier: 'A' | 'B' | 'C';
  createdAt: string;
}

interface ApiResponse {
  status: string;
  data: { items: HotLead[]; total: number };
}

const TIER_CLASSES: Record<HotLead['tier'], string> = {
  A: 'text-rose-400',
  B: 'text-amber-400',
  C: 'text-slate-400',
};

export const HotLeadsWidget: React.FC = () => {
  // P18-FE: query-key tek kaynaktan; HotLeadsTable admin sayfasıyla
  // cache deduplication sağlar (aynı root, tek fetch).
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: QueryKeys.analytics.hotLeads,
    queryFn: () => apiClient.get<ApiResponse>('/crm/leads/hot').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const leads = useMemo<HotLead[]>(() => data?.data?.items?.slice(0, 3) ?? [], [data]);
  const total = data?.data.total ?? 0;

  return (
    <div
      className="rounded-xl border border-white/10 bg-linear-to-br from-rose-950/20 to-transparent p-5 h-full flex flex-col"
      data-testid="hot-leads-widget"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Sıcak Leadler
          </p>
          <p className="text-2xl font-mono font-semibold text-white mt-1">
            {isLoading ? '…' : total}
          </p>
        </div>
        <Flame className="w-6 h-6 text-rose-400 shrink-0" aria-hidden="true" />
      </div>

      <ul className="space-y-2 flex-1">
        {isLoading ? (
          [1, 2, 3].map((i) => <li key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)
        ) : leads.length === 0 ? (
          <li className="text-xs text-slate-500 py-4 text-center">Tier A lead yok</li>
        ) : (
          leads.map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-xs">
              <Mail size={12} className="text-slate-500 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-slate-300 truncate">{l.name}</span>
              <span className={`font-mono font-medium ${TIER_CLASSES[l.tier]}`}>{l.score}</span>
            </li>
          ))
        )}
      </ul>

      <Link
        to="/admin/crm"
        className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-secondary transition-colors"
      >
        <span>Tümünü gör</span>
        <ArrowRight size={11} aria-hidden="true" />
      </Link>
    </div>
  );
};
