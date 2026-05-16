/**
 * PipelineWidget — dashboard küçük funnel özet kartı
 * Veri: GET /api/crm/pipeline-stats (60s)
 * 3 adım mini bar + genel conversion rate
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { QueryKeys } from '../../../lib/query-client';

interface PipelineStats {
  funnel: {
    step1_contact: number;
    step2_subscribed: number;
    step3_booked: number;
  };
  bookings: { conversionRate: number };
}

interface ApiResponse {
  status: string;
  data: PipelineStats;
}

const STEP_COLORS = ['bg-violet-500', 'bg-cyan-500', 'bg-emerald-500'];

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export const PipelineWidget: React.FC = () => {
  // P18-FE: query-key root'u `QueryKeys.analytics.pipeline` üzerinden tek
  // kaynağa bağlandı; PipelineFunnelChart admin tarafıyla cache paylaşır.
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: QueryKeys.analytics.pipeline,
    queryFn: () => apiClient.get<ApiResponse>('/crm/pipeline-stats').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const funnel = data?.data.funnel;
  const convRate = data?.data.bookings.conversionRate ?? 0;

  const steps: FunnelStep[] = funnel
    ? [
        { label: 'Contact', value: funnel.step1_contact, color: STEP_COLORS[0]! },
        { label: 'Subscribe', value: funnel.step2_subscribed, color: STEP_COLORS[1]! },
        { label: 'Booked', value: funnel.step3_booked, color: STEP_COLORS[2]! },
      ]
    : [];

  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div
      className="rounded-xl border border-white/10 bg-linear-to-br from-violet-950/20 to-transparent p-5 h-full flex flex-col"
      data-testid="pipeline-widget"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">Pipeline</p>
          <p className="text-2xl font-mono font-semibold text-white mt-1">
            {isLoading ? '…' : `${(convRate * 100).toFixed(1)}%`}
          </p>
        </div>
        <TrendingUp className="w-6 h-6 text-violet-400 shrink-0" aria-hidden="true" />
      </div>

      <div className="space-y-2.5 flex-1">
        {isLoading
          ? [1, 2, 3].map((i) => <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />)
          : steps.map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{step.label}</span>
                  <span className="font-mono">{step.value.toLocaleString('tr-TR')}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.color}`}
                    style={{ width: `${Math.max((step.value / max) * 100, 2)}%` }}
                    role="progressbar"
                    aria-valuenow={step.value}
                    aria-valuemax={max}
                    aria-label={step.label}
                  />
                </div>
              </div>
            ))}
      </div>

      <Link
        to="/admin/crm"
        className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-secondary transition-colors"
      >
        <span>Pipeline detayı</span>
        <ArrowRight size={11} aria-hidden="true" />
      </Link>
    </div>
  );
};
