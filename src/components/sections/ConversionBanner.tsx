/**
 * ConversionBanner — Tam Genişlik Dönüşüm CTA Şeridi
 * istek5.txt Phase 2: UI/UX — Mid-Page Conversion (Critical)
 *
 * Yerleştirme: LandingContent'te SuccessStories sonrası, Pricing sayfasında
 *
 * Özellikler:
 * - Gradient arka plan + animated glow orbs
 * - İstatistik satırı (müşteri sayısı, ortalama ROI, başarı oranı)
 * - Birincil CTA: "Ücretsiz Görüşme Ayarla" → /contact
 * - İkincil CTA: "Fiyatlandırmayı Gör" → /pricing
 * - Sağ: sosyal kanıt avatar kuyruk + "X+ mutlu müşteri"
 * - Variant prop: 'primary' (mavi) | 'dark' (koyu) | 'accent' (gradient)
 * - A/B test hazır: variant prop + data-variant attr
 * - i18n (tr/en), A11y: section + landmark
 * - Reduced motion uyumlu
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Calendar, TrendingUp, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

type BannerVariant = 'primary' | 'dark' | 'accent';

interface ConversionBannerProps {
  variant?: BannerVariant;
  showStats?: boolean;
  primaryCta?: { tr: string; en: string; href: string };
  secondaryCta?: { tr: string; en: string; href: string };
  headline?: { tr: string; en: string };
  subline?: { tr: string; en: string };
}

const STATS = [
  { icon: Users, value: '5+', label: { tr: 'Yıl Deneyim', en: 'Years of Practice' } },
  { icon: TrendingUp, value: '120+', label: { tr: 'Stratejik Karar', en: 'Strategic Decisions' } },
  { icon: Star, value: '12+', label: { tr: 'Sektör', en: 'Sectors Served' } },
];

const VARIANT_STYLES: Record<BannerVariant, string> = {
  primary: 'bg-linear-to-br from-primary/20 via-secondary/10 to-transparent border-primary/20',
  dark: 'bg-linear-to-br from-[#0a0f1e] via-[#080d1a] to-[#060a15] border-white/10',
  accent: 'bg-linear-to-r from-secondary/20 via-primary/15 to-violet-500/10 border-secondary/20',
};

export const ConversionBanner: React.FC<ConversionBannerProps> = ({
  variant = 'accent',
  showStats = true,
  primaryCta = { tr: 'Ücretsiz Görüşme Ayarla', en: 'Book a Free Call', href: '/contact' },
  secondaryCta = { tr: 'Fiyatlandırmayı Gör', en: 'View Pricing', href: '/pricing' },
  headline = {
    tr: 'Stratejik dönüşüme bir oturum uzaktasınız.',
    en: "You're one session away from strategic clarity.",
  },
  subline = {
    tr: 'Ücretsiz keşif görüşmesinde organizasyonunuza özel yol haritasını birlikte konuşalım.',
    en: "In a free discovery call we'll map out a roadmap tailored to your organization.",
  },
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReduced = useReducedMotion();

  return (
    <section
      data-testid="conversion-banner"
      data-variant={variant}
      aria-label={lang === 'tr' ? 'Dönüşüm daveti' : 'Conversion call to action'}
      className={`relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-auto lg:max-w-6xl my-8 border ${VARIANT_STYLES[variant]}`}
    >
      {/* Background orbs */}
      {!prefersReduced && (
        <>
          <div
            className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -right-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left content (3/5) */}
          <div className="lg:col-span-3">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-xs font-mono uppercase tracking-widest text-secondary mb-3"
            >
              {lang === 'tr' ? 'Hemen Başlayın' : 'Get Started Today'}
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white leading-tight mb-4"
            >
              {lang === 'tr' ? headline.tr : headline.en}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6"
            >
              {lang === 'tr' ? subline.tr : subline.en}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to={primaryCta.href}
                onClick={() => trackEvent('ConversionBanner', 'Click', 'primary-cta')}
                data-testid="conversion-banner-primary-cta"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-neutral font-semibold px-6 py-3 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary shadow-lg shadow-secondary/20 hover:shadow-secondary/40"
              >
                <Calendar size={16} aria-hidden="true" />
                {lang === 'tr' ? primaryCta.tr : primaryCta.en}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>

              <Link
                to={secondaryCta.href}
                onClick={() => trackEvent('ConversionBanner', 'Click', 'secondary-cta')}
                data-testid="conversion-banner-secondary-cta"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-medium px-6 py-3 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                {lang === 'tr' ? secondaryCta.tr : secondaryCta.en}
              </Link>
            </motion.div>
          </div>

          {/* Right stats (2/5) */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.value}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/8 hover:border-white/15 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-secondary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lang === 'tr' ? stat.label.tr : stat.label.en}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Avatar queue */}
              <div className="flex items-center gap-3 pt-1 pl-1">
                <div className="flex -space-x-2.5">
                  {['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-[#080d1a] flex items-center justify-center text-xs text-white font-semibold"
                      style={{ background: c }}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'tr' ? '+120 memnun müşteri' : '+120 satisfied clients'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
