/**
 * P53.E5 — Mobile-only sticky bottom CTA bar.
 *
 * Desktop'ta gizli. Mobil ziyaretçi için ekranın altında sabit, 2 CTA:
 *   1. Ücretsiz Görüşme → /contact
 *   2. Hizmetler → /services
 *
 * Scroll trigger: 600px sonrası fade-in.
 * Admin/auth route'larda gizli.
 * sessionStorage dismiss flag yok (kalıcı navigation aid).
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Briefcase } from 'lucide-react';
import { trackCtaClick } from '../../lib/integrations/analytics';

const HIDDEN_PATHS = [
  '/admin',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/booking/manage',
  '/feedback/',
  '/404',
];

export const MobileCtaBar: React.FC = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide on admin/auth routes
  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  // Hide on /contact itself (already there)
  if (pathname === '/contact') return null;

  if (!visible) return null;

  return (
    <nav
      aria-label="Hızlı erişim"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral/95 backdrop-blur-sm border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
      data-testid="mobile-cta-bar"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex gap-2 p-2">
        <Link
          to="/contact"
          data-track="discovery-cta"
          onClick={() => trackCtaClick('mobile-cta-discovery', pathname)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-h-[48px] rounded-xl bg-secondary text-neutral font-bold text-sm hover:bg-secondary/90 transition-colors"
        >
          <Sparkles size={14} aria-hidden="true" /> Ücretsiz Görüşme
        </Link>
        <Link
          to="/services"
          onClick={() => trackCtaClick('mobile-cta-services', pathname)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 min-h-[48px] rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
        >
          <Briefcase size={14} aria-hidden="true" /> Hizmetler
        </Link>
      </div>
    </nav>
  );
};
