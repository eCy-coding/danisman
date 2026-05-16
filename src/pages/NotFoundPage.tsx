import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import {
  Home,
  Briefcase,
  Mail,
  ArrowRight,
  BookOpen,
  Building2,
  BadgeDollarSign,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EcyLogo } from '@/components/ui/EcyLogo';

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
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <Helmet>
        <title>{COPY.metaTitle[lang]}</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      {/* Header */}
      <header className="px-fib-6 md:px-fib-7 py-fib-5">
        <Link to="/" aria-label="EcyPro Home" className="inline-block">
          <EcyLogo size="md" variant="full" />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-fib-6 md:px-fib-7 py-fib-8 relative overflow-hidden">
        {/* Ambient glow */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          animate={prefersReducedMotion ? undefined : { opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-[700px] h-[700px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(217,119,6,0.04) 40%, transparent 70%)',
            }}
          />
        </motion.div>

        <div className="relative z-10 max-w-4xl w-full text-center">
          {/* 404 Gradient Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="font-serif-display text-[7rem] md:text-[10rem] lg:text-[12rem] font-bold leading-none tracking-tight bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 bg-clip-text text-transparent"
            aria-label="404"
          >
            404
          </motion.h1>

          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-fib-5 mb-fib-7" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-serif-display text-golden-xl md:text-golden-2xl font-bold text-white mb-fib-4 leading-tight"
          >
            {COPY.title[lang]}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-fib-8 font-light"
          >
            {COPY.description[lang]}
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-fib-4 justify-center items-center mb-fib-9"
          >
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="mr-2 h-5 w-5" />
                {COPY.homeBtn[lang]}
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Briefcase className="mr-2 h-5 w-5" />
                {COPY.servicesBtn[lang]}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Mail className="mr-2 h-5 w-5" />
                {COPY.contactBtn[lang]}
              </Button>
            </Link>
          </motion.div>

          {/* Suggestions bento */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="pt-fib-7 border-t border-white/[0.06]"
          >
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400 mb-fib-6">
              {COPY.suggestionsTitle[lang]}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-fib-5">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.to}
                    to={s.to}
                    className="group p-fib-6 rounded-fib-6 bg-[#111111] border border-white/[0.06] hover:border-secondary/30 transition-all duration-500 text-left flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-fib-4">
                      <div className="w-11 h-11 rounded-fib-5 bg-amber-500/8 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-[#080808] transition-all duration-300">
                        <Icon size={20} />
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-slate-400 group-hover:text-secondary group-hover:translate-x-1 transition-all"
                      />
                    </div>
                    <h3 className="text-golden-base font-bold text-white mb-fib-2 tracking-tight">
                      {s.title[lang]}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                      {s.desc[lang]}
                    </p>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
