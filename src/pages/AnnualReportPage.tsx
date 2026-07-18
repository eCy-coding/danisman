/**
 * P54.A3 — Annual Report 2025 sayfası.
 *
 * Route: /annual-report/2025
 * Veri: src/data/annual-report-2025.ts
 *
 * Sayfa şeması: hero → metrics grid → sector mix → methodology highlights
 * → narrative sections → outlook → signoff → CTA.
 *
 * SEO: canonical + structured data (Article + Organization).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Sparkles } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { ANNUAL_REPORT_2025 } from '../data/annual-report-2025';

const REPORT = ANNUAL_REPORT_2025;

const TITLE = `${REPORT.year} Yıllık Raporu | eCyPro Premium Consulting`;
const DESCRIPTION = `${REPORT.headline} — anonimleştirilmiş engagement portföyü, sektör dağılımı, methodoloji metrikleri.`;
const URL = `https://ecypro.com/annual-report/${REPORT.year}`;

export const AnnualReportPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <SEO title={TITLE} description={DESCRIPTION} canonical={`/annual-report/${REPORT.year}`} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Report',
          name: TITLE,
          datePublished: `${REPORT.year}-12-31`,
          author: {
            '@type': 'Organization',
            name: 'eCyPro Premium Consulting',
            url: 'https://ecypro.com',
          },
          publisher: {
            '@type': 'Organization',
            name: 'eCyPro Premium Consulting',
            url: 'https://ecypro.com',
          },
          headline: REPORT.headline,
          description: DESCRIPTION,
          url: URL,
        }}
      />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-5">
            <Sparkles size={12} /> Yıllık Rapor {REPORT.year}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-5 leading-[1.05]">
            {REPORT.headline}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-6 max-w-3xl">
            {REPORT.subhead}
          </p>
          <p className="text-base text-slate-400 leading-relaxed max-w-3xl">
            {REPORT.introNarrative}
          </p>
        </div>
      </section>

      {/* Metrics grid */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8 flex items-center gap-3">
            <BarChart3 size={24} className="text-secondary" />
            Bir Bakışta {REPORT.year}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {REPORT.metrics.map((m) => (
              <div key={m.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-1">
                  {m.label}
                </div>
                <div className="text-4xl font-serif font-bold text-white mb-2">{m.value}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector mix */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
            Sektör Dağılımı
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Toplam engagement portföyünün anonim sektör kompozisyonu.
          </p>
          <div className="space-y-3">
            {REPORT.sectorMix.map((s) => (
              <div key={s.sector}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white font-semibold">{s.sector}</span>
                  <span className="text-slate-400">%{s.share}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-accent rounded-full"
                    style={{ width: `${Math.min(100, s.share * 4)}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology highlights */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8">
            5-Katmanlı Metodoloji — {REPORT.year} Uygulama
          </h2>
          <div className="space-y-5">
            {REPORT.methodologyHighlights.map((m, idx) => (
              <article
                key={m.layer}
                className="bg-white/[0.02] border border-white/8 rounded-xl p-6"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg font-serif font-bold text-white">{m.layer}</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{m.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative sections */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-3xl mx-auto space-y-12">
          {REPORT.sections.map((s) => (
            <article key={s.id} id={s.id}>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                {s.title}
              </h2>
              <p className="text-base text-slate-300 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Outlook */}
      <section className="py-16 px-6 md:px-12 border-b border-white/5 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
            2026 Görünümü
          </h2>
          <p className="text-base text-slate-300 leading-relaxed">{REPORT.outlook2026}</p>
        </div>
      </section>

      {/* Signoff + CTA */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-slate-400 italic mb-6">{REPORT.signoff}</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
          >
            45 dk Discovery Call <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AnnualReportPage;
