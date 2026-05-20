/**
 * ProcessTimeline — "Nasıl Çalışır" Danışmanlık Süreci
 * istek5.txt Phase 2: UI/UX — Trust Building / Conversion
 *
 * - 4 adımlı dikey timeline (Keşif → Analiz → Yol Haritası → Uygulama)
 * - Scroll tabanlı animasyon: her adım viewport'a girince aktive
 * - Connecting line animation (SVG path draw-in)
 * - Her adımda: step number, icon, başlık, açıklama, süre badge
 * - CTA: "Süreci Başlat" → /contact
 * - i18n (tr/en), A11y: ol, li yapısı
 * - Schema.org HowTo markup (SEO)
 */

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Search, BarChart3, Map, Rocket, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../lib/i18n';

interface Step {
  num: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  title: { tr: string; en: string };
  desc: { tr: string; en: string };
  duration: { tr: string; en: string };
  deliverables: { tr: string[]; en: string[] };
}

const STEPS: Step[] = [
  {
    num: 1,
    icon: Search,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    title: { tr: 'Keşif & Değerlendirme', en: 'Discovery & Assessment' },
    desc: {
      tr: 'İşletmenizin mevcut durumunu, hedeflerini ve kritik boşluklarını anlamak için derinlemesine keşif görüşmesi gerçekleştiriyoruz.',
      en: 'We conduct an in-depth discovery session to understand your current state, goals, and critical gaps.',
    },
    duration: { tr: '1–2 Gün', en: '1–2 Days' },
    deliverables: {
      tr: ['Mevcut durum raporu', 'Kritik boşluk analizi', 'Öncelikli fırsatlar listesi'],
      en: ['Current state report', 'Critical gap analysis', 'Prioritized opportunities list'],
    },
  },
  {
    num: 2,
    icon: BarChart3,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    title: { tr: 'Derin Analiz & Strateji', en: 'Deep Analysis & Strategy' },
    desc: {
      tr: 'Veriye dayalı analizimizle büyüme fırsatlarını ve riskleri tespit ederek özelleştirilmiş stratejinizi oluşturuyoruz.',
      en: 'With data-driven analysis, we identify growth opportunities and risks to build your customized strategy.',
    },
    duration: { tr: '3–5 Gün', en: '3–5 Days' },
    deliverables: {
      tr: ['Rekabet analizi', 'ROI projeksiyonu', 'Risk matrisi'],
      en: ['Competitive analysis', 'ROI projection', 'Risk matrix'],
    },
  },
  {
    num: 3,
    icon: Map,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    title: { tr: 'Yol Haritası & Planlama', en: 'Roadmap & Planning' },
    desc: {
      tr: 'Somut adımlar, kilometre taşları ve kaynak planlamasından oluşan detaylı uygulama yol haritanızı hazırlıyoruz.',
      en: 'We prepare your detailed implementation roadmap with concrete steps, milestones, and resource planning.',
    },
    duration: { tr: '2–3 Gün', en: '2–3 Days' },
    deliverables: {
      tr: ['Detaylı yol haritası', 'OKR çerçevesi', 'Kaynak planı'],
      en: ['Detailed roadmap', 'OKR framework', 'Resource plan'],
    },
  },
  {
    num: 4,
    icon: Rocket,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    title: { tr: 'Uygulama & Ölçüm', en: 'Execution & Measurement' },
    desc: {
      tr: 'Stratejinizi hayata geçirirken haftalık ilerleme görüşmeleri ve gerçek zamanlı metrik takibi ile yanınızdayız.',
      en: 'We support you through execution with weekly progress calls and real-time metric tracking.',
    },
    duration: { tr: 'Süregelen', en: 'Ongoing' },
    deliverables: {
      tr: ['Haftalık ilerleme raporu', 'Gerçek zamanlı KPI dashboard', 'Aylık strateji revizyonu'],
      en: ['Weekly progress report', 'Real-time KPI dashboard', 'Monthly strategy revision'],
    },
  },
];

function StepItem({ step, lang, index }: { step: Step; lang: 'tr' | 'en'; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  const Icon = step.icon;
  const isLast = index === STEPS.length - 1;

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="relative flex gap-6 sm:gap-8"
      itemProp="step"
      itemScope
      itemType="https://schema.org/HowToStep"
    >
      {/* Left: number + line */}
      <div className="flex flex-col items-center shrink-0">
        {/* Step circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15, ease: 'backOut' }}
          className={`w-12 h-12 rounded-full ${step.bgColor} border ${step.borderColor} flex items-center justify-center shadow-lg`}
          aria-hidden="true"
        >
          <Icon size={20} className={step.color} />
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="w-px flex-1 my-3 bg-linear-to-b from-white/20 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Right: content */}
      <div className="pb-12 flex-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-xs font-mono text-slate-500 mb-1 block">
              {lang === 'tr' ? `Adım ${step.num}` : `Step ${step.num}`}
            </span>
            <h3 className="text-lg font-semibold text-white" itemProp="name">
              {lang === 'tr' ? step.title.tr : step.title.en}
            </h3>
          </div>
          <span
            className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${step.bgColor} ${step.borderColor} border ${step.color}`}
          >
            {lang === 'tr' ? step.duration.tr : step.duration.en}
          </span>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mt-2" itemProp="text">
          {lang === 'tr' ? step.desc.tr : step.desc.en}
        </p>

        {/* Deliverables */}
        <ul className="mt-4 space-y-1.5">
          {(lang === 'tr' ? step.deliverables.tr : step.deliverables.en).map((d) => (
            <li key={d} className="flex items-center gap-2 text-xs text-slate-500">
              <div className={`w-1 h-1 rounded-full ${step.color} opacity-70`} aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </motion.li>
  );
}

export const ProcessTimeline: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      className="py-20 sm:py-28 px-4 sm:px-6"
      aria-label={lang === 'tr' ? 'Çalışma sürecimiz' : 'Our process'}
      data-testid="process-timeline"
      itemScope
      itemType="https://schema.org/HowTo"
    >
      <meta itemProp="name" content="eCyPro Consulting Process" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-secondary mb-3">
            {lang === 'tr' ? 'Nasıl Çalışırız' : 'How We Work'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4">
            {lang === 'tr' ? '4 Adımda Dönüşüm' : 'Transformation in 4 Steps'}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            {lang === 'tr'
              ? 'Keşiften uygulamaya kadar her adımda yanınızdayız. Net süreç, ölçülebilir sonuçlar.'
              : "From discovery to execution, we're with you every step. Clear process, measurable results."}
          </p>
        </motion.div>

        {/* Steps */}
        <ol
          className="relative"
          aria-label={lang === 'tr' ? 'Danışmanlık adımları' : 'Consulting steps'}
        >
          {STEPS.map((step, i) => (
            <StepItem key={step.num} step={step} lang={lang} index={i} />
          ))}
        </ol>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-4"
        >
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-neutral font-semibold px-6 py-3 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral"
          >
            {lang === 'tr' ? 'Süreci Başlat' : 'Start the Process'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
