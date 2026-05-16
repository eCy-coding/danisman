import React from 'react';
import { motion } from 'motion/react';
import { FadeIn } from '../common/FadeIn';
import { TRUST_LOGOS } from '../../constants';
import { useTranslation } from 'react-i18next';

const TRUSTBAR_COPY = {
  sectionTitle: { tr: 'Güvenenler', en: 'Trusted By' },
};

// Simulating distinct SVG logos for different industries
const renderLogo = (id: string, className: string) => {
  switch (id) {
    case 'l1': // Holding (Geometric/Solid)
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <path d="M10 10 L30 10 L30 30 L10 30 Z" />
          <path d="M35 10 L55 10 L55 30 L35 30 Z" />
          <rect x="65" y="16" width="50" height="8" rx="1" />
        </svg>
      );
    case 'l2': // Finance (Stability/Pillars)
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="28" width="40" height="4" />
          <rect x="10" y="12" width="6" height="16" />
          <rect x="22" y="12" width="6" height="16" />
          <rect x="34" y="12" width="6" height="16" />
          <path d="M25 4 L48 12 L2 12 Z" />
          <rect x="55" y="14" width="60" height="10" rx="2" />
        </svg>
      );
    case 'l3': // Construction (Structure)
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <path d="M10 30 L10 10 L30 30 Z" />
          <rect x="35" y="14" width="70" height="12" rx="0" />
        </svg>
      );
    case 'l4': // Tech (Nodes/Connections)
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="20" r="6" />
          <circle cx="35" cy="10" r="4" />
          <circle cx="35" cy="30" r="4" />
          <line x1="16" y1="20" x2="31" y2="10" stroke="currentColor" strokeWidth="2" />
          <line x1="16" y1="20" x2="31" y2="30" stroke="currentColor" strokeWidth="2" />
          <rect x="50" y="16" width="60" height="8" rx="4" />
        </svg>
      );
    case 'l5': // Retail (Cart/Bag/Simple)
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <path d="M10 10 C10 10, 15 30, 25 30 C35 30, 40 10, 40 10" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="50" y="14" width="60" height="10" rx="2" />
        </svg>
      );
    default:
      return (
        <svg width="120" height="40" viewBox="0 0 120 40" className={`fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="8" width="24" height="24" rx="4" />
          <rect x="32" y="14" width="80" height="12" rx="2" />
        </svg>
      );
  }
};

export const TrustBar: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  return (
    <section
      id="trust-bar"
      className="bg-neutral border-b border-white/5 py-16 lg:py-20 relative overflow-hidden"
      aria-label="Client Logos"
    >
      {/* Subtle top/bottom gradient lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap pt-2">
              {TRUSTBAR_COPY.sectionTitle[lang]}
            </p>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 items-center justify-items-center">
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
                  {renderLogo(
                    logo.id,
                    'text-slate-400 group-hover:text-white transition-colors duration-500 h-8 w-auto',
                  )}

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
