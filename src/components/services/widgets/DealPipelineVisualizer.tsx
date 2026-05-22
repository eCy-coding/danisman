/**
 * P49 S2 — M&A Deal Pipeline Visualizer (mergers-acquisitions).
 *
 * 6-stage funnel: Strategic Fit → Valuation → Due Diligence → Negotiation →
 * Close → PMI. User "Şu an hangi aşamadasınız?" seçer → matching engagement.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  duration: string;
  deliverables: string[];
  risks: string[];
  engagement: 'session' | 'quarterly' | 'annual';
}

const STAGES: Stage[] = [
  {
    id: 1,
    name: 'Strategic Fit',
    duration: '1-2 hafta',
    deliverables: ['Stratejik uyum raporu', 'Go/no-go önerisi', 'Sinerji haritası'],
    risks: ['Tezleri test edilmemiş varsayım', 'Kültürel mismatch'],
    engagement: 'session',
  },
  {
    id: 2,
    name: 'Valuation',
    duration: '2-3 hafta',
    deliverables: ['DCF modeli', 'Comparable transaction analizi', 'Senaryo (base/bull/bear)'],
    risks: ['Beklenti-fiyat uçurumu', 'Multiple bias'],
    engagement: 'quarterly',
  },
  {
    id: 3,
    name: 'Due Diligence',
    duration: '4-6 hafta',
    deliverables: ['Mali DD raporu', 'Hukuki DD', 'Operasyonel DD', 'Risk register'],
    risks: ['Gizlenen pasif', 'Vergi/dava exposure'],
    engagement: 'quarterly',
  },
  {
    id: 4,
    name: 'Negotiation',
    duration: '2-4 hafta',
    deliverables: ['BATNA dokümanı', 'Term sheet review', 'Müzakere strateji notu'],
    risks: ['Walk-away threshold belirsizliği'],
    engagement: 'quarterly',
  },
  {
    id: 5,
    name: 'Close',
    duration: '1-2 ay',
    deliverables: ['SPA review', 'Closing checklist', 'Regulatory filings'],
    risks: ['Last-minute due diligence sürprizleri'],
    engagement: 'quarterly',
  },
  {
    id: 6,
    name: 'PMI',
    duration: '3-6 ay',
    deliverables: ['100-günlük plan', 'Org entegrasyon', 'Sinerji dashboard'],
    risks: ['Kültür çatışması', 'Talent kaybı'],
    engagement: 'annual',
  },
];

const TIER_NAMES = {
  session: 'Strateji Oturumu',
  quarterly: 'Çeyreklik Engagement',
  annual: 'Yıllık Partnerlik',
};

export const DealPipelineVisualizer: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const selectedStage = selected ? STAGES.find((s) => s.id === selected) : null;

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="deal-pipeline-heading"
      data-testid="deal-pipeline-visualizer"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            İnteraktif Pipeline
          </div>
          <h2
            id="deal-pipeline-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            M&A Deal Pipeline
          </h2>
          <p className="text-slate-400 max-w-2xl">
            Şu an hangi aşamadasınız? Stage kartına tıklayın, deliverables + riskler + önerilen
            engagement görünür.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {STAGES.map((stage) => {
            const isSelected = selected === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : stage.id)}
                aria-pressed={isSelected}
                className={`text-left p-5 rounded-2xl border transition-all min-h-[120px] ${
                  isSelected
                    ? 'bg-secondary/10 border-secondary/50 shadow-lg shadow-secondary/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-secondary text-neutral' : 'bg-white/10 text-secondary'}`}
                  >
                    {stage.id}
                  </span>
                  <h3 className="text-base font-bold text-white">{stage.name}</h3>
                </div>
                <p className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                  <Clock size={11} /> {stage.duration}
                </p>
              </button>
            );
          })}
        </div>
        {selectedStage && (
          <div
            className="p-6 md:p-8 bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
            role="status"
            aria-live="polite"
          >
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
                  Çıktılar
                </div>
                <ul className="space-y-2">
                  {selectedStage.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
                  Kritik Riskler
                </div>
                <ul className="space-y-2">
                  {selectedStage.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200 text-sm">
                      <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-secondary mb-1">
                    Önerilen Engagement
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white">
                    {TIER_NAMES[selectedStage.engagement]}
                  </h3>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
                >
                  Discovery Call <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
