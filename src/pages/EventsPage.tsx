import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Users, Globe, ArrowRight, Video } from 'lucide-react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { EVENTS_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { Link } from 'react-router-dom';

const UPCOMING_EVENTS = [
  {
    id: 'ai-strategy-2026',
    type: 'webinar',
    date: '2026-06-12',
    time: '14:00',
    duration: 90,
    title: {
      tr: 'Kurumsal AI Stratejisi: 2026 Yol Haritası',
      en: 'Enterprise AI Strategy: 2026 Roadmap',
    },
    desc: {
      tr: 'Yapay zeka olgunluk değerlendirmesi, pilot proje seçimi ve ROI hesaplama çerçevesi.',
      en: 'AI maturity assessment, pilot project selection, and ROI calculation framework.',
    },
    speakers: ['Dr. Ayşe K.', 'Emre C.'],
    capacity: 200,
    registered: 148,
    tags: { tr: ['Yapay Zeka', 'Strateji', 'Dönüşüm'], en: ['AI', 'Strategy', 'Transformation'] },
    accent: '#38BDF8',
  },
  {
    id: 'ma-masterclass-2026',
    type: 'workshop',
    date: '2026-06-24',
    time: '10:00',
    duration: 180,
    title: {
      tr: 'M&A Masterclass: Due Diligence & Değerleme',
      en: 'M&A Masterclass: Due Diligence & Valuation',
    },
    desc: {
      tr: 'Birleşme ve satın alma süreçlerinde hukuki, mali ve operasyonel due diligence metodolojileri.',
      en: 'Legal, financial, and operational due diligence methodologies in M&A transactions.',
    },
    speakers: ['Mert D.', 'Burak T.'],
    capacity: 50,
    registered: 37,
    tags: { tr: ['M&A', 'Değerleme', 'Due Diligence'], en: ['M&A', 'Valuation', 'Due Diligence'] },
    accent: '#D97706',
  },
  {
    id: 'esg-reporting-2026',
    type: 'webinar',
    date: '2026-07-08',
    time: '15:00',
    duration: 60,
    title: {
      tr: 'ESG Raporlama: CSRD & TCFD Uyum Kılavuzu',
      en: 'ESG Reporting: CSRD & TCFD Compliance Guide',
    },
    desc: {
      tr: "AB Kurumsal Sürdürülebilirlik Raporlaması Direktifi'ne (CSRD) uyum için pratik çerçeve.",
      en: 'Practical framework for EU Corporate Sustainability Reporting Directive (CSRD) compliance.',
    },
    speakers: ['Zeynep A.'],
    capacity: 300,
    registered: 215,
    tags: {
      tr: ['ESG', 'Sürdürülebilirlik', 'Uyumluluk'],
      en: ['ESG', 'Sustainability', 'Compliance'],
    },
    accent: '#10B981',
  },
  {
    id: 'digital-ops-2026',
    type: 'conference',
    date: '2026-07-22',
    time: '09:00',
    duration: 480,
    title: {
      tr: 'EcyPro Digital Operations Summit 2026',
      en: 'EcyPro Digital Operations Summit 2026',
    },
    desc: {
      tr: 'Dijital operasyon dönüşümü, RPA uygulamaları ve Lean 4.0 metodolojileri üzerine tam günlük konferans.',
      en: 'Full-day conference on digital operations transformation, RPA applications, and Lean 4.0 methodologies.',
    },
    speakers: ['Selin Y.', 'Dr. Ayşe K.', 'Emre C.'],
    capacity: 500,
    registered: 312,
    tags: {
      tr: ['Operasyon', 'Dijital', 'Lean', 'RPA'],
      en: ['Operations', 'Digital', 'Lean', 'RPA'],
    },
    accent: '#2563EB',
  },
];

