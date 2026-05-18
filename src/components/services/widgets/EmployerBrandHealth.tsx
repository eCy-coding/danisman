/**
 * P49 S17 — Employer Brand Health Score (8 dimension).
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const DIMS = [
  { id: 'glassdoor', label: 'Glassdoor rating (1-5)', min: 1, max: 5, step: 0.1, default: 3.5 },
  { id: 'offerAccept', label: 'Offer accept oranı (%)', min: 30, max: 100, step: 5, default: 70 },
  { id: 'tth', label: 'Time-to-hire (gün)', min: 14, max: 120, step: 7, default: 45, inverse: true },
  { id: 'turnover', label: 'Çalışan turnover (%)', min: 5, max: 40, step: 1, default: 18, inverse: true },
  { id: 'enps', label: 'eNPS (Net Promoter)', min: -30, max: 70, step: 5, default: 20 },
  { id: 'comp', label: 'Tazminat %ile (1-5)', min: 1, max: 5, step: 1, default: 3 },
  { id: 'career', label: 'Kariyer framework (1-5)', min: 1, max: 5, step: 1, default: 3 },
  { id: 'evp', label: 'EVP netliği (1-5)', min: 1, max: 5, step: 1, default: 3 },
];

const normalize = (id: string, val: number) => {
  const d = DIMS.find((x) => x.id === id);
  if (!d) return 0;
  const ratio = (val - d.min) / (d.max - d.min);
  return Math.round((d.inverse ? 1 - ratio : ratio) * 100);
};

export const EmployerBrandHealth: React.FC = () => {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(DIMS.map((d) => [d.id, d.default])),
  );
  const score = useMemo(() => {
    const norms = DIMS.map((d) => normalize(d.id, values[d.id] ?? 0));
    return Math.round(norms.reduce((a, b) => a + b, 0) / DIMS.length);
  }, [values]);
  const weak = useMemo(() => DIMS.filter((d) => normalize(d.id, values[d.id] ?? 0) < 50), [values]);
  const rec = score < 50 ? 'EVP Audit + Brand Redesign' : score < 75 ? 'Recruitment Marketing' : 'Amplifier — Glassdoor optimization';

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="eb-heading" data-testid="employer-brand-health">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">İşveren Markası Sağlığı</div>
          <h2 id="eb-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">8 Boyutlu Brand Health</h2>
          <p className="text-slate-400">Her boyutu mevcut durumunuza göre ayarlayın. Toplam sağlık skoru + zayıf alanlar.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {DIMS.map((d) => {
            const norm = normalize(d.id, values[d.id] ?? 0);
            return (
              <div key={d.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-sm font-semibold text-white">{d.label}</label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${norm >= 75 ? 'bg-emerald-500/20 text-emerald-400' : norm >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{norm}/100</span>
                </div>
                <input type="range" min={d.min} max={d.max} step={d.step} value={values[d.id]} onChange={(e) => setValues({ ...values, [d.id]: Number(e.target.value) })} className="w-full accent-secondary" />
                <p className="mt-1 text-xs text-slate-400">Değer: {values[d.id]}</p>
              </div>
            );
          })}
        </div>
        <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
          <div className="text-xs uppercase tracking-widest text-secondary mb-3">Toplam Brand Health</div>
          <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-serif font-bold text-white">{score}</span><span className="text-slate-400">/100</span></div>
          {weak.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Zayıf Alanlar ({weak.length})</div>
              <ul className="space-y-1 mb-4 text-sm text-slate-300">{weak.map((w) => <li key={w.id}>• {w.label}</li>)}</ul>
            </>
          )}
          <p className="text-slate-200 mb-4">Önerilen: <strong className="text-white">{rec}</strong></p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">EVP Audit Görüşmesi <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
};
