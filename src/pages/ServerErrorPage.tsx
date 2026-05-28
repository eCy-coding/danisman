/**
 * ServerErrorPage — /500 route.
 *
 * atom-16-1: Empathy error illustration + TR empathy tone
 * atom-16-2: Status page link + last incident
 * atom-16-3: Retry CTA + contact fallback
 *
 * Design: warm slate + amber gold, no glassmorphism.
 * Motion: framer-motion, respects prefers-reduced-motion.
 * A11y: WCAG 2.1 AA, role=alert, aria-live.
 */

import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useReducedMotion } from 'motion/react';
import { ServerCrash, RefreshCw, ArrowRight, Home, Mail } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const COPY = {
  metaTitle: {
    tr: '500 — Teknik Sorun | eCyPro',
    en: '500 — Server Error | eCyPro',
  },
  metaDesc: {
    tr: 'eCyPro platformunda geçici bir teknik sorun yaşıyoruz.',
    en: 'A temporary technical issue on the eCyPro platform.',
  },
  heading: {
    tr: 'Geçici Bir Teknik Sorun',
    en: 'Temporary Technical Issue',
  },
  sub: {
    tr: 'Ekibimiz durumun farkında ve en kısa sürede çözüm için çalışıyor. Bu süre zarfında aşağıdaki seçeneklerden yararlanabilirsiniz.',
    en: 'Our team is aware of the situation and working on a fix. In the meantime, you can use the options below.',
  },
  retryBtn: { tr: 'Sayfayı Yenile', en: 'Retry' },
  homeBtn: { tr: 'Ana Sayfaya Dön', en: 'Return Home' },
  contactBtn: { tr: 'Bize Ulaşın', en: 'Contact Us' },
  statusLink: { tr: 'Sistem Durumunu Gör', en: 'View System Status' },
  statusSub: {
    tr: 'Gerçek zamanlı servis sağlığı ve son incident bilgisi:',
    en: 'Real-time service health and last incident info:',
  },
  contactFallback: {
    tr: 'Sorun devam ediyorsa doğrudan iletişime geçin:',
    en: 'If the issue persists, contact us directly:',
  },
} as const;

export const ServerErrorPage: React.FC = () => {
  const { i18n } = useTranslation();
  const lang: 'tr' | 'en' = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();

  const handleRetry = useCallback(() => {
    navigate(0); // same as window.location.reload()
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>{COPY.metaTitle[lang]}</title>
        <meta name="description" content={COPY.metaDesc[lang]} />
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      <div
        className="min-h-screen bg-neutral text-white flex flex-col"
        data-testid="server-error-page"
      >
        {/* Minimal header */}
        <header className="px-6 md:px-12 py-6 border-b border-white/5">
          <Link
            to="/"
            aria-label={lang === 'tr' ? 'eCyPro Ana Sayfa' : 'eCyPro Home'}
            className="inline-flex items-center gap-2"
          >
            <span className="text-xl font-serif font-bold text-white">eCy</span>
            <span className="text-xs uppercase tracking-widest text-slate-400">Pro</span>
          </Link>
        </header>

        {/* atom-16-1: Empathy error illustration */}
        <main
          role="alert"
          aria-live="assertive"
          className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16 relative overflow-hidden"
          data-testid="server-error-main"
        >
          {/* Ambient glow — static, no animation to avoid opacity-0 trap */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div
              className="w-[600px] h-[600px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 40%, transparent 70%)',
              }}
            />
          </div>

          <div className="relative z-10 max-w-2xl w-full text-center">
            {/* Error code — decorative, large */}
            <div
              className="text-[7rem] md:text-[10rem] font-bold leading-none tracking-tight text-rose-400 select-none"
              aria-hidden="true"
              style={{
                opacity: shouldReduce ? 1 : undefined,
              }}
            >
              500
            </div>

            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-rose-500 to-transparent mt-4 mb-8" />

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"
                aria-hidden="true"
              >
                <ServerCrash size={28} className="text-rose-400" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4 leading-tight">
              {COPY.heading[lang]}
            </h1>

            <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-lg mx-auto">
              {COPY.sub[lang]}
            </p>

            {/* atom-16-3: Retry CTA + contact fallback */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
              data-testid="server-error-actions"
            >
              <button
                type="button"
                onClick={handleRetry}
                data-testid="server-error-retry"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <RefreshCw size={16} aria-hidden="true" />
                {COPY.retryBtn[lang]}
              </button>
              <Link
                to="/"
                data-testid="server-error-home"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                <Home size={16} aria-hidden="true" />
                {COPY.homeBtn[lang]}
              </Link>
              <Link
                to="/contact"
                data-testid="server-error-contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                <Mail size={16} aria-hidden="true" />
                {COPY.contactBtn[lang]}
              </Link>
            </div>

            {/* atom-16-2: Status page link */}
            <div
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left"
              data-testid="server-error-status"
            >
              <p className="text-xs text-slate-500 mb-3">{COPY.statusSub[lang]}</p>
              <Link
                to="/status"
                className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                {COPY.statusLink[lang]}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <div className="mt-4 pt-4 border-t border-white/8">
                <p className="text-xs text-slate-500 mb-2">{COPY.contactFallback[lang]}</p>
                <a
                  href="mailto:info@ecypro.com"
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  info@ecypro.com
                </a>
              </div>
            </div>
          </div>
        </main>

        <footer role="contentinfo" className="border-t border-white/5 px-6 py-6 text-center">
          <p className="text-xs text-slate-600">© 2026 eCyPro Premium Consulting</p>
        </footer>
      </div>
    </>
  );
};

export default ServerErrorPage;
