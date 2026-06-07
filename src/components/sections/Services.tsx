import React from 'react';
import { useTranslation } from 'react-i18next';
import { SERVICES } from '../../data/services';
import { ServiceCard } from '../services/ServiceCard';
import { Service } from '../../schemas/service';
import { FadeIn } from '../common/FadeIn';

const SERVICES_COPY = {
  badge: { tr: 'Hizmetlerimiz', en: 'Our Services' },
  title: { tr: 'Uzmanlık Alanlarımız', en: 'Our Expertise' },
  subtitle: {
    tr: 'Stratejik danışmanlık ve yenilikçi çözümlerle işletmenizi geleceğe taşıyoruz.',
    en: 'We drive your business forward with strategic consulting and innovative solutions.',
  },
};

// R7-A4 — Framer container/card variants (staggerChildren + per-card spring)
// replaced with a CSS keyframe + per-card animation-delay. Eliminates 6×
// motion.div reveal subscriptions + viewport observer churn on a section
// that was previously gated by whileInView. Same visual envelope: opacity
// 0→1, y +20→0, 550ms with the in-house cubic-bezier(0.16,1,0.3,1).
// prefers-reduced-motion neutralises the entry per WCAG 2.3.3.
const SERVICE_CARD_KEYFRAMES = `
@keyframes service-card-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.service-card-in {
  opacity: 0;
  animation: service-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .service-card-in {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;

export const Services: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  // Use sliced SERVICES for the overview section
  const displayServices = SERVICES.slice(0, 6);

  if (!displayServices || displayServices.length === 0) {
    return (
      <section id="services" aria-live="polite" className="py-24 text-center">
        <p>{t('noServices')}</p>
      </section>
    );
  }

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-24 lg:py-32 px-6 md:px-12 max-w-7xl mx-auto relative flex flex-col lg:flex-row gap-16 items-start"
    >
      {/* Sticky Section Header */}
      <div className="lg:sticky lg:top-32 lg:w-1/3 space-y-6">
        <FadeIn>
          <span className="text-secondary font-bold uppercase tracking-widest text-xs block">
            {SERVICES_COPY.badge[lang]}
          </span>
        </FadeIn>
        <FadeIn delay={100}>
          <h2
            id="services-heading"
            className="font-serif-display text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]"
          >
            {SERVICES_COPY.title[lang]}
          </h2>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="text-lg text-slate-300 font-light leading-relaxed">
            {SERVICES_COPY.subtitle[lang]}
          </p>
        </FadeIn>
      </div>

      {/* Services Scrolling Grid */}
      <style>{SERVICE_CARD_KEYFRAMES}</style>
      <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {displayServices.map((service: Service, index: number) => (
          <div
            key={service.id}
            className="service-card-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </section>
  );
};
