import React from 'react';
import { ProspectStatusBadge } from './ProspectStatusBadge';
import { WaveKPICard } from './WaveKPICard';
import type { WaveRow, ProspectStatus } from '../../../types/revenue';
import { useUpdateProspectStatus } from '../../../hooks/useOutreachWaves';

interface WaveDetailViewProps {
  wave: WaveRow;
}

const STATUS_OPTIONS: ProspectStatus[] = ['SENT', 'OPENED', 'REPLIED', 'MEETING', 'DISQUALIFIED'];

const STATUS_LABELS: Record<ProspectStatus, string> = {
  SENT: 'Gönderildi',
  OPENED: 'Açıldı',
  REPLIED: 'Yanıtlandı',
  MEETING: 'Görüşme',
  DISQUALIFIED: 'Elendi',
};

function calcRate(prospects: WaveRow['prospects'], statuses: ProspectStatus[]): number {
  if (prospects.length === 0) return 0;
  return prospects.filter((p) => statuses.includes(p.status)).length / prospects.length;
}

export function WaveDetailView({ wave }: WaveDetailViewProps) {
  const updateStatus = useUpdateProspectStatus();
  const openRate = calcRate(wave.prospects, ['OPENED', 'REPLIED', 'MEETING']);
  const replyRate = calcRate(wave.prospects, ['REPLIED', 'MEETING']);
  const meetingRate = calcRate(wave.prospects, ['MEETING']);

  const target = wave.targetRevenueUsd ?? 0;
  const progressPct =
    target > 0 ? Math.min(100, Math.round((wave.realizedRevenueUsd / target) * 100)) : 0;

  return (
    <div data-testid="wave-detail-view" className="flex flex-col gap-fib-6">
      {/* KPI Cards */}
      <div className="flex gap-fib-5">
        <WaveKPICard label="Açılma Oranı" value={openRate} color="text-blue-400" />
        <WaveKPICard label="Yanıt Oranı" value={replyRate} color="text-green-400" />
        <WaveKPICard label="Görüşme Oranı" value={meetingRate} color="text-amber-400" />
      </div>

      {/* Revenue progress bar */}
      {target > 0 && (
        <div className="flex flex-col gap-fib-2">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Gerçekleşen Gelir</span>
            <span>
              ${wave.realizedRevenueUsd.toLocaleString()} / ${target.toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#374151]">
            <div
              data-testid="revenue-progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-[#3B82F6] transition-all duration-500"
            />
          </div>
        </div>
      )}

      {/* Prospect status grid */}
      <div className="flex flex-col gap-fib-3">
        <h3 className="text-sm font-medium text-[#9CA3AF]">Adaylar ({wave.prospects.length})</h3>
        <div className="grid grid-cols-1 gap-fib-3 sm:grid-cols-2">
          {wave.prospects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md bg-[#2A2B2C] px-fib-4 py-fib-3"
            >
              <span className="text-sm text-[#E5E7EB]">{p.companyName}</span>
              <div className="flex items-center gap-2">
                <ProspectStatusBadge status={p.status} />
                {/* R8-P1 — inline status dropdown. Native <select> for native
                    keyboard a11y + small payload. Disabled while a mutation
                    flies so optimistic UI stays consistent. */}
                <label htmlFor={`prospect-status-${p.id}`} className="sr-only">
                  Durum güncelle: {p.companyName}
                </label>
                <select
                  id={`prospect-status-${p.id}`}
                  value={p.status}
                  disabled={updateStatus.isPending}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: p.id,
                      status: e.target.value as ProspectStatus,
                    })
                  }
                  className="bg-[#1E1F20] border border-white/10 rounded px-2 py-1 text-xs text-[#E5E7EB] focus:outline-none focus:border-amber-500/50 disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