const TYPE_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  webinar: { tr: 'Webinar', en: 'Webinar', color: '#38BDF8' },
  workshop: { tr: 'Workshop', en: 'Workshop', color: '#D97706' },
  conference: { tr: 'Konferans', en: 'Conference', color: '#2563EB' },
};

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const EventsPage: React.FC = () => {
  const { language: lang } = useTranslation();
  const l = (obj: MultiLang) => getLang(obj, lang);
  const la = (arr: { tr: string[]; en: string[] }) => arr[lang as 'tr' | 'en'] ?? arr.en;
  const [filter, setFilter] = useState<'all' | 'webinar' | 'workshop' | 'conference'>('all');

  const filtered =
    filter === 'all' ? UPCOMING_EVENTS : UPCOMING_EVENTS.filter((e) => e.type === filter);

  return (
    <div className="min-h-screen bg-neutral text-white">
      <SEO
        title={l(EVENTS_COPY.title as MultiLang)}
        description={l(EVENTS_COPY.subtitle as MultiLang)}
        canonical="/events"
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(37,99,235,0.1),transparent)]" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-6">
              {lang === 'tr' ? 'Etkinlikler & Eğitimler' : 'Events & Training'}
            </span>
            <h1
              className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 leading-tight"
              data-testid="events-heading"
            >
              {l(EVENTS_COPY.title as MultiLang)}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
              {l(EVENTS_COPY.subtitle as MultiLang)}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Filter */}
      <div className="sticky top-20 z-30 border-b border-white/5 bg-neutral/95">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'webinar', 'workshop', 'conference'] as const).map((f) => (
              <button type="button"
                key={f}
                onClick={() => setFilter(f)}
                data-testid={`event-filter-${f}`}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  filter === f
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {f === 'all'
                  ? lang === 'tr'
                    ? 'Tümü'
                    : 'All'
                  : (TYPE_LABELS[f]?.[lang as 'tr' | 'en'] ?? f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Calendar size={48} className="text-slate-600 mb-6" />
              <p className="text-slate-400 text-lg">{l(EVENTS_COPY.noEvents as MultiLang)}</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {filtered.map((ev) => {
                const typeInfo = TYPE_LABELS[ev.type] ?? {
                  tr: ev.type,
                  en: ev.type,
                  color: '#64748B',
                };
                const pct = Math.round((ev.registered / ev.capacity) * 100);
                return (
                  <motion.article
                    key={ev.id}
                    data-testid="event-card"
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 overflow-hidden hover:border-white/20 transition-all duration-500"
                  >
                    {/* Accent bar */}
                    <div
                      className="absolute top-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-700"
                      style={{ background: `linear-gradient(to right, ${ev.accent}, transparent)` }}
                    />

                    {/* Header row */}
                    <div className="flex items-start justify-between mb-5">
                      <span
                        className="px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase rounded-md"
                        style={{
                          background: `${typeInfo.color}15`,
                          color: typeInfo.color,
                          border: `1px solid ${typeInfo.color}30`,
                        }}
                      >
                        {typeInfo[lang as 'tr' | 'en']}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                        <Video size={12} />
                        {lang === 'tr' ? 'Online' : 'Online'}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-serif font-semibold text-white mb-3 group-hover:text-secondary transition-colors duration-300 leading-snug">
                      {l(ev.title as MultiLang)}
                    </h2>

                    {/* Description */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      {l(ev.desc as MultiLang)}
                    </p>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(ev.date, lang)}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={13} className="text-slate-500" />
                        {ev.time} · {ev.duration} {lang === 'tr' ? 'dk' : 'min'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 col-span-2">
                        <Users size={13} className="text-slate-500" />
                        {ev.speakers.join(' & ')}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {la(ev.tags).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-white/5 border border-white/10 text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Capacity progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
                        <span>{lang === 'tr' ? 'Doluluk' : 'Capacity'}</span>
                        <span>
                          {ev.registered}/{ev.capacity} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(to right, ${ev.accent}, ${ev.accent}80)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      to="/contact"
                      data-testid="event-register-btn"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl text-white transition-all duration-300 hover:opacity-90"
                      style={{
                        background: `linear-gradient(135deg, ${ev.accent}30, ${ev.accent}10)`,
                        border: `1px solid ${ev.accent}30`,
                      }}
                    >
                      {lang === 'tr' ? 'Kayıt Ol' : 'Register Now'} <ArrowRight size={13} />
                    </Link>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Past events CTA */}
      <section className="py-16 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <Globe size={32} className="text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-white mb-4">
              {lang === 'tr' ? 'Tüm Etkinlikleri Kaçırmayın' : "Don't Miss Any Events"}
            </h2>
            <p className="text-slate-400 mb-8">
              {lang === 'tr'
                ? 'Yaklaşan webinar ve workshoplar için bültenimize abone olun.'
                : 'Subscribe to our newsletter for upcoming webinars and workshops.'}
            </p>
            <Link
              to="/#newsletter"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:border-white/30 text-white font-bold rounded-xl transition-all duration-300 text-sm"
            >
              {lang === 'tr' ? 'Bültene Abone Ol' : 'Subscribe to Newsletter'}{' '}
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};
