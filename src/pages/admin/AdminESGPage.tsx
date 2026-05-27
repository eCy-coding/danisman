import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

type ESGPillar = 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';

interface ESGDatapoint {
  id: string;
  esrsCode: string;
  pillar: ESGPillar;
  category: string;
  topic: string;
  metricName: string;
  unit?: string;
  isDoubleMaterial: boolean;
  isMandatory: boolean;
}

const PILLAR_LABELS: Record<ESGPillar | 'ALL', string> = {
  ALL: 'Tümü',
  ENVIRONMENTAL: 'Çevre (E)',
  SOCIAL: 'Sosyal (S)',
  GOVERNANCE: 'Yönetişim (G)',
};

const PILLAR_COLORS: Record<ESGPillar, string> = {
  ENVIRONMENTAL: '#22c55e',
  SOCIAL: '#3b82f6',
  GOVERNANCE: '#a855f7',
};

export const AdminESGPage: React.FC = () => {
  const [activePillar, setActivePillar] = useState<ESGPillar | 'ALL'>('ALL');

  const { data: datapoints = [], isLoading: dpLoading } = useQuery<ESGDatapoint[]>({
    queryKey: ['esg-datapoints'],
    queryFn: async () => {
      const res = await fetch('/api/admin/esg/datapoints');
      if (!res.ok) throw new Error('Failed to fetch ESG datapoints');
      const json = (await res.json()) as { data: ESGDatapoint[] };
      return json.data;
    },
  });

  const filtered = useMemo(
    () =>
      activePillar === 'ALL' ? datapoints : datapoints.filter((d) => d.pillar === activePillar),
    [datapoints, activePillar],
  );

  const doubleMaterial = filtered.filter((d) => d.isDoubleMaterial);
  const mandatory = filtered.filter((d) => d.isMandatory);

  if (dpLoading)
    return (
      <div role="status" aria-live="polite">
        Yükleniyor…
      </div>
    );

  return (
    <main className="p-fib-6">
      <h1 className="text-golden-lg font-bold mb-fib-7">ESG ESRS Taxonomy Explorer</h1>
      <p className="text-sm opacity-60 mb-fib-8">
        CSRD ESRS 1000+ veri noktası — Çift materyalite matrix + taksonomik gezgin
      </p>

      {/* Pillar tabs */}
      <div role="tablist" aria-label="ESG Pillar Seçimi" className="flex gap-2 mb-fib-7">
        {(['ALL', 'ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={activePillar === p ? 'true' : 'false'}
            onClick={() => setActivePillar(p as ESGPillar | 'ALL')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activePillar === p ? 'text-white' : 'bg-surface-600 opacity-70'
            }`}
            style={
              activePillar === p && p !== 'ALL'
                ? { backgroundColor: PILLAR_COLORS[p as ESGPillar] }
                : undefined
            }
          >
            {PILLAR_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-fib-7 mb-fib-7 text-sm">
        <span>{filtered.length} veri noktası</span>
        <span className="opacity-60">{doubleMaterial.length} çift materyel</span>
        <span className="opacity-60">{mandatory.length} zorunlu</span>
      </div>

      {/* Virtual list (shows first 50 for perf) */}
      <ul aria-label="ESRS Veri Noktaları" className="space-y-1">
        {filtered.slice(0, 50).map((dp) => (
          <li
            key={dp.id}
            className="flex items-center gap-4 text-sm py-1 border-b border-surface-600"
          >
            <span className="font-mono text-xs w-20 opacity-80">{dp.esrsCode}</span>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: PILLAR_COLORS[dp.pillar] }}
              aria-label={dp.pillar}
            />
            <span className="flex-1">{dp.metricName}</span>
            {dp.unit && <span className="text-xs opacity-50">{dp.unit}</span>}
            {dp.isDoubleMaterial && (
              <span className="text-xs bg-purple-900 text-purple-300 px-1 rounded">
                Çift Materyel
              </span>
            )}
            {dp.isMandatory && (
              <span className="text-xs bg-blue-900 text-blue-300 px-1 rounded">Zorunlu</span>
            )}
          </li>
        ))}
      </ul>
      {filtered.length > 50 && (
        <p className="text-sm opacity-50 mt-2">{filtered.length - 50} daha…</p>
      )}
    </main>
  );
};
