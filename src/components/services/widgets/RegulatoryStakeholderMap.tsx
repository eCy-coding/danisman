/**
 * P49 S21 — Government Relations Stakeholder Map.
 *
 * 4-quadrant influence × interest grid. User stakeholder'larını quadrant'a
 * yerleştirir → engagement strategy per quadrant.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Stakeholder { id: string; name: string; influence: number; interest: number; }

const PRESET: Stakeholder[] = [
  { id: 's1', name: 'Sektör Bakanlığı', influence: 5, interest: 4 },
  { id: 's2', name: 'Düzenleyici Otorite', influence: 5, interest: 5 },
  { id: 's3', name: 'TBMM Komisyon', influence: 4, interest: 3 },
  { id: 's4', name: 'Sektör Derneği', influence: 3, interest: 5 },
  { id: 's5', name: 'AB Komisyonu', influence: 4, interest: 2 },
  { id: 's6', name: 'Yerel Belediye', influence: 2, interest: 3 },
  { id: 's7', name: 'Sivil Toplum', influence: 2, interest: 4 },
  { id: 's8', name: 'Medya', influence: 3, interest: 2 },
];

const QUADRANTS = {
  'high-high': { name: 'Yakın Yönet', desc: 'Sürekli engagement + briefing + position paper. Aylık görüşme + krizleri öngör.' },
  'high-low': { name: 'Tatmin Et', desc: 'Periodic update + bilgi paylaşımı. Reaktif değil proactive bilgilendirme.' },
  'low-high': { name: 'Bilgilendir', desc: 'Newsletter + dernek aracılığıyla sürekli iletişim. Sahibimiz değil ama destekçi.' },
  'low-low': { name: 'Monitör', desc: 'Düşük efor ile takip. Önemli değişimde kontak.' },
} as const;

const quadrantOf = (s: Stakeholder): keyof typeof QUADRANTS => {
  const hi = s.influence >= 3;
  const hh = s.interest >= 3;
  return `${hi ? 'high' : 'low'}-${hh ? 'high' : 'low'}` as keyof typeof QUADRANTS;
};

export const RegulatoryStakeholderMap: React.FC = () => {
  const [items, setItems] = useState<Stakeholder[]>(PRESET);
  const grouped = useMemo(() => {
    return items.reduce<Record<string, Stakeholder[]>>((acc, s) => {
      const q = quadrantOf(s);
      if (!acc[q]) acc[q] = [];
      acc[q]!.push(s);
      return acc;
    }, {});
  }, [items]);

  const update = (id: string, key: 'influence' | 'interest', val: number) => {
    setItems(items.map((s) => (s.id === id ? { ...s, [key]: val } : s)));
  };

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="gr-heading" data-testid="regulatory-stakeholder-map">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">Stakeholder Mapping</div>
          <h2 id="gr-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Influence × Interest Grid</h2>
          <p className="text-slate-400 max-w-2xl">8 örnek stakeholder'ı kendi gözlemlerinize göre konumlandırın (1-5 etki + 1-5 ilgi). Her quadrant için engagement stratejisi.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Stakeholder Ayarları</div>
            <div className="space-y-3">
              {items.map((s) => (
                <div key={s.id} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-200 font-semibold">{s.name}</span>
                    <span className="text-xs text-slate-400">Etki {s.influence} · İlgi {s.interest}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="range" min="1" max="5" value={s.influence} onChange={(e) => update(s.id, 'influence', Number(e.target.value))} className="accent-secondary" aria-label={`${s.name} etki`} />
                    <input type="range" min="1" max="5" value={s.interest} onChange={(e) => update(s.id, 'interest', Number(e.target.value))} className="accent-emerald-400" aria-label={`${s.name} ilgi`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(QUADRANTS) as Array<keyof typeof QUADRANTS>).map((q) => {
              const list = grouped[q] ?? [];
              const meta = QUADRANTS[q];
              return (
                <div key={q} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">{meta.name}</div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{meta.desc}</p>
                  <ul className="space-y-1">
                    {list.length === 0 ? <li className="text-xs text-slate-500 italic">Yok</li> : list.map((s) => <li key={s.id} className="text-xs text-slate-200">• {s.name}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-slate-200 mb-4">Yakın Yönet ({grouped['high-high']?.length ?? 0}) stakeholder için aylık briefing + position paper portföy.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">GR Strateji Görüşmesi <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
};
