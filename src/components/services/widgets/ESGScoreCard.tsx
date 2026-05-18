/**
 * P49 S11 — ESG Strategy Scorecard (E/S/G × 5 question = 15 maddelik audit).
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Users, Scale } from 'lucide-react';

const PILLARS = [
  { id: 'E', name: 'Environmental', icon: Leaf, color: 'emerald',
    items: ['Scope 1+2 karbon envanteri var', 'Scope 3 ölçümü başlatıldı', 'Enerji verimlilik hedefi yazılı', 'Atık/su yönetim politikası var', 'Yeşil tedarik kriterleri uygulanıyor'] },
  { id: 'S', name: 'Social', icon: Users, color: 'amber',
    items: ['Çalışan engagement yıllık ölçülür', 'Çeşitlilik (D&I) politikası aktif', 'Tedarikçi insan hakları audit', 'Topluluk yatırım programı', 'İş güvenliği (LTIR) hedef altında'] },
  { id: 'G', name: 'Governance', icon: Scale, color: 'indigo',
    items: ['Yönetim kurulu bağımsız üye %', 'ESG komitesi kurulu', 'Etik kod + ihlal hattı', 'Risk yönetim framework yazılı', 'Sürdürülebilirlik raporu yıllık'] },
];

export const ESGScoreCard: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const score = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const total = PILLARS.reduce((s, p) => s + p.items.length, 0);
  const allAnswered = Object.keys(answers).length === total;
  const pct = Math.round((score / total) * 100);
  const rec = pct < 30 ? 'ESG Baseline Audit (3 hafta)' : pct < 60 ? 'Reporting Framework + Materiality' : 'Decarbonization & Green Finance';

  const toggle = (key: string) => setAnswers({ ...answers, [key]: !answers[key] });

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="esg-heading" data-testid="esg-scorecard">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">ESG Hazırlık Skoru</div>
          <h2 id="esg-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">E/S/G — 15 Maddelik Audit</h2>
          <p className="text-slate-400">Her boyutta evet/hayır işaretleyin. Toplam ESG readiness % + GAP raporu.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const pillarScore = p.items.filter((_, i) => answers[`${p.id}-${i}`]).length;
            return (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={20} className={`text-${p.color}-400`} />
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <span className="ml-auto text-xs text-slate-400">{pillarScore}/{p.items.length}</span>
                </div>
                <div className="space-y-2">
                  {p.items.map((item, i) => {
                    const key = `${p.id}-${i}`;
                    const checked = !!answers[key];
                    return (
                      <label key={i} className="flex items-start gap-2 text-sm cursor-pointer min-h-[44px]">
                        <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="mt-1 accent-secondary" />
                        <span className={checked ? 'text-slate-200' : 'text-slate-400'}>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {allAnswered && (
          <div className="bg-gradient-to-br from-emerald-500/15 to-secondary/10 border border-emerald-500/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500" role="status" aria-live="polite">
            <div className="text-xs uppercase tracking-widest text-emerald-400 mb-2">ESG Readiness</div>
            <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl font-serif font-bold text-white">%{pct}</span></div>
            <p className="text-slate-200 mb-4">Önerilen: <strong className="text-white">{rec}</strong></p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-emerald-500 text-neutral font-semibold hover:bg-emerald-400 transition-colors">ESG Audit Görüşmesi <ArrowRight size={16} /></Link>
          </div>
        )}
      </div>
    </section>
  );
};
