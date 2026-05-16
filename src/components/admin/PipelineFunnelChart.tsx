/**
 * PipelineFunnelChart — CRM funnel görselleştirme (admin)
 *
 * - `/api/crm/pipeline-stats` → 3 step: Contact → Newsletter → Booking
 * - Recharts BarChart (gradient + custom tooltip)
 * - Conversion rate her step arasında yüzde olarak
 * - Auto-refresh 60s
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TrendingDown, AlertCircle, Mail, Users, Calendar } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { QueryKeys } from '../../lib/query-client';

interface PipelineStats {
  contacts: { total: number; unread: number; last30: number };
  newsletter: { total: number; active: number };
  bookings: { total: number; confirmed: number; conversionRate: number };
  funnel: {
    step1_contact: number;
    step2_subscribed: number;
    step3_booked: number;
  };
}

interface ApiResponse {
  status: 'success' | 'error';
  data: PipelineStats;
}

interface FunnelStep {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

const COLORS = ['#a855f7', '#06b6d4', '#10b981'];

interface FunnelTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FunnelStep }>;
}

const FunnelTooltip: React.FC<FunnelTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 shadow-2xl">
      <p className="text-xs text-slate-400 font-mono uppercase">{item.label}</p>
      <p className="text-lg text-white font-semibold mt-0.5">
        {item.value.toLocaleString('tr-TR')}
      </p>
    </div>
  );
};

export const PipelineFunnelChart: React.FC = () => {
  // P18-FE: aynı QueryKeys root'unu PipelineWidget ile paylaşırız;
  // admin + dashboard arasında deduplication.
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: QueryKeys.analytics.pipeline,
    queryFn: () => apiClient.get<ApiResponse>('/crm/pipeline-stats').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-white/5 bg-white/5 p-6"
        data-testid="pipeline-loading"
      >
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6" />
        <div className="h-64 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-rose-300 font-medium">Pipeline verisi yüklenemedi</p>
          <p className="text-rose-200/70 text-xs mt-1">Admin oturumu kontrol edin.</p>
        </div>
      </div>
    );
  }

  const { funnel, bookings } = data.data;

  const steps: FunnelStep[] = [
    {
      key: 'contact',
      label: 'Contact (30g)',
      value: funnel.step1_contact,
      color: COLORS[0]!,
      icon: Mail,
    },
    {
      key: 'subscribed',
      label: 'Subscribed',
      value: funnel.step2_subscribed,
      color: COLORS[1]!,
      icon: Users,
    },
    {
      key: 'booked',
      label: 'Booked',
      value: funnel.step3_booked,
      color: COLORS[2]!,
      icon: Calendar,
    },
  ];

  const conv1 =
    funnel.step1_contact > 0 ? (funnel.step2_subscribed / funnel.step1_contact) * 100 : 0;
  const conv2 =
    funnel.step2_subscribed > 0 ? (funnel.step3_booked / funnel.step2_subscribed) * 100 : 0;
  const overallConv =
    funnel.step1_contact > 0 ? (funnel.step3_booked / funnel.step1_contact) * 100 : 0;

  return (
    <div
      className="rounded-xl border border-white/5 bg-linear-to-br from-slate-900/50 to-slate-800/30 p-6"
      data-testid="pipeline-funnel"
    >
      <header className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-medium text-white">Conversion Funnel</h3>
          <p className="text-xs text-slate-500 mt-0.5">Son 30 gün</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Toplam Conv.</p>
          <p className="text-2xl font-mono text-secondary font-semibold">
            {overallConv.toFixed(1)}%
          </p>
        </div>
      </header>

      <div className="h-56 mb-4" data-testid="pipeline-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={steps} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<FunnelTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {steps.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion arrows */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="rounded-lg border border-white/5 bg-white/3 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={12} style={{ color: step.color }} aria-hidden="true" />
                <span className="text-slate-400 truncate">{step.label}</span>
              </div>
              <p className="text-white font-mono text-lg font-semibold">
                {step.value.toLocaleString('tr-TR')}
              </p>
              {idx > 0 && (
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingDown size={9} aria-hidden="true" />
                  {idx === 1 ? `${conv1.toFixed(1)}%` : `${conv2.toFixed(1)}%`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Booking conversion meta */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs">
        <span className="text-slate-500">Booking Confirmation Rate:</span>
        <span className="text-white font-mono">
          {(bookings.conversionRate * 100).toFixed(1)}% ({bookings.confirmed}/{bookings.total})
        </span>
      </div>
    </div>
  );
};
