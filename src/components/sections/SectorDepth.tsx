/**
 * SectorDepth — sektör sayfası answer-first derinlik bölümü (EK GÖREV 11).
 *
 * Prop-driven: overview (answer-first paragraf), methodology (4 adım grid),
 * outcomes (metrik stat-bar). FAQ (blog/FAQSection) ile birlikte sektör
 * sayfasını GEO/SEO için derinleştirir. Sayfanın mevcut stil dilini
 * (glass-card, text-primary, text-slate) izler; FadeIn ile sarmalanır (sayfada).
 */
import React from 'react';
import type { SectorContent } from '../../data/sectorContent';

interface SectorDepthProps {
  content: SectorContent;
  lang: 'tr' | 'en';
}

export const SectorDepth: React.FC<SectorDepthProps> = ({ content, lang }) => {
  return (
    <section
      className="mb-20"
      aria-label={lang === 'tr' ? 'Yaklaşım ve sonuçlar' : 'Approach and outcomes'}
    >
      {/* Answer-first overview */}
      <h2 className="text-2xl font-bold text-primary mb-6">
        {lang === 'tr' ? 'Genel Bakış' : 'Overview'}
      </h2>
      <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mb-12">
        {content.overview[lang]}
      </p>

      {/* Methodology */}
      <h2 className="text-2xl font-bold text-primary mb-8">
        {lang === 'tr' ? 'Nasıl Çalışıyoruz' : 'How We Work'}
      </h2>
      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {content.methodology.map((step, i) => (
          <li key={i} className="glass-card p-6 rounded-xl">
            <span className="text-secondary text-sm font-bold tracking-widest" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="font-bold text-primary mt-2 mb-2">{step.title[lang]}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{step.desc[lang]}</p>
          </li>
        ))}
      </ol>

      {/* Outcomes */}
      <h2 className="text-2xl font-bold text-primary mb-8">
        {lang === 'tr' ? 'Beklenen Sonuçlar' : 'Expected Outcomes'}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {content.outcomes.map((o, i) => (
          <div key={i} className="glass-card p-6 rounded-xl text-center">
            <dt className="sr-only">{o.label[lang]}</dt>
            <dd>
              <span className="block text-3xl font-extrabold text-secondary">{o.metric}</span>
              <span className="block text-sm text-slate-400 mt-2">{o.label[lang]}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
