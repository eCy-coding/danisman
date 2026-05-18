/**
 * P51.3 — Calendly embed (env-gated) with fallback to native form.
 *
 * ENV `VITE_CALENDLY_URL` doluysa: iframe embed (e.g. https://calendly.com/emrecanyalcin/discovery-call)
 * Boşsa: existing /contact form CTA fallback.
 *
 * iframe lazy mount: IntersectionObserver ile sadece kullanıcı scroll edince yüklenir
 * (perf — Calendly iframe ~350KB).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { trackDiscoveryCallBook } from '../../lib/integrations/analytics';

const CALENDLY_URL = (import.meta.env.VITE_CALENDLY_URL ?? '').trim();

interface CalendlyEmbedProps {
  source?: string;
  heightPx?: number;
  className?: string;
}

export const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({
  source = 'calendly-embed',
  heightPx = 700,
  className = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (!CALENDLY_URL) return;
    if (!('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }
    const node = wrapperRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Fallback: env yok → contact form CTA
  if (!CALENDLY_URL) {
    return (
      <div
        ref={wrapperRef}
        className={`p-8 md:p-10 bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20 rounded-2xl text-center ${className}`}
        data-testid="calendly-fallback"
      >
        <Calendar size={28} className="text-secondary mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-2xl font-serif font-bold text-white mb-3">Discovery Call Planla</h3>
        <p className="text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
          45 dakikalık ücretsiz keşif görüşmesi. Tarih + saat seçimi için iletişim formundan yazın;
          24 saat içinde Calendly bağlantısı paylaşılır.
        </p>
        <Link
          to="/contact"
          onClick={() => trackDiscoveryCallBook(source)}
          className="inline-flex items-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
        >
          İletişim Formuna Git <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: heightPx }}
      data-testid="calendly-embed"
    >
      {shouldMount ? (
        <iframe
          src={`${CALENDLY_URL}?hide_event_type_details=0&hide_gdpr_banner=1`}
          width="100%"
          height={heightPx}
          frameBorder="0"
          title="Discovery Call — Calendly slot picker"
          loading="lazy"
          onLoad={() => trackDiscoveryCallBook(source)}
        />
      ) : (
        <div
          className="flex items-center justify-center text-slate-400"
          style={{ minHeight: heightPx }}
        >
          <span className="text-sm">Calendly yükleniyor…</span>
        </div>
      )}
    </div>
  );
};
