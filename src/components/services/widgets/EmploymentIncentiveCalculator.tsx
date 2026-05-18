/**
 * P49 S16 — Payroll Audit Employment Incentive Calculator.
 *
 * Workforce + industry + region + avg salary → estimated SGK incentive savings.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const SECTORS = ['Üretim', 'Teknoloji/Yazılım', 'Hizmet', 'Sağlık', 'Eğitim', 'İhracat'];
const REGIONS = ['1. Bölge', '2-3. Bölge', '4-5. Bölge', '6. Bölge'];

export const EmploymentIncentiveCalculator: React.FC = () => {
  const [workforce, setWorkforce] = useState(100);
  const [sector, setSector] = useState(SECTORS[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [avgSalary, setAvgSalary] = useState(30000);

  const programs = useMemo(() => {
    const list: { name: string; saving: number }[] = [];
    // 5510/5746 — Ar-Ge/teknolojik destek (tech only)
    if (sector === 'Teknoloji/Yazılım') list.push({ name: '5746 Ar-Ge SGK Teşviki', saving: workforce * avgSalary * 0.155 });
    // 4447 - Genç istihdam
    list.push({ name: '4447 Genç İstihdam (tahmini)', saving: workforce * 0.2 * avgSalary * 0.12 });
    // 7256 - Yeni istihdam (5+ kişi şartı)
    if (workforce >= 5) list.push({ name: '7256 Yeni İstihdam Desteği', saving: workforce * 0.1 * avgSalary * 0.155 });
    // 6. Bölge SGK
    if (region === '6. Bölge') list.push({ name: '6. Bölge SGK Devlet Desteği', saving: workforce * avgSalary * 0.155 });
    // 4-5. Bölge teşvik
    if (region === '4-5. Bölge') list.push({ name: '4-5. Bölge Bölgesel Teşvik', saving: workforce * avgSalary * 0.08 });
    return list;
  }, [workforce, sector, region, avgSalary]);

  const total = useMemo(() => programs.reduce((sum, p) => sum + p.saving, 0), [programs]);

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="payroll-heading" data-testid="employment-incentive-calculator">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">İstihdam Teşvik Tahminleyici</div>
          <h2 id="payroll-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">SGK Teşvik Tasarruf Potansiyeli</h2>
          <p className="text-slate-400">Bordro değerlerinizi girin — uygun olduğunuz teşvik programları + tahmini yıllık tasarruf.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-5">
            <div><label className="block text-sm font-semibold text-white mb-2">Sektör</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-sm font-semibold text-white mb-2">Bölge</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white">
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select></div>
            <div><label className="block text-sm font-semibold text-white mb-2">Çalışan Sayısı: <span className="text-secondary font-serif">{workforce}</span></label>
              <input type="range" min="5" max="2000" step="5" value={workforce} onChange={(e) => setWorkforce(Number(e.target.value))} className="w-full accent-secondary" /></div>
            <div><label className="block text-sm font-semibold text-white mb-2">Ortalama Brüt Maaş (₺/ay): <span className="text-secondary font-serif">₺{avgSalary.toLocaleString('tr-TR')}</span></label>
              <input type="range" min="20000" max="150000" step="2500" value={avgSalary} onChange={(e) => setAvgSalary(Number(e.target.value))} className="w-full accent-secondary" /></div>
          </div>
          <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8">
            <div className="text-xs uppercase tracking-widest text-secondary mb-3">Uygun Programlar ({programs.length})</div>
            {programs.length === 0 ? (
              <p className="text-slate-300 text-sm mb-4">Mevcut girdilerinizle uygulanabilir program bulunmadı.</p>
            ) : (
              <ul className="space-y-2 mb-6">
                {programs.map((p) => (
                  <li key={p.name} className="flex justify-between items-start gap-2 text-sm bg-white/5 p-3 rounded-lg">
                    <span className="text-slate-200 flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />{p.name}</span>
                    <span className="text-secondary font-serif font-bold whitespace-nowrap">₺{Math.round(p.saving / 1000)}k/yıl</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-4 border-t border-white/10">
              <div className="text-xs uppercase tracking-widest text-secondary mb-2">Tahmini Yıllık Tasarruf</div>
              <div className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">₺{Math.round(total / 1000)}k</div>
              <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">Detaylı Audit <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
