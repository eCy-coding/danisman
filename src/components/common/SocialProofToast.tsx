/**
 * SocialProofToast — Gerçek zamanlı sosyal kanıt bildirimleri
 * istek5.txt Phase 2: UI/UX — Conversion Critical
 *
 * - "Emre İstanbul'dan danışmanlık randevusu aldı" tarzı toast'lar
 * - 10s aralıklarla döngüsel gösterim (backend + fallback seed data)
 * - `/api/crm/leads/hot` son aktivite → gerçek isim/şehir
 * - Reduced motion uyumlu, A11y: role=status, aria-live=polite
 * - localStorage `sp_toast_dismissed` 24h → kullanıcı kapatabilir
 * - Yalnızca landing, services, pricing, blog sayfalarında görünür
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Users, X, TrendingUp, Calendar, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';

interface ProofItem {
  id: string;
  nameInitial: string;
  city: string;
  action: { tr: string; en: string };
  time: { tr: string; en: string };
  icon: React.ElementType;
  color: string;
}

// P42: Sahte "X kişi şunu yaptı" toast'ları kaldırıldı.
// Yerine: gerçek içerik feed'i — son blog yazıları / engagement temaları.
// Hiçbir öğe "anlık bir kişi" iddiası taşımaz; tema-bazlı, dürüst.
const SEED_DATA: ProofItem[] = [
  {
    id: 's1',
    nameInitial: '·',
    city: 'eCyPro',
    action: {
      tr: 'Stratejik dijital dönüşüm rehberi yayında',
      en: 'Strategic digital transformation playbook is live',
    },
    time: { tr: 'Yeni içerik', en: 'New insight' },
    icon: TrendingUp,
    color: 'text-secondary',
  },
  {
    id: 's2',
    nameInitial: '·',
    city: 'eCyPro',
    action: {
      tr: 'Aile şirketlerinde kuşak geçişi — pratik notlar',
      en: 'Generational transition in family firms — practical notes',
    },
    time: { tr: 'Yeni içerik', en: 'New insight' },
    icon: Users,
    color: 'text-emerald-400',
  },
  {
    id: 's3',
    nameInitial: '·',
    city: 'eCyPro',
    action: {
      tr: 'Lean & AI birleşimi: operasyonel mükemmellik',
      en: 'Lean & AI convergence: operational excellence',
    },
    time: { tr: 'Yeni içerik', en: 'New insight' },
    icon: Star,
    color: 'text-amber-400',
  },
  {
    id: 's4',
    nameInitial: '·',
    city: 'eCyPro',
    action: {
      tr: 'Yönetim kurulu çevikliği — belirsizlik çağı',
      en: 'Boardroom agility — in the age of uncertainty',
    },
    time: { tr: 'Yeni içerik', en: 'New insight' },
    icon: Calendar,
    color: 'text-violet-400',
  },
];

const SHOW_ON_PATHS = ['/', '/services', '/pricing', '/about', '/perspektifler'];
const DISMISS_KEY = 'sp_toast_dismissed';
const DISMISS_TTL = 24 * 60 * 60 * 1000;
const INTERVAL_MS = 10_000;
const SHOW_DURATION_MS = 7_000;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL;
  } catch {
    return false;
  }
}

export const SocialProofToast: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  const [current, setCurrent] = useState<ProofItem | null>(null);
  const [dismissed, setDismissed] = useState(true); // SSR-safe: start hidden
  const [visible, setVisible] = useState(false);
  const indexRef = useRef(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init client-side
  useEffect(() => {
    setDismissed(isDismissed());
  }, []);

  const showNext = useCallback(() => {
    const item = SEED_DATA[indexRef.current % SEED_DATA.length] ?? SEED_DATA[0]!;
    indexRef.current++;
    setCurrent(item);
    setVisible(true);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => setVisible(false), SHOW_DURATION_MS);
  }, []);

  const shouldShow = SHOW_ON_PATHS.some((p) =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p),
  );

  useEffect(() => {
    if (dismissed || !shouldShow) return;

    // First show after 5s
    const firstTimer = setTimeout(showNext, 5_000);
    // Then repeat every INTERVAL_MS
    intervalRef.current = setInterval(showNext, INTERVAL_MS);

    return () => {
      clearTimeout(firstTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [dismissed, shouldShow, showNext]);

  const handleDismiss = (): void => {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (dismissed || !shouldShow || !current) return null;

  const Icon = current.icon;

  return (
    <div
      className="fixed bottom-24 left-4 sm:left-6 z-50 pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key={current.id}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -10, y: -5 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            data-testid="social-proof-toast"
            className="pointer-events-auto max-w-xs bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl p-4 flex items-start gap-3"
          >
            {/* Icon */}
            <div
              className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${current.color}`}
            >
              <Icon size={16} aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium leading-snug">
                <span className="font-semibold">{current.nameInitial}</span>{' '}
                <span className="text-slate-300">
                  {lang === 'tr' ? current.action.tr : current.action.en}
                </span>
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                  aria-hidden="true"
                />
                <span className="text-[10px] text-slate-500">
                  {current.city} · {lang === 'tr' ? current.time.tr : current.time.en}
                </span>
              </div>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Kapat"
              className="shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-slate-600 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
