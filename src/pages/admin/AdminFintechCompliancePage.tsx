import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '../../lib/admin-fetch';
import { ErrorState, EmptyState } from '../../components/admin/ui';

type Regulator = 'SPK' | 'MASAK' | 'KVKK' | 'TCMB' | 'BDDK';
type ComplianceItemStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

interface ComplianceItem {
  id: string;
  clientId: string;
  regulator: Regulator;
  category: string;
  status: ComplianceItemStatus;
  riskScore: number;
  dueDate?: string;
  notes?: string;
}

const ALL_REGULATORS: Regulator[] = ['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK'];

const REGULATOR_DESCRIPTIONS: Record<Regulator, string> = {
  SPK: 'Sermaye Piyasası Kurulu — CASP lisans, yatırım araçları',
  MASAK: 'Mali Suçları Araştırma Kurulu — AML, STR bildirim',
  KVKK: 'Kişisel Verileri Koruma Kurumu — VERBİS, açık rıza',
  TCMB: 'Türkiye Cumhuriyet Merkez Bankası — ödeme hizmetleri',
  BDDK: 'Bankacılık Düzenleme ve Denetleme Kurumu — bankacılık lisansı',
};

const RISK_COLOR = (score: number): string => {
  if (score >= 8) return '#ef4444';
  if (score >= 5) return '#f59e0b';
  return '#22c55e';
};

export const AdminFintechCompliancePage: React.FC = () => {
  const [regulatorFilter, setRegulatorFilter] = useState<Regulator | 'ALL'>('ALL');

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ComplianceItem[]>({
    queryKey: ['fintech-compliance'],
    queryFn: async () => {
      const res = await adminFetch('/api/admin/fintech/compliance');
      if (!res.ok) throw new Error('Uyumluluk kalemleri yüklenemedi (HTTP ' + res.status + ')');
      const json = (await res.json()) as { data: ComplianceItem[] };
      return json.data;
    },
  });

  const filtered = useMemo(
    () =>
      regulatorFilter === 'ALL' ? items : items.filter((i) => i.regulator === regulatorFilter),
    [items, regulatorFilter],
  );

  const summaries = ALL_REGULATORS.map((reg) => {
    const regItems = items.filter((i) => i.regulator === reg);
    return {
      regulator: reg,
      totalItems: regItems.length,
      approvedItems: regItems.filter((i) => i.status === 'APPROVED').length,
      avgRiskScore:
        regItems.length > 0
          ? Math.round(regItems.reduce((s, i) => s + i.riskScore, 0) / regItems.length)
          : 0,
    };
  });

  const today = new Date();

  if (isLoading)
    return (
      <div role="status" aria-live="polite">
        Yükleniyor…
      </div>
    );

  if (isError)
    return (
      <main className="p-fib-6">
        <ErrorState
          title="Uyumluluk verileri yüklenemedi"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </main>
    );

  return (
    <main className="p-fib-6">
      <h1 className="text-golden-lg font-bold mb-fib-7">Fintech Uyumluluk Panosu</h1>
      <p className="text-sm opacity-60 mb-fib-8">
        SPK + MASAK + KVKK + TCMB + BDDK — 5 regülatör, anlık durum, risk skoru, son tarih
      </p>

      {/* Trifecta Compass summary */}
      <div
        data-testid="trifecta-compass"
        aria-label="SPK+MASAK+KVKK Trifecta Kompass"
        className="grid grid-cols-5 gap-fib-5 mb-fib-8"
      >
        {summaries.map((s) => (
          <article
            key={s.regulator}
            className="rounded-lg bg-surface-700 p-fib-5 text-center"
            aria-label={`${s.regulator} uyumluluk kartı`}
          >
            <h3 className="font-bold text-sm mb-1">{s.regulator}</h3>
            <p className="text-xs opacity-60 mb-2">{REGULATOR_DESCRIPTIONS[s.regulator]}</p>
            <p className="text-lg font-bold">
              {s.approvedItems}/{s.totalItems}
            </p>
            <p className="text-xs" style={{ color: RISK_COLOR(s.avgRiskScore) }}>
              Risk: {s.avgRiskScore}/10
            </p>
          </article>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-fib-6">
        <label htmlFor="reg-filter" className="text-sm mr-2">
          Regülatör:
        </label>
        <select
          id="reg-filter"
          value={regulatorFilter}
          onChange={(e) => setRegulatorFilter(e.target.value as Regulator | 'ALL')}
          className="bg-surface-700 rounded px-2 py-1 text-sm"
          aria-label="Regülatör filtresi"
        >
          <option value="ALL">Tümü</option>
          {ALL_REGULATORS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Risk Heatmap */}
      {items.length === 0 ? (
        <EmptyState
          title="Henüz uyumluluk kalemi yok"
          description="SPK/MASAK/KVKK/TCMB/BDDK kalemleri eklendiğinde burada listelenecek."
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-60 py-fib-6">Bu regülatör için kalem yok.</p>
      ) : (
        <div
          data-testid="risk-heatmap"
          aria-label="Risk Isı Haritası"
          className="space-y-2 mb-fib-8"
        >
          {filtered.map((item) => {
            const daysLeft = item.dueDate
              ? Math.ceil((new Date(item.dueDate).getTime() - today.getTime()) / 86400000)
              : null;
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded"
                style={{ borderLeft: `4px solid ${RISK_COLOR(item.riskScore)}` }}
              >
                <span
                  className="w-16 text-xs font-bold"
                  style={{ color: RISK_COLOR(item.riskScore) }}
                >
                  {item.regulator}
                </span>
                <span className="flex-1 text-sm">{item.category}</span>
                <span className="text-xs opacity-60">{item.status}</span>
                <span
                  className="text-xs font-mono w-8 text-right"
                  style={{ color: RISK_COLOR(item.riskScore) }}
                  aria-label={`Risk skoru: ${item.riskScore}`}
                >
                  {item.riskScore}
                </span>
                {daysLeft !== null && (
                  <span
                    className="text-xs w-20 text-right"
                    style={{ color: daysLeft < 30 ? '#ef4444' : '#f59e0b' }}
                    aria-label={`Son tarih: ${daysLeft} gün`}
                  >
                    {daysLeft}g kaldı
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deadline countdown */}
      <section>
        <h2 className="font-semibold mb-fib-5">Yaklaşan Son Tarihler</h2>
        <ul aria-label="Son Tarih Sayacı" className="space-y-1">
          {filtered
            .filter((i) => i.dueDate && i.status !== 'APPROVED')
            .map((i) => ({
              ...i,
              daysLeft: Math.ceil((new Date(i.dueDate!).getTime() - today.getTime()) / 86400000),
            }))
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5)
            .map((item) => (
              <li key={item.id} className="flex gap-4 text-sm">
                <span className="font-bold w-16">{item.regulator}</span>
                <span className="flex-1">{item.category}</span>
                <span style={{ color: item.daysLeft < 30 ? '#ef4444' : '#f59e0b' }}>
                  {item.daysLeft} gün
                </span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
};
