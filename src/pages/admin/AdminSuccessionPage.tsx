import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '../../lib/admin-fetch';

type SuccessionStatus = 'ASSESSMENT' | 'PLANNING' | 'EXECUTION' | 'COMPLETED';
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';

interface SuccessionMilestone {
  id: string;
  name: string;
  expectedDate?: string;
  actualDate?: string;
  status: MilestoneStatus;
}

interface SuccessionKPI {
  id: string;
  metric: string;
  baselineValue: string;
  targetValue: string;
  currentValue?: string;
}

interface SuccessionRoadmap {
  id: string;
  clientId: string;
  clientName: string;
  generationFrom: number;
  generationTo: number;
  estimatedYear?: number;
  status: SuccessionStatus;
  milestones: SuccessionMilestone[];
  kpis: SuccessionKPI[];
}

const STATUS_COLORS: Record<SuccessionStatus, string> = {
  ASSESSMENT: '#6366f1',
  PLANNING: '#f59e0b',
  EXECUTION: '#3b82f6',
  COMPLETED: '#22c55e',
};

const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Devam ediyor',
  COMPLETED: 'Tamamlandı',
  DELAYED: 'Gecikti',
};

export const AdminSuccessionPage: React.FC = () => {
  const { data: roadmaps = [], isLoading } = useQuery<SuccessionRoadmap[]>({
    queryKey: ['succession-roadmaps'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/succession-roadmaps');
      if (!res.ok) throw new Error('Failed to fetch succession roadmaps');
      const json = (await res.json()) as { data: SuccessionRoadmap[] };
      return json.data;
    },
  });

  const [selected, setSelected] = useState<SuccessionRoadmap | null>(null);

  if (isLoading)
    return (
      <div role="status" aria-live="polite">
        Yükleniyor…
      </div>
    );

  return (
    <main className="p-fib-6">
      <h1 className="text-golden-lg font-bold mb-fib-7">Veraset Planı Yönetimi</h1>
      <p className="text-sm opacity-60 mb-fib-8">
        Aile şirketi kuşak geçişi — Süreç yönetimi, KPI takibi, milestone izleme
      </p>

      <div className="grid grid-cols-1 gap-fib-6 mb-fib-8">
        {roadmaps.map((roadmap) => (
          <article
            key={roadmap.id}
            aria-label={`${roadmap.clientName} veraset planı`}
            className="rounded-lg bg-surface-700 p-fib-6"
          >
            <div className="flex items-center justify-between mb-fib-5">
              <h2 className="font-semibold">{roadmap.clientName}</h2>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: STATUS_COLORS[roadmap.status] }}
              >
                {roadmap.status}
              </span>
            </div>
            <p className="text-sm opacity-70 mb-fib-5">
              {roadmap.generationFrom}. Kuşak → {roadmap.generationTo}. Kuşak
              {roadmap.estimatedYear && ` (Hedef: ${roadmap.estimatedYear})`}
            </p>
            <button
              type="button"
              className="text-sm underline text-blue-400"
              onClick={() => setSelected(roadmap)}
            >
              Detayları Gör
            </button>
          </article>
        ))}
      </div>

      {selected && (
        <div
          role="region"
          aria-label={`${selected.clientName} detayları`}
          className="space-y-fib-7"
        >
          <div
            data-testid="generation-diagram"
            aria-label={`${selected.clientName} kuşak geçiş diyagramı`}
            className="flex items-center gap-4 text-xl font-bold"
          >
            <span>{selected.generationFrom}. Kuşak</span>
            <span aria-hidden="true">→</span>
            <span>{selected.generationTo}. Kuşak</span>
          </div>

          <section>
            <h3 className="font-semibold mb-fib-5">KPI Göstergeleri</h3>
            <ul aria-label="Veraset KPI Göstergeleri" className="space-y-2">
              {selected.kpis.map((kpi) => (
                <li key={kpi.id} className="flex gap-4 items-center text-sm">
                  <span className="w-48 font-medium">{kpi.metric}</span>
                  <span className="opacity-60">Başlangıç: {kpi.baselineValue}</span>
                  <span className="opacity-60">Hedef: {kpi.targetValue}</span>
                  <span className="text-green-400">Şimdi: {kpi.currentValue ?? '-'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-fib-5">Süreç Zaman Çizelgesi</h3>
            <ol aria-label="Süreç Zaman Çizelgesi" className="space-y-2">
              {selected.milestones.map((m) => (
                <li key={m.id} className="flex gap-4 items-center text-sm">
                  <span className="w-48">{m.name}</span>
                  <span className="text-xs opacity-60">
                    {m.expectedDate ?? m.actualDate ?? '-'}
                  </span>
                  <span className="text-xs">{MILESTONE_STATUS_LABELS[m.status]}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </main>
  );
};
