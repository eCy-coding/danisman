/**
 * P51.1 — Anonymized client grid (NDA-friendly).
 *
 * 8 anonim client card render eder. Sektör + ölçek hint var, gerçek isim YOK.
 * ENV `VITE_DISPLAY_REAL_CLIENT_LOGOS=true` ise public/clients/<slug>.svg
 * gerçek logoları yükler (override).
 */

import React from 'react';
import {
  Factory,
  Building2,
  Cpu,
  ShoppingBag,
  Zap,
  Pill,
  Truck,
  HeartHandshake,
  type LucideIcon,
} from 'lucide-react';
import {
  ANONYMIZED_CLIENTS,
  SHOULD_DISPLAY_REAL_LOGOS,
  type AnonymizedClient,
} from '../../data/clients';

const GLYPH_ICONS: Record<AnonymizedClient['glyph'], LucideIcon> = {
  industry: Factory,
  finance: Building2,
  tech: Cpu,
  retail: ShoppingBag,
  energy: Zap,
  pharma: Pill,
  logistics: Truck,
  ngo: HeartHandshake,
};

export const AnonymizedClientGrid: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <section className={`${className}`} aria-labelledby="anon-clients-heading">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3">
            Engagement Portföyü
          </div>
          <h2
            id="anon-clients-heading"
            className="text-3xl md:text-4xl font-serif font-bold text-white mb-4"
          >
            Çalıştığımız Müşteri Profili
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            NDA gereği gerçek isimler paylaşılmaz; aşağıda engagement yürüttüğümüz kurumların anonim
            sektör + ölçek profili.
          </p>
        </div>
        <ul
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          aria-label="Anonim müşteri sektör + ölçek profili"
        >
          {ANONYMIZED_CLIENTS.map((c) => {
            const Icon = GLYPH_ICONS[c.glyph];
            // Future: real logo override (when SHOULD_DISPLAY_REAL_LOGOS true)
            const realLogoPath = `/clients/${c.id}.svg`;
            return (
              <li
                key={c.id}
                className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-secondary/30 transition-colors"
              >
                {SHOULD_DISPLAY_REAL_LOGOS ? (
                  <img
                    src={realLogoPath}
                    alt={`${c.sector} müşteri logosu`}
                    width={160}
                    height={48}
                    className="w-full h-12 object-contain mb-3"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Icon size={22} className="text-secondary" aria-hidden="true" />
                  </div>
                )}
                <div className="text-xs font-bold text-white mb-1">{c.sector}</div>
                <div className="text-[10px] text-slate-500 leading-relaxed mb-2">
                  {c.size}
                  <br />
                  {c.region}
                </div>
                {!SHOULD_DISPLAY_REAL_LOGOS && (
                  <span className="inline-block text-[9px] font-bold tracking-widest uppercase text-secondary/70 mt-1">
                    Anonim · NDA
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
