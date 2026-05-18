/**
 * P49 S4 — Operational Excellence ROI Calculator.
 *
 * Lean Six Sigma typical savings: %5-15 opex reduction over 12 months.
 * User inputs revenue + cost% + maturity → est. annual savings.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator } from 'lucide-react';

const formatTRY = (n: number) => {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(0)}k`;
  return `₺${n}`;
};

export const OperationsROICalculator: React.FC = () => {
  const [revenue, setRevenue] = useState(50_000_000); // ₺50M default
  const [costPct, setCostPct] = useState(70); // %70 default
  const [maturity, setMaturity] = useState(2); // 1-5

  // Lean Six Sigma typical savings: matür değil = %12 potential, çok matür = %4
  const savingsPct = useMemo(() => Math.max(2, 16 - maturity * 2.5), [maturity]);
  const annualSavings = useMemo(() => (revenue * costPct / 100) * (savingsPct / 100), [revenue, costPct, savingsPct]);
  const paybackMonths = useMemo(() => {
    // Tipik engagement ₺500k → payback ay = engagement / monthly savings
    const monthly = annualSavings / 12;
    if (monthly <= 0) return 0;
    return Math.ceil(500_000 / monthly);
  }, [annualSavings]);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="ops-roi-heading" data-testid="operations-roi-calculator">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3 flex items-center gap-2"><Calculator size={14} /> İnteraktif Hesaplayıcı</div>
          <h2 id="ops-roi-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Lean ROI Tahminleyici</h2>
          <p className="text-slate-400 max-w-2xl">Şirketinizin değerlerini girin; tipik Lean Six Sigma engagement'ın 12 aylık tahmini tasarrufunu görün.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div>
              <label htmlFor="ops-revenue" className="block text-sm font-medium text-slate-200 mb-2">Yıllık Gelir (₺)</label>
              <input id="ops-revenue" type="range" min="5000000" max="500000000" step="5000000" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} className="w-full accent-secondary" />
              <p className="mt-2 text-2xl font-serif font-bold text-white">{formatTRY(revenue)}</p>
            </div>
            <div>
              <label htmlFor="ops-cost" className="block text-sm font-medium text-slate-200 mb-2">Operasyonel Maliyet Oranı (%)</label>
              <input id="ops-cost" type="range" min="40" max="90" step="5" value={costPct} onChange={(e) => setCostPct(Number(e.target.value))} className="w-full accent-secondary" />
              <p className="mt-2 text-2xl font-serif font-bold text-white">%{costPct}</p>
            </div>
            <div>
              <label htmlFor="ops-maturity" className="block text-sm font-medium text-slate-200 mb-2">Mevcut Lean Olgunluk (1-5)</label>
              <input id="ops-maturity" type="range" min="1" max="5" step="1" value={maturity} onChange={(e) => setMaturity(Number(e.target.value))} className="w-full accent-secondary" />
              <p className="mt-2 text-sm text-slate-400">{['Hiç yok', 'Başlangıç', 'Gelişiyor', 'Olgun', 'Optimize'][maturity - 1]}</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Tahmini 12 Aylık Sonuç</div>
              <div className="space-y-5">
                <div>
                  <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-1">{formatTRY(annualSavings)}</div>
                  <p className="text-slate-300 text-sm">Yıllık tasarruf potansiyeli (%{savingsPct.toFixed(1)} OPEX reduction)</p>
                </div>
                <div>
                  <div className="text-2xl font-serif font-bold text-emerald-400 mb-1">{paybackMonths} ay</div>
                  <p className="text-slate-300 text-sm">Engagement ödeme süresi (tipik ₺500k engagement)</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-6 italic">* Bu hesaplama indikatif. Gerçek sonuç sektör, başlangıç olgunluk + uygulama disiplinine bağlıdır.</p>
            </div>
            <Link to="/contact" className="inline-flex items-center gap-2 mt-6 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">
              Detaylı Audit Görüşmesi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
