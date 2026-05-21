/**
 * P53.E2 — Exit Intent Modal.
 *
 * Desktop: mouse cursor üst kenara (clientY < 5) hareket edince trigger.
 * Mobile: scroll-back-to-top (deltaY < -50) trigger.
 * Show ONCE per session (sessionStorage flag).
 * Offer: "Önce bir konuşalım — Ücretsiz Discovery Call".
 * KVKK-aware: kapatılınca tekrar göstermez (frustration azalt).
 *
 * Mevcut bir ExitIntentModal varsa P45'te (P45 B5 öncesi) — yeni versiyon
 * conversion-optimized + P52 telefonla entegrasyon + WhatsApp.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { CONTACT_CONFIG } from '../../constants';
import { trackCtaClick } from '../../lib/integrations/analytics';

const STORAGE_KEY = 'ecypro:exit-intent-shown';

export const ExitIntentModalP53: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already shown this session?
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* sessionStorage blocked */
    }

    let lastScrollY = window.scrollY;

    const show = () => {
      setVisible(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      // Desktop: only top edge trigger
      if (e.clientY <= 0 && window.innerWidth > 768) {
        show();
        cleanup();
      }
    };

    const onScroll = () => {
      // Mobile: rapid upward scroll
      if (window.innerWidth <= 768) {
        const delta = window.scrollY - lastScrollY;
        if (delta < -80 && window.scrollY > 200) {
          show();
          cleanup();
        }
        lastScrollY = window.scrollY;
      }
    };

    const cleanup = () => {
      document.removeEventListener('mouseout', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };

    document.addEventListener('mouseout', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });

    return cleanup;
  }, []);

  const onClose = () => {
    setVisible(false);
    trackCtaClick('exit-intent-dismiss', 'modal');
  };

  if (!visible) return null;

  return (
    // Modal backdrop click-outside-to-close. Keyboard users dismiss via the
    // explicit close button below (Tab-focusable). The eslint-disable
    // matches the carve-out documented in eslint.config.js header.
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Stop-propagation guard so clicks inside the panel don't close it.
          Pure event-bubbling defense — no interactive semantics. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="relative max-w-md w-full bg-neutral border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-3 right-3 w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center text-slate-400"
        >
          <X size={18} />
        </button>
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/15 border border-secondary/30 mb-5">
            <Sparkles size={24} className="text-secondary" aria-hidden="true" />
          </div>
          <h2
            id="exit-intent-title"
            className="text-2xl md:text-3xl font-serif font-bold text-white mb-3"
          >
            Önce bir konuşalım
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            45 dakikalık <strong className="text-white">ücretsiz Discovery Call</strong> ile
            durumunuzu birlikte değerlendirelim. Engagement uyumunu görür, 5-7 gün içinde yazılı
            önergeyi iletiriz.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/contact"
              onClick={() => {
                trackCtaClick('exit-intent-discovery', 'modal');
                onClose();
              }}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 min-h-[48px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
            >
              Discovery Call Planla <ArrowRight size={16} />
            </Link>
            {CONTACT_CONFIG.whatsapp && (
              <a
                href={CONTACT_CONFIG.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackCtaClick('exit-intent-whatsapp', 'modal');
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 min-h-[48px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                <MessageCircle size={16} /> WhatsApp ile Yaz
              </a>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-5 italic">
            Şu an vakit yoksa:{' '}
            <a href="mailto:info@ecypro.com" className="text-secondary hover:underline">
              info@ecypro.com
            </a>{' '}
            üzerinden de yazabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};
