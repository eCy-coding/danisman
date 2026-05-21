/**
 * Track B — floating Discovery Call CTA.
 *
 * Sits above MobileBottomNav on phones (>600px scroll, sm:hidden), and
 * docks bottom-right on tablet/desktop after the same scroll threshold.
 * Hidden on auth / admin / discovery-call / thank-you routes so we don't
 * shout at users who already converted.
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';
import { getCalendlyCta, hasExternalCalendly } from '../../lib/cta/calendly';

const SHOW_AFTER_PX = 600;
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/admin',
  '/verify',
  '/forgot',
  '/discovery-call',
  '/thank-you',
  '/booking',
  '/feedback',
];

export const MobileStickyCTA: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;
  if (!visible) return null;

  const cta = getCalendlyCta('mobile-sticky');
  const label = lang === 'tr' ? 'Discovery Call (30 dk)' : 'Discovery Call (30 min)';
  // sm:bottom positions above MobileBottomNav (h-16 + safe-area) on phones,
  // and floats to the corner on tablet/desktop.
  const sharedClass =
    'fixed z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] sm:bottom-6 right-4 sm:right-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-secondary text-neutral font-semibold text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary/90 transition-all';

  const onClick = () => trackEvent('StickyCTA', 'Click', 'Discovery');

  if (hasExternalCalendly()) {
    return (
      <a
        href={cta.href}
        target={cta.target}
        rel={cta.rel}
        {...cta.dataAttrs}
        data-testid="mobile-sticky-cta"
        onClick={onClick}
        className={sharedClass}
      >
        <Calendar size={16} aria-hidden="true" />
        {label}
      </a>
    );
  }

  return (
    <a
      href={cta.href}
      {...cta.dataAttrs}
      data-testid="mobile-sticky-cta"
      onClick={onClick}
      className={sharedClass}
    >
      <Calendar size={16} aria-hidden="true" />
      {label}
    </a>
  );
};
