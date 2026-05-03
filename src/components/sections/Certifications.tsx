/**
 * Certifications.tsx — Phase 20.5 H5
 *
 * Trust-row sertifikasyonlar / awards / compliance rozetleri.
 *
 * - Sertifikasyon listesi statik (ISO27001, SOC2, GDPR, KVKK, Cyber Essentials).
 * - Bilingual başlık + alt-açıklama (react-i18next yerine inline MultiLang -
 *   Hero/KPI/SuccessStories pattern'i ile uyumlu).
 * - Motion-reduce tüm framer-motion animasyonlarında respect.
 * - A11y: <ul> + role/aria yerine semantic markup; her rozet `aria-label`'lı.
 */
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, Award, Lock, Scale, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn } from '../common/FadeIn';

interface Certification {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: { tr: string; en: string };
  description: { tr: string; en: string };
}

const CERTIFICATIONS: Certification[] = [
  {
    id: 'iso-27001',
    icon: ShieldCheck,
    label: { tr: 'ISO 27001', en: 'ISO 27001' },
    description: {
      tr: 'Bilgi güvenliği yönetim sistemi sertifikası',
      en: 'Information Security Management System',
    },
  },
  {
    id: 'soc-2',
    icon: Lock,
    label: { tr: 'SOC 2 Type II', en: 'SOC 2 Type II' },
    description: {
      tr: 'Operasyonel kontrol denetimi',
      en: 'Operational controls audit',
    },
  },
  {
    id: 'gdpr',
    icon: Globe2,
    label: { tr: 'GDPR', en: 'GDPR' },
    description: {
      tr: 'AB Genel Veri Koruma Yönetmeliği uyumu',
      en: 'EU General Data Protection Regulation',
    },
  },
  {
    id: 'kvkk',
    icon: Scale,
    label: { tr: 'KVKK', en: 'KVKK' },
    description: {
      tr: 'Türkiye Kişisel Verilerin Korunması Kanunu',
      en: 'Turkey Personal Data Protection Law',
    },
  },
  {
    id: 'best-of-2025',
    icon: Award,
    label: { tr: 'Capital 500', en: 'Capital 500' },
    description: {
      tr: '2025 yılının en iyi danışmanlık firmaları arasında',
      en: 'Among the top consulting firms of 2025',
    },
  },
];

const COPY = {
  badge: { tr: 'Sertifikasyonlar & Ödüller', en: 'Certifications & Awards' },
  title: {
    tr: 'Kurumsal güvenin kanıtlanmış standartları',
    en: 'Proven standards of enterprise trust',
  },
  description: {
    tr: 'Kurum müşterilerimiz için bağımsız denetim, regülasyon ve sektörel ödülleri tek çatı altında topluyoruz.',
    en: 'For our enterprise clients, we maintain independent audits, regulatory compliance, and industry awards under one roof.',
  },
};

export const Certifications: React.FC = () => {
  const { i18n } = useTranslation();
  const lang: 'tr' | 'en' = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="py-24 lg:py-32 bg-neutral relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <FadeIn>
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase text-white">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              {COPY.badge[lang]}
            </span>
            <h2
              id="certifications-heading"
              className="mt-6 text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-white tracking-tight"
            >
              {COPY.title[lang]}
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-base lg:text-lg text-slate-400 font-light leading-relaxed">
              {COPY.description[lang]}
            </p>
          </div>
        </FadeIn>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {CERTIFICATIONS.map((cert, idx) => (
            <motion.li
              key={cert.id}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: reducedMotion ? 0 : idx * 0.08 }}
              className="group"
            >
              <article
                aria-label={`${cert.label[lang]} — ${cert.description[lang]}`}
                className="h-full p-5 lg:p-6 rounded-2xl bg-white/3 border border-white/10 hover:border-secondary/40 hover:bg-white/5 transition-colors"
              >
                <cert.icon className="w-7 h-7 text-secondary mb-3" strokeWidth={1.5} />
                <h3 className="text-white font-semibold text-base mb-1">{cert.label[lang]}</h3>
                <p className="text-slate-400 text-sm font-light leading-snug">
                  {cert.description[lang]}
                </p>
              </article>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Certifications;
