import React from 'react';
import { motion } from 'motion/react';
import { Award } from 'lucide-react';
import { FadeIn } from '../common/FadeIn';
import { TRUST_LOGOS } from '../../constants';
import { useTranslation } from 'react-i18next';

const TRUSTBAR_COPY = {
  sectionTitle: { tr: 'Güvenenler', en: 'Trusted By' },
};

// Anonymized sector badges live under /public/clients/*.svg
// (200×80, mono navy/gold, no glass surface — AI Studio Tech doktrini).

export const TrustBar: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  return (
    <section
      id="trust-bar"
      data-testid="trust-bar"
      className="bg-neutral border-b border-white/5 py-16 lg:py-20 relative overflow-hidden"
      aria-label="Client Logos"
    >
      {/* Subtle top/bottom gradient lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
            <div className="flex flex-col gap-3 shrink-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap pt-2">
                {TRUSTBAR_COPY.sectionTitle[lang]}
              </p>
              {/* Founder badge */}
              <div
                data-testid="trust-bar-founder-badge"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs text-blue-300 font-medium"
              >
                <Award size={12} className="text-primary" aria-hidden="true" />
                <span>Emre Can Yalçın — Founder</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                KVKK & GDPR uyumlu
              </p>
            </div>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12 items-center justify-items-center">
              {TRUST_LOGOS.map((logo, idx) => (
                <motion.div
                  key={logo.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 0.5, y: 0 }}
                  whileHover={{ opacity: 1, scale: 1.1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="group relative flex justify-center w-full cursor-default grayscale hover:grayscale-0 transition-all duration-500"
                  title={logo.alt[lang]}
                >
                  {logo.src ? (
                    <img
                      src={logo.src}
                      alt={logo.alt[lang]}
                      width={120}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  ) : null}

                  {/* Tooltip for Sector */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                    <span className="badge text-secondary bg-neutral/90 border border-white/10 shadow-lg text-[10px]">
                      {logo.sector[lang]}
                    </span>
                  </div>

                  <span className="sr-only">
                    {logo.name} - {logo.sector[lang]}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
