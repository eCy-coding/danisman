import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {displayServices.map((service: Service) => (
          <ServiceCard key={service.id} service={service} variants={cardVariants} />
        ))}
      </motion.div>
    </section>
  );
};
