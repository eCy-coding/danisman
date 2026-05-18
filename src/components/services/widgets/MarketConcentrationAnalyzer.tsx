/**
 * P49 S14 — Competition Economics HHI Calculator.
 *
 * Top-5 market share input → Herfindahl-Hirschman Index + concentration level
 * + regulatory exposure assessment.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const MarketConcentrationAnalyzer: React.FC = () => {
  const [shares, setShares] = useState<number[]>([35, 20, 15, 10, 5]);

  const hhi = useMemo(() => shares.reduce((sum, s) => sum + s * s, 0), [shares]);

  const verdict = useMemo(() => {
    if (hhi >= 2500) return { tone: 'critical', label: 'Yüksek Konsantrasyon', text: 'HHI ≥ 2500 — antitröst inceleme riski yüksek. Birleşme/işbirliği işlemlerinde detaylı ekonomik analiz zorunlu.' };
    if (hhi >= 1500) return { tone: 'warning', label: 'Orta Konsantrasyon', text: 'HHI 1500-2500 — Rekabet Kurumu bildirim eşikleri test edilmeli; market definition tartışılabilir.' };
    return { tone: 'ok', label: 'Düşük Konsantrasyon', text: 'HHI < 1500 — pazar yeterince rekabetçi. Antitröst riski düşük.' };
  }, [hhi]);

  const total = shares.reduce((a, b) => a + b, 0);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="hhi-heading" data-testid="market-concentration-analyzer">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">HHI Hesaplayıcı</div>
          <h2 id="hhi-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Pazar Konsantrasyonu Analizi</h2>
          <p className="text-slate-400">Pazarın en büyük 5 oyuncusunun pazar payını girin. Herfindahl-Hirschman Index + regülasyon exposure değerlendirmesi.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
            {shares.map((sh, i) => (
              <div key={i}>
                <label htmlFor={`share-${i}`} className="block text-sm font-semibold text-white mb-2">Oyuncu {i + 1} Pazar Payı: <span className="text-secondary font-serif">%{sh}</span></label>
                <input id={`share-${i}`} type="range" min="0" max="80" step="1" value={sh}
                  onChange={(e) => { const next = [...shares]; next[i] = Number(e.target.value); setShares(next); }}
                  className="w-full accent-secondary" />
              </div>
            ))}
            <p className="text-xs text-slate-400 pt-2 border-t border-white/5">Toplam: %{total} {total > 100 && <span className="text-amber-400">({'>'}100, gerçekçi değil)</span>}</p>
          </div>
          <div className={`rounded-2xl p-6 md:p-8 border ${verdict.tone === 'critical' ? 'bg-red-500/10 border-red-500/30' : verdict.tone === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">Herfindahl-Hirschman Index</div>
            <div className="text-6xl font-serif font-bold text-white mb-2">{hhi}</div>
            <p className={`font-semibold mb-4 ${verdict.tone === 'critical' ? 'text-red-400' : verdict.tone === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {verdict.tone === 'ok' ? <CheckCircle2 size={16} className="inline mr-1" /> : <AlertTriangle size={16} className="inline mr-1" />}
              {verdict.label}
            </p>
            <p className="text-slate-200 text-sm leading-relaxed mb-6">{verdict.text}</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">Antitröst Audit <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};
