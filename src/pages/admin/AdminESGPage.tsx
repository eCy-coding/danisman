import React, { useState, useMemo, useEffect } from 'react';
import { SkeletonList } from '../../components/admin/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '../../lib/admin-fetch';
import { ErrorState, EmptyState } from '../../components/admin/ui';

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

  const {
    data: datapoints = [],
    isLoading: dpLoading,
    isError: dpIsError,
    error: dpError,
    refetch: refetchDatapoints,
  } = useQuery<ESGDatapoint[]>({
    queryKey: ['esg-datapoints'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/esg/datapoints');
      if (!res.ok) throw new Error('ESG veri noktaları yüklenemedi (HTTP ' + res.status + ')');
      const json = (await res.json()) as { data: ESGDatapoint[] };
      return json.data;
    },
  });

  // R7-P3.4 — search across code/topic/metric + isMandatory/isDoubleMaterial chips.
  const [search, setSearch] = useState('');
  const [onlyMandatory, setOnlyMandatory] = useState(false);
  const [onlyDoubleMaterial, setOnlyDoubleMaterial] = useState(false);
  // R7-P3.4 — load-more pagination (50 rows at a time). Resets whenever a
  // filter changes so the user doesn't see a stale paginated view.
  const [visibleCount, setVisibleCount] = useState(50);
  useEffect(() => {
    setVisibleCount(50);
  }, [activePillar, search, onlyMandatory, onlyDoubleMaterial]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return datapoints.filter((d) => {
      if (activePillar !== 'ALL' && d.pillar !== activePillar) return false;
      if (onlyMandatory && !d.isMandatory) return false;
      if (onlyDoubleMaterial && !d.isDoubleMaterial) return false;
      if (q) {
        const hay = (
          d.esrsCode +
          ' ' +
          d.category +
          ' ' +
          d.topic +
          ' ' +
          d.metricName
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [datapoints, activePillar, search, onlyMandatory, onlyDoubleMaterial]);

  const doubleMaterial = filtered.filter((d) => d.isDoubleMaterial);
  const mandatory = filtered.filter((d) => d.isMandatory);

  if (dpLoading) {
    // R8-P3 — canonical skeleton loader replaces "Yükleniyor…" text. Reserves
    // the layout so the user's eye isn't jolted when 61 rows pop in.
    return (
      <main className="p-fib-6">
        <SkeletonList count={10} withAvatar={false} />
      </main>
    );
  }

  if (dpIsError) {
    return (
      <main className="p-fib-6">
        <ErrorState
          title="ESG veri kümesi yüklenemedi"
          description={dpError instanceof Error ? dpError.message : undefined}
          onRetry={() => void refetchDatapoints()}
        />
      </main>
    );
  }

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

      {/* R7-P3.4 — search + filter chips */}
      <div className="flex flex-wrap items-center gap-fib-6 mb-fib-7">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ESRS kodu, konu veya metrik ara…"
          aria-label="ESRS veri noktası ara"
          className="flex-1 min-w-[260px] bg-white/5 border border-white/10 rounded-lg px-fib-5 py-fib-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="button"
          aria-pressed={onlyMandatory}
          onClick={() => setOnlyMandatory((v) => !v)}
          className={`px-fib-5 py-fib-3 text-xs rounded-lg border transition ${
            onlyMandatory
              ? 'bg-blue-500/30 border-blue-400 text-blue-100'
              : 'border-white/10 text-slate-400 hover:bg-white/5'
          }`}
        >
          Sadece Zorunlu
        </button>
        <button
          type="button"
          aria-pressed={onlyDoubleMaterial}
          onClick={() => setOnlyDoubleMaterial((v) => !v)}
          className={`px-fib-5 py-fib-3 text-xs rounded-lg border transition ${
            onlyDoubleMaterial
              ? 'bg-purple-500/30 border-purple-400 text-purple-100'
              : 'border-white/10 text-slate-400 hover:bg-white/5'
          }`}
        >
          Sadece Çift Materyel
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-fib-7 mb-fib-7 text-sm">
        <span>{filtered.length} veri noktası</span>
        <span className="opacity-60">{doubleMaterial.length} çift materyel</span>
        <span className="opacity-60">{mandatory.length} zorunlu</span>
      </div>

      {/* R7-P3.4: filtered list with "load more" pagination (50 rows page) */}
      {datapoints.length === 0 ? (
        <EmptyState
          title="ESG veri kümesi henüz yüklenmedi"
          description="ESRS veri noktası kataloğu henüz seed edilmemiş."
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-60 py-fib-6">Filtreyle eşleşen veri noktası yok.</p>
      ) : (
        <ul aria-label="ESRS Veri Noktaları" className="space-y-1">
          {filtered.slice(0, visibleCount).map((dp) => (
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
      )}
      {filtered.length > visibleCount && (
        <div className="mt-fib-6 flex items-center justify-between text-sm">
          <span className="opacity-50">
            {filtered.length - visibleCount} satır daha gösterilebilir
          </span>
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 50)}
            className="px-fib-5 py-fib-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs border border-white/10"
          >
            Daha fazla yükle
          </button>
        </div>
      )}
    </main>
  );
};
