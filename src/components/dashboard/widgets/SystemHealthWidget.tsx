/**
 * SystemHealthWidget — dashboard için kompakt sistem sağlığı kartı
 * Veri: GET /api/status (30s auto-refresh)
 * "Tüm sistemler çalışıyor" yeşil / uyarı sarı / arıza kırmızı
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { QueryKeys } from '../../../lib/query-client';

interface StatusComponent {
  name: string;
  status: string;
}
interface StatusResponse {
  status: { indicator: string; description: string };
  components: StatusComponent[];
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  operational: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  partial_outage: { color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertTriangle },
  major_outage: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle },
  critical: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle },
};

function cfg(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.operational!;
}

export const SystemHealthWidget: React.FC = () => {
  // P18-FE: 30 s refresh policy korunur; key tek kaynak.
  const { data, isLoading } = useQuery<StatusResponse>({
    queryKey: QueryKeys.status.public,
    queryFn: () => apiClient.get<StatusResponse>('/status').then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const overallStatus = data?.status.indicator ?? 'operational';
  const { color, bg, icon: Icon } = cfg(overallStatus);

  return (
    <div
      className={`rounded-xl border border-white/10 ${bg} p-5 h-full flex flex-col`}
      data-testid="system-health-widget"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Sistem Sağlığı
          </p>
          <p className={`text-lg font-semibold mt-1 ${color}`}>
            {isLoading ? '…' : (data?.status.description ?? 'Bilinmiyor')}
          </p>
        </div>
        <Icon className={`w-6 h-6 ${color} shrink-0`} aria-hidden="true" />
      </div>

      {/* Component dots */}
      <ul className="space-y-1.5 flex-1">
        {(data?.components ?? []).map((c) => {
          const { color: cc, icon: CIcon } = cfg(c.status);
          return (
            <li key={c.name} className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{c.name}</span>
              <span className={`flex items-center gap-1 ${cc}`}>
                <CIcon size={12} aria-hidden="true" />
              </span>
            </li>
          );
        })}
        {isLoading &&
          [1, 2, 3].map((i) => <li key={i} className="h-4 bg-white/5 rounded animate-pulse" />)}
      </ul>

      <Link
        to="/status"
        className="mt-4 flex items-center gap-1 text-xs text-slate-500 hover:text-secondary transition-colors"
      >
        <ExternalLink size={11} aria-hidden="true" />
        <span>Durum sayfası</span>
      </Link>
    </div>
  );
};
