/**
 * P49 S3 — Family Business Generational Transition Timeline.
 *
 * 3-generation horizontal timeline (Founder → 2. Nesil → 3. Nesil). User
 * "Geçişin neresindesiniz?" seçer → matching playbook.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Generation {
  id: 'founder' | 'gen2' | 'gen3' | 'gen4plus';
  name: string;
  era: string;
  pain: string;
  gap: string;
  intervention: string;
  engagement: string;
}

const GENS: Generation[] = [
  { id: 'founder', name: 'Kurucu Nesil', era: 'Şirket kuruluşu',
    pain: 'Şirket = aile = kurucu. Kararlar tek elden, yazılı yapı yok.',
    gap: 'Devir planı yok. Kurucu 65+ yaş ve emekliliğe yaklaşıyor.',
    intervention: 'Aile Konseyi + Anayasa drafting, kurucu mentorship',
    engagement: 'Yıllık Partnerlik' },
  { id: 'gen2', name: '2. Nesil', era: '20-40 yıl sonra',
    pain: 'Kardeşler arası karar haklarında belirsizlik; akraba istihdam çatışması.',
    gap: 'Profesyonel yönetim devri yarım; aile-iş çakışması artıyor.',
    intervention: 'Profesyonel CEO transition + karar hakları matrisi',
    engagement: 'Çeyreklik Engagement' },
  { id: 'gen3', name: '3. Nesil', era: '40-60 yıl sonra',
    pain: 'Kuzenler ekosistemi: farklı vizyonlar, yatırım önerileri çatışıyor.',
    gap: 'Pay sahipliği fragmentation; aile shareholder agreement zayıf.',
    intervention: 'Family Office yapılanması + holding governance',
    engagement: 'Yıllık Partnerlik' },
  { id: 'gen4plus', name: '4. Nesil+', era: '60+ yıl sonra',
    pain: '20+ hissedarlık; karar vetoları aktif yönetimi zorlaştırıyor.',
    gap: 'Aile vakfı / family office strateji yok; portfolio yönetimi karışık.',
    intervention: 'Aile vakfı + private family office mimarisi',
    engagement: 'Yıllık Partnerlik' },
];

export const GenerationalTransitionTimeline: React.FC = () => {
  const [selected, setSelected] = useState<Generation['id'] | null>(null);
  const selectedGen = selected ? GENS.find((g) => g.id === selected) : null;

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5 bg-gradient-to-b from-transparent via-secondary/[0.03] to-transparent" aria-labelledby="gen-timeline-heading" data-testid="generational-transition-timeline">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">Nesil Geçişi Teşhisi</div>
          <h2 id="gen-timeline-heading" className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Aile Şirketi Nesil Haritası</h2>
          <p className="text-slate-400 max-w-2xl">Şirketinizin bugün hangi nesil aşamasında olduğunu seçin — typical pain + governance gap + intervention paketi.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {GENS.map((gen) => {
            const isSelected = selected === gen.id;
            return (
              <button key={gen.id} type="button" onClick={() => setSelected(isSelected ? null : gen.id)} aria-pressed={isSelected}
                className={`text-left p-5 rounded-2xl border transition-all ${isSelected ? 'bg-secondary/10 border-secondary/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <Users size={20} className={`mb-3 ${isSelected ? 'text-secondary' : 'text-slate-400'}`} />
                <h3 className="text-base font-bold text-white mb-1">{gen.name}</h3>
                <p className="text-xs text-slate-400">{gen.era}</p>
              </button>
            );
          })}
        </div>
        {selectedGen && (
          <div className="p-6 md:p-8 bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" role="status" aria-live="polite">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2"><AlertCircle size={14} /> Tipik Pain</div>
                <p className="text-slate-200 text-sm leading-relaxed mb-4">{selectedGen.pain}</p>
                <p className="text-slate-300 text-sm leading-relaxed italic">Governance gap: {selectedGen.gap}</p>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> Intervention</div>
                <p className="text-slate-200 text-sm leading-relaxed mb-6">{selectedGen.intervention}</p>
                <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors">
                  {selectedGen.engagement} Görüşmesi <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
