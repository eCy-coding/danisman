import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Home, AlertTriangle, ServerCrash } from 'lucide-react';

// 404 + 500 combined prototype — route decides which variant renders
type ErrorType = '404' | '500';

const ERROR_CONTENT: Record<
  ErrorType,
  {
    icon: typeof AlertTriangle;
    title: { tr: string; en: string };
    sub: { tr: string; en: string };
    code: string;
    color: string;
  }
> = {
  '404': {
    icon: AlertTriangle,
    title: { tr: 'Sayfa Bulunamadı', en: 'Page Not Found' },
    sub: {
      tr: 'Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.',
      en: 'The page you are looking for may have moved, been deleted, or never existed.',
    },
    code: '404',
    color: 'text-amber-400',
  },
  '500': {
    icon: ServerCrash,
    title: { tr: 'Sunucu Hatası', en: 'Server Error' },
    sub: {
      tr: 'Geçici bir teknik sorun yaşıyoruz. Lütfen birkaç dakika sonra tekrar deneyin.',
      en: "We're experiencing a temporary technical issue. Please try again in a few minutes.",
    },
    code: '500',
    color: 'text-red-400',
  },
};

const HELPFUL_LINKS = [
  { to: '/', label: { tr: 'Ana Sayfa', en: 'Home' }, icon: Home },
  { to: '/services', label: { tr: 'Hizmetler', en: 'Services' }, icon: ArrowRight },
  { to: '/insights', label: { tr: 'İçgörüler', en: 'Insights' }, icon: ArrowRight },
  { to: '/contact', label: { tr: 'İletişim', en: 'Contact' }, icon: ArrowRight },
];

interface ErrorPageProps {
  type?: ErrorType;
}

function ErrorPageContent({ type = '404' }: ErrorPageProps) {
  const shouldReduce = useReducedMotion();
  const content = ERROR_CONTENT[type];
  const ErrorIcon = content.icon;

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans flex flex-col">
      {/* Minimal nav */}
      <nav
        role="navigation"
        aria-label="Ana navigasyon"
        className="bg-neutral-900 border-b border-slate-800 px-6 h-14 flex items-center"
      >
        <Link to="/" className="text-lg font-bold text-amber-400">
          eCyPro
        </Link>
      </nav>

      {/* Error content */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <motion.div
            {...(shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.95 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.4 },
                })}
          >
            {/* Error code — large decorative */}
            <div
              className={`text-8xl sm:text-9xl font-bold ${content.color} opacity-10 leading-none mb-4 select-none`}
              aria-hidden="true"
            >
              {content.code}
            </div>

            <div className="flex items-center justify-center mb-4 -mt-8">
              <div
                className={`w-16 h-16 rounded-2xl bg-neutral-800 border border-slate-700 flex items-center justify-center`}
              >
                <ErrorIcon size={28} className={content.color} aria-hidden="true" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-3">{content.title.tr}</h1>
            <p className="text-slate-400 leading-relaxed mb-8 text-sm max-w-sm mx-auto">
              {content.sub.tr}
            </p>

            {/* Primary action */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-900 font-semibold rounded-xl transition-colors mb-8"
            >
              <Home size={16} aria-hidden="true" /> Ana Sayfaya Dön
            </Link>

            {/* Helpful links */}
            <div className="border-t border-slate-800 pt-8">
              <p className="text-xs text-slate-500 mb-4">
                Veya bu sayfaları ziyaret edebilirsiniz:
              </p>
              <nav aria-label="Yardımcı bağlantılar">
                <ul className="flex flex-wrap justify-center gap-3">
                  {HELPFUL_LINKS.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <Icon size={13} aria-hidden="true" />
                        {label.tr}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* 500-specific: show status + retry */}
            {type === '500' && (
              <div className="mt-8 bg-neutral-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
                <p>
                  Sorun devam ediyorsa{' '}
                  <Link to="/contact" className="text-amber-400 hover:underline">
                    iletişime geçin
                  </Link>
                  .
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <footer
        role="contentinfo"
        className="bg-neutral-950 border-t border-slate-800 px-6 py-6 text-center"
      >
        <p className="text-xs text-slate-600">© 2026 eCyPro Premium Consulting</p>
      </footer>
    </div>
  );
}

// Named exports for each route — same component, different type prop
export function NotFoundPage() {
  return <ErrorPageContent type="404" />;
}

export function ServerErrorPage() {
  return <ErrorPageContent type="500" />;
}

// Default export shows both for prototype preview
export default function ErrorPagesPrototype() {
  return (
    <div>
      <div className="border-b-4 border-amber-500 pb-2 px-4 pt-4 bg-neutral-950 text-xs text-amber-400 font-mono">
        — 404 Preview —
      </div>
      <ErrorPageContent type="404" />
      <div className="border-b-4 border-red-500 pb-2 px-4 pt-4 bg-neutral-950 text-xs text-red-400 font-mono">
        — 500 Preview —
      </div>
      <ErrorPageContent type="500" />
    </div>
  );
}
