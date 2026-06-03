import React from 'react';
import { CalendarDays, ArrowRight, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { FadeIn } from '../common/FadeIn';
import { getCalendlyCta } from '../../lib/cta/calendly';

const BOOKING_COPY = {
  badge: { tr: 'Ücretsiz Keşif Görüşmesi', en: 'Free Discovery Call' },
  title: { tr: 'İşletmenizi Dönüştürmeye Hazır mısınız?', en: 'Ready to Transform Your Business?' },
  description: {
    tr: 'Kıdemli danışmanlarımızla 30 dakikalık keşif oturumu ayırtın. Taahhüt yok — sadece aksiyona dönüştürülebilir içgörüler.',
    en: 'Book a 30-minute discovery session with our senior consultants. No commitment required — just actionable insights.',
  },
  features: {
    tr: [
      'Anlık mantık boşluğu analizi',
      'Teknoloji yığını incelemesi',
      'Projeniz için ROI projeksiyonu',
      'Güvenlik & uyumluluk hızlı kontrol',
    ],
    en: [
      'Instant logic gap analysis',
      'Technology stack review',
      'ROI projection for your project',
      'Security & compliance quick-check',
    ],
  },
  calendarTitle: { tr: 'Tarih & Saat Seçin', en: 'Select a Date & Time' },
  calendarSubtitle: { tr: 'Calendly entegrasyonu hazır', en: 'Calendly integration ready' },
  openCalendar: { tr: 'Takvimi Aç', en: 'Open Calendar' },
  bookVia: { tr: 'Calendly ile Randevu Al', en: 'Book via Calendly' },
};

const checklistVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.4 + i * 0.12, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export const Booking: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const cta = getCalendlyCta('booking-section');

  return (
    <section
      id="booking"
      className="py-24 lg:py-32 bg-neutral relative overflow-hidden border-t border-white/5"
    >
      {/* Background Ambient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 blur-3xl rounded-full pointer-events-none -translate-x-1/2 translate-y-1/2"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Value Prop */}
          <div className="space-y-8">
            <FadeIn>
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-secondary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                <CalendarDays className="w-4 h-4" />
                <span>{BOOKING_COPY.badge[lang]}</span>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h2 className="text-4xl sm:text-5xl font-sans font-medium text-white tracking-tight leading-tight">
                {BOOKING_COPY.title[lang]}
              </h2>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-xl text-slate-300 leading-relaxed font-light">
                {BOOKING_COPY.description[lang]}
              </p>
            </FadeIn>

            <ul className="space-y-4 pt-2">
              {BOOKING_COPY.features[lang].map((item, idx) => (
                <motion.li
                  key={idx}
                  custom={idx}
                  variants={checklistVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center space-x-3 text-slate-200"
                >
                  <div className="p-1.5 bg-secondary/20 rounded-full border border-secondary/30 shrink-0">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA Mobile */}
            <FadeIn delay={400} className="pt-4 lg:hidden">
              <a
                href={cta.href}
                target={cta.target}
                rel={cta.rel}
                {...cta.dataAttrs}
                className="flex w-full items-center justify-center space-x-2 btn-premium-gold py-4 text-sm"
              >
                <span>{BOOKING_COPY.bookVia[lang]}</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </FadeIn>
          </div>

          {/* Right: Calendar Widget */}
          <FadeIn delay={300} className="hidden lg:block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative"
            >
              <div className="glass-card rounded-3xl p-2 shadow-2xl">
                <div className="aspect-4/3 w-full bg-white/5 rounded-2xl flex flex-col items-center justify-center space-y-6 border border-dashed border-white/10">
                  {/* Animated Calendar Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 rgba(217,119,6,0)',
                        '0 0 30px rgba(217,119,6,0.3)',
                        '0 0 0 rgba(217,119,6,0)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10"
                  >
                    <CalendarDays className="w-10 h-10 text-secondary" />
                  </motion.div>

                  <div className="text-center space-y-2">
                    <h3 className="font-sans font-semibold text-white text-lg">
                      {BOOKING_COPY.calendarTitle[lang]}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 justify-center">
                      <Sparkles size={14} className="text-secondary" />
                      {BOOKING_COPY.calendarSubtitle[lang]}
                    </p>
                  </div>

                  <a
                    href={cta.href}
                    target={cta.target}
                    rel={cta.rel}
                    {...cta.dataAttrs}
                    className="mt-4 px-8 py-3 btn-premium text-xs tracking-wider uppercase flex items-center space-x-2"
                  >
                    <span>{BOOKING_COPY.openCalendar[lang]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Decor Blobs */}
              <div
                className="absolute -bottom-8 -right-8 w-32 h-32 bg-secondary/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -top-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />
            </motion.div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
