/**
 * NotFoundPage — 404 fallback rendered by the React Router catch-all.
 *
 * P45 D5: Önceki sürüm `<motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`
 * kullanıyordu. Motion animation prod ortamda bazı yollarda mount-once trigger'ı kaçırıp
 * elementleri opacity 0'da bırakıyordu — sonuç tamamen siyah ekran. Bu sürüm motion'a
 * bağımlılığı kaldırır, sadece static CSS + standart Tailwind sınıfları kullanır.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Home, Briefcase, Mail, ArrowRight, BookOpen, Building2, BadgeDollarSign } from 'lucide-react';
import { NotFoundSearch } from '../components/common/NotFoundSearch';

interface Suggestion {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  to: string;
  title: { tr: string; en: string };
  desc: { tr: string; en: string };
}

const COPY = {
  title: { tr: 'Sayfa Bulunamadı', en: 'Page Not Found' },
  description: {
    tr: 'Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir. Aşağıdan devam edebilirsiniz.',
    en: 'The page you are looking for may have been moved, deleted, or never existed. You can continue from below.',
  },
  homeBtn: { tr: 'Ana Sayfa', en: 'Home' },
  servicesBtn: { tr: 'Hizmetler', en: 'Services' },
  contactBtn: { tr: 'İletişim', en: 'Contact' },
  suggestionsTitle: {
    tr: 'Belki bunlar ilginizi çekebilir',
    en: 'You might be interested in',
  },
  metaTitle: { tr: '404 — Sayfa Bulunamadı | EcyPro', en: '404 — Page Not Found | EcyPro' },
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: BookOpen,
    to: '/blog',
    title: { tr: 'Perspektifler', en: 'Perspectives' },
    desc: {
      tr: 'Stratejik içgörüler ve sektör analizleri.',
      en: 'Strategic insights and industry analysis.',
    },
  },
  {
    icon: Building2,
    to: '/case-studies',
    title: { tr: 'Vaka Çalışmaları', en: 'Case Studies' },
    desc: {
      tr: 'Ölçülebilir sonuçlar ve dönüşüm hikayeleri.',
      en: 'Measurable results and transformation stories.',
    },
  },
  {
    icon: BadgeDollarSign,
    to: '/pricing',
    title: { tr: 'Fiyatlandırma', en: 'Pricing' },
    desc: {
      tr: 'Şeffaf paketler ve özelleştirilebilir çözümler.',
      en: 'Transparent packages and customizable solutions.',
    },
  },
];

export const NotFoundPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  return (
    <div className="min-h-screen bg-neutral text-white flex flex-col">
      <Helmet>
        <title>{COPY.metaTitle[lang]}</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      {/* Header */}
      <header className="px-6 md:px-12 py-6">
        <Link to="/" aria-label="eCyPro Home" className="inline-flex items-center gap-2">
          <span className="text-xl font-serif font-bold text-white">eCy</span>
          <span className="text-xs uppercase tracking-widest text-slate-400">Pro</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-12 relative overflow-hidden">
        {/* Ambient glow — static (no animation) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div
            className="w-[700px] h-[700px] rounded-full opacity-40"
            style={{
              background:
                'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(217,119,6,0.04) 40%, transparent 70%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl w-full text-center">
          <h1
            className="text-[7rem] md:text-[10rem] lg:text-[12rem] font-bold leading-none tracking-tight text-amber-400"
            aria-label="404"
          >
            404
          </h1>

          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-5 mb-8" />

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight">
            {COPY.title[lang]}
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
            {COPY.description[lang]}
          </p>

          {/* P56.G8 — client-side route search */}
          <NotFoundSearch lang={lang === 'en' ? 'en' : 'tr'} />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors w-full sm:w-auto"
            >
              <Home className="h-5 w-5" />
              {COPY.homeBtn[lang]}
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors w-full sm:w-auto"
            >
              <Briefcase className="h-5 w-5" />
              {COPY.servicesBtn[lang]}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors w-full sm:w-auto"
            >
              <Mail className="h-5 w-5" />
              {COPY.contactBtn[lang]}
            </Link>
          </div>

          {/* Suggestions */}
          <div className="pt-10 border-t border-white/10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-8">
              {COPY.suggestionsTitle[lang]}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.to}
                    to={s.to}
                    className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-secondary/30 hover:bg-white/8 transition-all duration-300 text-left flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
                        <Icon size={20} />
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-slate-400 group-hover:text-secondary group-hover:translate-x-1 transition-all"
                      />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                      {s.title[lang]}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                      {s.desc[lang]}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
