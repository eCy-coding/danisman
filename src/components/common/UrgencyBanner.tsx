/**
 * UrgencyBanner — Kıtlık + Geri Sayım Sayacı (Conversion Critical)
 * istek5.txt Phase 2: UI/UX — Scarcity / Urgency
 *
 * - "Bu ay sadece X slot kaldı" + canlı geri sayım
 * - Slot sayısı: localStorage cache'den (yoksa 3-5 arası random seed)
 * - Haftalık sıfırlama: Pazartesi 00:00'a kadar geri sayım
 * - Dismiss → localStorage `urgency_dismissed` 4h
 * - Renk: slot > 2 → amber, slot ≤ 2 → kırmızı (urgency artar)
 * - Klavye erişilebilir, ARIA role="status"
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Flame, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';

const DISMISS_KEY = 'urgency_dismissed';
const SLOTS_KEY = 'urgency_slots';
const DISMISS_TTL = 4 * 60 * 60 * 1000; // 4h

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function padZ(n: number): string {
  return String(n).padStart(2, '0');
}

function formatCountdown(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, ms);
  const s = Math.floor((total / 1000) % 60);
  const m = Math.floor((total / (1000 * 60)) % 60);
  const h = Math.floor(total / (1000 * 60 * 60));
  return { h: padZ(h), m: padZ(m), s: padZ(s) };
}

function getSlotsLeft(): number {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) return Math.max(1, Math.min(5, Number(raw)));
  } catch {
    /* ignore */
  }
  // Deterministic seed from week number
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return 2 + (week % 3); // 2, 3, or 4
}

function checkDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL;
  } catch {
    return false;
  }
}

export const UrgencyBanner: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReduced = useReducedMotion();

  const [dismissed, setDismissed] = useState(true); // SSR-safe
  const [slots, setSlots] = useState(3);
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' });
  const [target] = useState<Date>(() => getNextMonday());

  // Client init — D-6 (BUG-08): the banner is for RETURNING visitors only and
  // auto-dismisses after 8s so it never competes with the chat bubble. The
  // first visit only plants the marker.
  useEffect(() => {
    let returning = false;
    try {
      returning = localStorage.getItem('ecypro_visited') === '1';
      localStorage.setItem('ecypro_visited', '1');
    } catch {
      /* private mode → treat as first visit */
    }
    setDismissed(!returning || checkDismissed());
    setSlots(getSlotsLeft());
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const id = window.setTimeout(() => setDismissed(true), 8000);
    return () => window.clearTimeout(id);
  }, [dismissed]);

  const tick = useCallback(() => {
    const ms = target.getTime() - Date.now();
    setCountdown(formatCountdown(ms));
  }, [target]);

  useEffect(() => {
    if (dismissed) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dismissed, tick]);

  const handleDismiss = (): void => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  const isCritical = slots <= 2;
  const bgClass = isCritical
    ? 'bg-linear-to-r from-rose-950/80 via-rose-900/60 to-transparent border-rose-500/30'
    : 'bg-linear-to-r from-amber-950/80 via-amber-900/60 to-transparent border-amber-500/30';
  const accentClass = isCritical ? 'text-rose-300' : 'text-amber-300';
  const Icon = isCritical ? Flame : AlertCircle;

  return (
    <AnimatePresence>
      <motion.div
        key="urgency-banner"
        initial={prefersReduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={prefersReduced ? undefined : { y: -20, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="status"
        aria-live="polite"
        aria-label={lang === 'tr' ? 'Aciliyet bildirimi' : 'Urgency notice'}
        data-testid="urgency-banner"
        className={`relative z-30 border-b ${bgClass}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
          {/* Left */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Icon className={`w-4 h-4 ${accentClass} shrink-0`} aria-hidden="true" />
            <span className={`text-xs sm:text-sm font-medium ${accentClass}`}>
              {lang === 'tr'
                ? `Bu ay yalnızca ${slots} danışmanlık slotu kaldı!`
                : `Only ${slots} consulting slots left this month!`}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">—</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {lang === 'tr' ? 'Yenileme:' : 'Resets in:'}
            </span>

            {/* Countdown */}
            <div
              className="flex items-center gap-1 font-mono text-xs"
              aria-label={lang === 'tr' ? 'Geri sayım' : 'Countdown'}
            >
              {[countdown.h, countdown.m, countdown.s].map((unit, i) => (
                <React.Fragment key={i}>
                  <span
                    className={`inline-flex items-center justify-center w-7 h-6 rounded-md bg-white/10 border border-white/10 ${accentClass} font-semibold text-xs`}
                  >
                    {unit}
                  </span>
                  {i < 2 && <span className={`${accentClass} font-bold text-xs`}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                isCritical
                  ? 'border-rose-400/50 text-rose-300 hover:bg-rose-400/10'
                  : 'border-amber-400/50 text-amber-300 hover:bg-amber-400/10'
              } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current`}
              data-testid="urgency-cta"
            >
              {lang === 'tr' ? 'Hemen Rezervasyon Yap →' : 'Book Now →'}
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
