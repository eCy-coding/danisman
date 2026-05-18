/**
 * P49 S7 — Crisis Management Readiness Matrix.
 *
 * 12 risk scenario, each user rates likelihood (1-3) × impact (1-3).
 * Top 3 exposure → playbook recommendation.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const SCENARIOS = [
  'Likidite krizi (banka covenants)', 'Üretim duruşu (kritik tedarikçi)', 'Siber güvenlik ihlali (KVKK)',
  'Anahtar çalışan kaybı', 'Marka reputasyonu (sosyal medya)', 'Müşteri konsantrasyonu (top-3 %60+)',
  'Kur şoku (USD/EUR yükselişi)', 'Regülasyon değişikliği', 'Doğal afet / pandemic',
  'Sendika grevi', 'Hukuki dava (sınıf aksiyonu)', 'Aile içi anlaşmazlık (governance)',
];

export const CrisisReadinessMatrix: React.FC = () => {
  const [scores, setScores] = useState<Record<number, { l: number; i: number }>>(
    Object.fromEntries(SCENARIOS.map((_, i) => [i, { l: 2, i: 2 }])),
  );

  const ranked = useMemo(() => {
    return SCENARIOS.map((name, idx) => ({
      idx, name, exposure: (scores[idx]?.l ?? 0) * (scores[idx]?.i ?? 0),
    })).sort((a, b) => b.exposure - a.exposure);
  }, [scores]);

  const top3 = ranked.slice(0, 3);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="crisis-matrix-heading" data-testid="crisis-readiness-matrix">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Kriz Hazırlığı Matrisi</div>
          <h2 id="crisis-matrix-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">12 Senaryo · Olasılık × Etki</h2>
          <p className="text-slate-400 max-w-2xl">Her senaryoyu olasılık ve etki olarak değerlendirin (1-3). En yüksek exposure'ı olan top-3 senaryo için BCP playbook önerisi.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 mb-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase tracking-widest text-slate-400">
              <th className="text-left p-2">Senaryo</th><th className="p-2">Olasılık (1-3)</th><th className="p-2">Etki (1-3)</th><th className="text-right p-2">Exposure</th>
            </tr></thead>
            <tbody>
              {SCENARIOS.map((name, idx) => {
                const s = scores[idx] ?? { l: 0, i: 0 };
                const exp = s.l * s.i;
                return (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="p-2 text-slate-200">{name}</td>
                    <td className="p-2"><input type="range" min="1" max="3" step="1" value={s.l} onChange={(e) => setScores({ ...scores, [idx]: { ...s, l: Number(e.target.value) } })} className="w-full accent-secondary" aria-label={`${name} olasılık`} /></td>
                    <td className="p-2"><input type="range" min="1" max="3" step="1" value={s.i} onChange={(e) => setScores({ ...scores, [idx]: { ...s, i: Number(e.target.value) } })} className="w-full accent-secondary" aria-label={`${name} etki`} /></td>
                    <td className="p-2 text-right"><span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${exp >= 6 ? 'bg-red-500/20 text-red-400' : exp >= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{exp}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-gradient-to-br from-amber-500/15 to-red-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8" role="status" aria-live="polite">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">En Yüksek Exposure — Top 3</div>
          <ol className="space-y-2 mb-6">
            {top3.map((r, i) => (
              <li key={r.idx} className="flex items-center gap-3 text-slate-200">
                <span className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-300">{i + 1}</span>
                <span className="flex-1">{r.name}</span>
                <span className="text-xs text-slate-400">Exposure: {r.exposure}</span>
              </li>
            ))}
          </ol>
          <p className="text-slate-300 text-sm mb-4">Top 3 exposure için Business Continuity Plan (BCP) tatbikatı + 72-saatlik acil eylem playbook önerilir.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-amber-500 text-neutral font-semibold hover:bg-amber-400 transition-colors">Acil BCP Görüşmesi <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
};
