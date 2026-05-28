import React from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FounderSnippetProps {
  className?: string;
}

const MANIFESTO_TR = `Türkiye'nin gerçek anlamda uluslararası standartlarda danışmanlık hizmeti almayı
hak eden bir iş dünyası var. Biz eCyPro'da ölçek fark etmeksizin her kuruma
Big4 kalitesinde stratejik rehberlik sunmayı misyon edindik. Veri yönetişimi,
regülasyon uyumu ve dijital dönüşüm — üçü bir arada, kesintisiz, ölçeklenebilir.`;

const EXPERTISE = [
  'KVKK & AB Regülasyonu',
  'M&A Danışmanlığı',
  'ESG Raporlaması',
  'Fintech Stratejisi',
  'Aile Şirketleri Yönetişimi',
];

export const FounderSnippet: React.FC<FounderSnippetProps> = ({ className }) => {
  return (
    <section
      data-testid="founder-snippet"
      aria-label="Kurucu & Vizyon"
      className={cn(
        'relative bg-[#060A14] border-y border-white/5 py-24 overflow-hidden',
        className,
      )}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left — founder photo placeholder + badge */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-6">
            {/* Avatar / photo */}
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(37,99,235,0.15)]">
                <span className="text-5xl font-bold text-white/20 select-none font-serif">ECY</span>
              </div>
              {/* Founder badge chip */}
              <div className="absolute -bottom-3 -right-3 bg-secondary/10 border border-secondary/30 rounded-full px-3 py-1 text-xs font-bold text-secondary tracking-wider">
                Founder
              </div>
            </div>

            {/* Name + title */}
            <div>
              <p className="text-xl font-bold text-white tracking-tight">Emre Can Yalçın</p>
              <p className="text-sm text-slate-400 mt-1">Kurucu Ortak & CEO · eCyPro</p>
            </div>

            {/* Expertise tags */}
            <ul className="flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
              {EXPERTISE.map((area) => (
                <li
                  key={area}
                  className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — manifesto */}
          <div className="lg:col-span-8">
            <div className="flex items-start gap-3 mb-6">
              <Quote size={32} className="text-secondary/40 shrink-0 mt-1" aria-hidden="true" />
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-white leading-tight">
                Kurucu Manifestosu
              </h2>
            </div>

            <p className="text-lg text-slate-300 leading-[1.85] whitespace-pre-line border-l-2 border-secondary/30 pl-6">
              {MANIFESTO_TR}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" aria-hidden="true" />
              <span className="text-xs text-slate-500 tracking-widest uppercase font-bold">
                eCyPro Premium Consulting — 2019
              </span>
              <div className="h-px flex-1 bg-white/5" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
