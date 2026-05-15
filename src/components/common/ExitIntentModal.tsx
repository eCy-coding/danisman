/**
 * ExitIntentModal — Çıkış Niyeti Lead Magnet Popup
 * istek5.txt Phase 2: UI/UX — Exit Intent Lead Capture
 *
 * Tetikleyiciler:
 *  - Mouse viewport'un üst %10'una girince (desktop exit intent)
 *  - 60s pasif kalma (mobil fallback)
 *  - Sadece 1x gösterilir: localStorage `exit_intent_shown`
 *
 * İçerik:
 *  - Ücretsiz "30 dakika Stratejik Danışmanlık" teklifi
 *  - Email form → POST /api/newsletter/subscribe + source=exit-intent
 *  - Success state → teşekkür mesajı
 *
 * Conversion pattern: Lead magnet (ücretsiz değer) exchange for email
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Gift, CheckCircle, Send, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

const SHOWN_KEY = 'exit_intent_shown';
const PASSIVE_TIMEOUT_MS = 60_000;
const EXIT_THRESHOLD_PX = 20; // px from top

const SHOWN_ON_PATHS = ['/', '/services', '/pricing'];

function markShown(): void {
  try {
    localStorage.setItem(SHOWN_KEY, '1');
  } catch {
    /* ignore */
  }
}

function isAlreadyShown(): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) === '1';
  } catch {
    return false;
  }
}

export const ExitIntentModal: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const passiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  // A11y: focus management — capture trigger element to restore focus on close,
  // and seed initial focus on the modal's first interactive element when shown.
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const shouldMount = SHOWN_ON_PATHS.some((p) =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p),
  );

  const trigger = (): void => {
    if (triggeredRef.current || isAlreadyShown()) return;
    triggeredRef.current = true;
    markShown();
    setOpen(true);
    trackEvent('ExitIntent', 'Trigger', location.pathname);
  };

  // Desktop: mouse leave detection
  useEffect(() => {
    if (!shouldMount) return;

    const handleMouseMove = (e: MouseEvent): void => {
      if (e.clientY < EXIT_THRESHOLD_PX) {
        trigger();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMount]);

  // Mobile / passive: 60s timeout
  useEffect(() => {
    if (!shouldMount) return;

    passiveTimerRef.current = setTimeout(trigger, PASSIVE_TIMEOUT_MS);
    return () => {
      if (passiveTimerRef.current) clearTimeout(passiveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMount]);

  const handleClose = (): void => {
    setOpen(false);
    trackEvent('ExitIntent', 'Close', 'modal');
  };

  // A11y: keyboard + focus management lifecycle for the dialog.
  useEffect(() => {
    if (!open) return;

    // Stash the element that was focused before the modal opened so we can
    // restore focus when the user closes it (WCAG 2.4.3 Focus Order).
    previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;

    // Seed initial focus on the dismiss button — it is always present in both
    // success and form states, so it's a reliable focus anchor.
    const seedFocus = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
        return;
      }
      // Minimal focus trap: cycle Tab inside the dialog only.
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(seedFocus);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that opened the modal so screen readers
      // and keyboard users land back in context.
      previousFocusRef.current?.focus?.();
    };
    // handleClose is stable (closure over setOpen/trackEvent only).
  }, [open]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    trackEvent('ExitIntent', 'Submit', email);

    try {
      const baseUrl =
        (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: true, source: 'exit-intent' }),
      });
      if (!res.ok) throw new Error('subscribe_failed');
      setStatus('success');
      trackEvent('ExitIntent', 'Subscribe', 'success');
    } catch {
      setStatus('error');
      setErrorMsg(
        lang === 'tr'
          ? 'Bir hata oluştu. Tekrar deneyin.'
          : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'tr' ? 'Ücretsiz danışmanlık teklifi' : 'Free consultation offer'}
            data-testid="exit-intent-modal"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-61 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto relative w-full max-w-lg bg-[#0a0f1e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {/* Gradient accent top */}
              <div
                className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-secondary to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative p-8">
                {/* Close */}
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={handleClose}
                  aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
                  className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <X size={18} aria-hidden="true" />
                </button>

                {status === 'success' ? (
                  // Success state
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <CheckCircle className="w-8 h-8 text-emerald-400" aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl font-serif text-white mb-3">
                      {lang === 'tr' ? 'Harika! Görüşmek üzere.' : 'Great! Talk soon.'}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {lang === 'tr'
                        ? 'E-posta adresinize detayları gönderdik. 24 saat içinde size ulaşacağız.'
                        : "We sent details to your email. We'll reach out within 24 hours."}
                    </p>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
                    >
                      {lang === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                  </div>
                ) : (
                  // Lead capture form
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                        <Gift className="w-6 h-6 text-secondary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">
                          {lang === 'tr' ? 'Ücretsiz Teklif' : 'Free Offer'}
                        </p>
                        <h2 className="text-xl sm:text-2xl font-serif text-white leading-tight">
                          {lang === 'tr'
                            ? '30 Dakika Ücretsiz Strateji Görüşmesi'
                            : '30-Min Free Strategy Session'}
                        </h2>
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      {lang === 'tr'
                        ? 'Danışmanlarımızdan biriyle ücretsiz 30 dakikalık bir görüşme alın. İşletmenizin büyüme potansiyelini değerlendirin.'
                        : 'Get a free 30-minute session with one of our consultants. Assess your business growth potential — no strings attached.'}
                    </p>

                    {/* Bullets */}
                    <ul className="space-y-2 mb-6">
                      {(lang === 'tr'
                        ? [
                            'Büyüme fırsatlarını belirleyin',
                            'Özel yol haritası taslağı',
                            'Hiçbir yükümlülük yok',
                          ]
                        : [
                            'Identify growth opportunities',
                            'Custom roadmap outline',
                            'No obligation, cancel anytime',
                          ]
                      ).map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle
                            size={14}
                            className="text-emerald-400 shrink-0"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Form */}
                    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={lang === 'tr' ? 'kurumsal@email.com' : 'work@email.com'}
                        aria-label={lang === 'tr' ? 'Email adresi' : 'Email address'}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary transition-colors"
                      />

                      {status === 'error' && (
                        <p role="alert" className="text-xs text-rose-400">
                          {errorMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!email || status === 'loading'}
                        className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-neutral font-semibold py-3 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      >
                        {status === 'loading' ? (
                          <div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <>
                            <Send size={15} aria-hidden="true" />
                            {lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Claim Free Session'}
                            <ArrowRight size={15} aria-hidden="true" />
                          </>
                        )}
                      </button>
                      <p className="text-center text-[10px] text-slate-600">
                        {lang === 'tr'
                          ? 'KVKK kapsamında verileriniz korunur. Spam yok.'
                          : 'GDPR compliant. Zero spam, ever.'}
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
