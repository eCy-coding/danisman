/**
 * MobileBottomNav — Mobil Sabit Alt Navigasyon
 * istek5.txt Phase 2: UI/UX — Mobile-First Critical Path
 *
 * - Sadece sm:hidden (≤640px ekranlarda görünür)
 * - 4 sekmeli nav: Anasayfa / Hizmetler / İletişim / Randevu Al
 * - Active state: current path ile eşleşen sekme vurgulı
 * - Booking butonu özel vurgulı → /contact + booking scroll
 * - Safe-area-inset: iPhone X ve üstü tam uyumlu (env(safe-area-inset-bottom))
 * - Animate on mount, slide in from bottom
 * - A11y: role="navigation", aria-label, aria-current
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Layers, Mail, CalendarDays } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

interface NavTab {
  id: string;
  icon: React.ElementType;
  label: { tr: string; en: string };
  href: string;
  highlight?: boolean;
  matchPaths?: string[];
}

const TABS: NavTab[] = [
  {
    id: 'home',
    icon: Home,
    label: { tr: 'Anasayfa', en: 'Home' },
    href: '/',
    matchPaths: ['/'],
  },
  {
    id: 'services',
    icon: Layers,
    label: { tr: 'Hizmetler', en: 'Services' },
    href: '/services',
    matchPaths: ['/services', '/service'],
  },
  {
    id: 'contact',
    icon: Mail,
    label: { tr: 'İletişim', en: 'Contact' },
    href: '/contact',
    matchPaths: ['/contact'],
  },
  {
    id: 'booking',
    icon: CalendarDays,
    label: { tr: 'Randevu', en: 'Book Call' },
    href: '/contact?source=mobile-nav',
    highlight: true,
    matchPaths: ['/booking'],
  },
];

const HIDDEN_PATHS = ['/login', '/admin', '/register', '/verify', '/forgot', '/antigravity'];

function isActive(tab: NavTab, pathname: string): boolean {
  if (tab.id === 'home') return pathname === '/';
  return (tab.matchPaths ?? []).some((p) => pathname.startsWith(p));
}

export const MobileBottomNav: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldHide = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));
  if (shouldHide || !mounted) return null;

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
      role="navigation"
      aria-label={lang === 'tr' ? 'Mobil alt navigasyon' : 'Mobile bottom navigation'}
      data-testid="mobile-bottom-nav"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Blur backdrop */}
      <div className="bg-[#080d1a]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="flex items-stretch h-16">
          {TABS.map((tab) => {
            const active = isActive(tab, location.pathname);
            const Icon = tab.icon;

            if (tab.highlight) {
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  onClick={() => trackEvent('MobileNav', 'Click', tab.id)}
                  aria-label={lang === 'tr' ? tab.label.tr : tab.label.en}
                  aria-current={active ? 'page' : undefined}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
                >
                  {/* Highlight booking tab */}
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/30">
                    <Icon size={18} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="text-[9px] font-semibold text-secondary leading-none">
                    {lang === 'tr' ? tab.label.tr : tab.label.en}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.id}
                to={tab.href}
                onClick={() => trackEvent('MobileNav', 'Click', tab.id)}
                aria-label={lang === 'tr' ? tab.label.tr : tab.label.en}
                aria-current={active ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-secondary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Active indicator dot */}
                {active && (
                  <div
                    className="absolute top-0 w-1 h-1 rounded-full bg-secondary translate-y-1"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={20}
                  className={`transition-all ${active ? 'scale-110' : ''}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-[9px] font-medium leading-none ${active ? 'text-secondary' : ''}`}
                >
                  {lang === 'tr' ? tab.label.tr : tab.label.en}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
