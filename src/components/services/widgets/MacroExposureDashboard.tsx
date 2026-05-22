/**
 * P49 S13 — Macro Risk Exposure Dashboard.
 *
 * 4 slider scenario: FX shock + Interest rate + Inflation + Sector risk.
 * Simplified P&L impact on hypothetical company (₺100M revenue baseline).
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

export const MacroExposureDashboard: React.FC = () => {
  const [fxShock, setFxShock] = useState(0); // % USD up
  const [rateUp, setRateUp] = useState(0); // basis points
  const [inflation, setInflation] = useState(30); // %
  const [revenueGrowth, setRevenueGrowth] = useState(15); // %

  // Hypothetical company: ₺100M revenue, 70% opex, 20% import-dependent COGS, 25% debt
  const baseRev = 100;
  const adjRev = baseRev * (1 + revenueGrowth / 100);
  const adjOpexFx = adjRev * 0.7 * (1 + (fxShock / 100) * 0.2); // 20% import-dependent
  const adjOpexInf = adjOpexFx * (1 + ((inflation - 20) / 100) * 0.5); // delta beyond 20%
  const adjFinCost = baseRev * 0.25 * (1 + rateUp / 5000); // debt service
  const adjProfit = adjRev - adjOpexInf - adjFinCost;
  const baseProfit = baseRev - baseRev * 0.7 - baseRev * 0.05;
  const profitDelta = ((adjProfit - baseProfit) / baseProfit) * 100;

  const verdict = useMemo(() => {
    if (profitDelta < -25) return { tone: 'critical', text: 'Yüksek risk — Hedge stratejisi acil' };
    if (profitDelta < -10)
      return { tone: 'warning', text: 'Orta risk — Senaryo planlama önerilir' };
    return { tone: 'ok', text: 'Düşük risk — Mevcut yapı sağlıklı' };
  }, [profitDelta]);

  return (
    <section
      className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent"
      aria-labelledby="macro-heading"
      data-testid="macro-exposure-dashboard"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Makro Stres Test
          </div>
          <h2
            id="macro-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-3"
          >
            P&L Exposure Simülasyonu
          </h2>
          <p className="text-slate-400 max-w-2xl">
            4 makro değişkeni hareket ettirin — örnek bir şirketin (₺100M ciro, %20 ithal bağımlı,
            %25 borç) kâr marjını nasıl etkilediğini görün.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                USD/TRY Yükseliş (%): <span className="text-secondary font-serif">{fxShock}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fxShock}
                onChange={(e) => setFxShock(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Faiz Artışı (bps): <span className="text-secondary font-serif">+{rateUp}</span>
              </label>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={rateUp}
                onChange={(e) => setRateUp(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Yıllık Enflasyon: <span className="text-secondary font-serif">%{inflation}</span>
              </label>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={inflation}
                onChange={(e) => setInflation(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Beklenen Gelir Büyümesi:{' '}
                <span className="text-secondary font-serif">%{revenueGrowth}</span>
              </label>
              <input
                type="range"
                min="-30"
                max="60"
                step="5"
                value={revenueGrowth}
                onChange={(e) => setRevenueGrowth(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
          </div>
          <div
            className={`rounded-2xl p-6 md:p-8 border ${verdict.tone === 'critical' ? 'bg-red-500/10 border-red-500/30' : verdict.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}
          >
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">
              Senaryo Sonucu
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-sm">Adj. Gelir</span>
                <span className="text-xl font-serif font-bold text-white">
                  ₺{adjRev.toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-sm">Adj. Operasyonel Maliyet</span>
                <span className="text-xl font-serif font-bold text-white">
                  ₺{adjOpexInf.toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-sm">Adj. Finansal Maliyet</span>
                <span className="text-xl font-serif font-bold text-white">
                  ₺{adjFinCost.toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                <span className="text-slate-200 text-sm font-semibold">Adj. Kâr</span>
                <span className="text-2xl font-serif font-bold text-white">
                  ₺{adjProfit.toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {profitDelta < 0 ? (
                  <TrendingDown size={16} className="text-red-400" />
                ) : (
                  <TrendingUp size={16} className="text-emerald-400" />
                )}
                <span className={profitDelta < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  Kâr değişimi: {profitDelta >= 0 ? '+' : ''}
                  {profitDelta.toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-slate-200 text-sm mb-4 font-semibold">{verdict.text}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              Hedge Strateji Görüşmesi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
