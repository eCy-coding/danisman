import React, { useRef } from 'react';
import { VALUE_PROPS } from '../../constants';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { FadeIn } from '../common/FadeIn';
import { useTranslation } from 'react-i18next';
import { cardHoverVariants, getCardTransition } from '@/lib/motion/get-card-context';
import { useScrollReveal } from '@/lib/motion/useScrollReveal';

const VALUE_PROP_COPY = {
  badge: { tr: 'Değer Önerimiz', en: 'Our Value Proposition' },
  title: { tr: 'Neden eCyPro?', en: 'Why eCyPro?' },
  description: {
    tr: 'Geleceği şekillendiren vizyonumuz, sektördeki derin tecrübemiz ve sonuç odaklı yaklaşımımızla işletmenizi bir adım öteye taşıyoruz.',
    en: 'With our future-shaping vision, deep industry experience, and result-oriented approach, we take your business a step further.',
  },
};

export const ValueProp: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const sectionRef = useRef<HTMLElement>(null);
  const { ref: gridRef } = useScrollReveal<HTMLDivElement>({
    stagger: 0.1,
    selector: '.value-card',
  });

  // S13-R7-A2 — gate scroll-driven parallax math + blur-3xl decoration on
  // mobile / prefers-reduced-motion. blur-3xl on a 600×600 element is one
  // of the most expensive composited operations on mid-range mobile GPUs
  // (Android Snapdragon 6xx series, older A-series iPhones). Combined
  // with two parallax layers driven by useScroll/useTransform, the layout
  // pegs the compositor thread. Approach:
  //   - render gate (`max-md:hidden`) removes the layers from the DOM on
  //     small viewports (Tailwind `md` = 768px) → zero paint/composite cost
  //   - useReducedMotion() guard skips useTransform math entirely for
  //     users who opted out (vestibular comfort + battery)
  // Desktop with fine pointer + motion enabled keeps the full effect.
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const yBg1Raw = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const yBg2Raw = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const yBg1 = prefersReducedMotion ? 0 : yBg1Raw;
  const yBg2 = prefersReducedMotion ? 0 : yBg2Raw;

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-neutral relative overflow-hidden">
      {/* Ambient Parallax Backgrounds — hidden on mobile (max-md) to skip blur-3xl compositor cost */}
      <motion.div
        style={{ y: yBg1 }}
        className="max-md:hidden absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.06),transparent_50%)] pointer-events-none"
      />
      <motion.div
        style={{ y: yBg2 }}
        className="max-md:hidden absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-3xl rounded-full pointer-events-none -translate-x-1/2 translate-y-1/4"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="mb-16 lg:mb-20 max-w-3xl">
          <FadeIn>
            <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-fib-4 block">
              {VALUE_PROP_COPY.badge[lang]}
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h2
              id="value-prop-heading"
              className="font-serif-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]"
            >
              {VALUE_PROP_COPY.title[lang]}
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-slate-300 font-light leading-relaxed">
              {VALUE_PROP_COPY.description[lang]}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" ref={gridRef}>
          {VALUE_PROPS.map((item, idx) => (
            <FadeIn key={item.id} delay={idx * 100} className="h-full">
              <motion.div
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                animate="rest"
                variants={cardHoverVariants}
                transition={getCardTransition('subtle')}
                className="value-card flex flex-col items-start group p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full cursor-default"
              >
                <div className="mb-6 p-4 rounded-xl bg-white/5 text-slate-300 group-hover:bg-primary/20 group-hover:text-secondary transition-all duration-300 border border-white/5 group-hover:border-secondary/20 group-hover:shadow-[0_0_20px_rgba(217,119,6,0.1)]">
                  <item.icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-4 group-hover:text-secondary transition-colors duration-300">
                  {item.title[lang]}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                  {item.description[lang]}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
