import React from 'react';
import { KPI_ITEMS } from '../../constants';
import { FadeIn } from '../common/FadeIn';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../../lib/analytics';
import { MouseGlow } from '../ui/MouseGlow';
import { motion } from 'motion/react';
import { NumberTicker } from '../ui/number-ticker';

const KPI_COPY = {
  titleLine1: { tr: 'Rakamlarla', en: 'In Numbers' },
  titleHighlight: { tr: 'Başarımız', en: 'Our Success' },
  description: {
    tr: 'Yılların getirdiği tecrübe ve uzmanlıkla elde ettiğimiz somut sonuçlar.',
    en: 'Concrete results achieved through years of experience and expertise.',
  },
};

const KPIItem: React.FC<{
  item: (typeof KPI_ITEMS)[0];
  delay: number;
  lang: 'tr' | 'en';
  span?: string;
}> = ({ item, delay, lang, span = 'col-span-1' }) => {
  const getGradient = (category: string) => {
    switch (category) {
      case 'consulting':
        return 'from-secondary/20 to-transparent';
      case 'events':
        return 'from-blue-500/20 to-transparent';
      case 'digital':
        return 'from-purple-500/20 to-transparent';
      default:
        return 'from-slate-500/20 to-transparent';
    }
  };

  const getBorderColor = (category: string) => {
    switch (category) {
      case 'consulting':
        return 'group-hover:border-secondary/50';
      case 'events':
        return 'group-hover:border-blue-400/50';
      case 'digital':
        return 'group-hover:border-purple-400/50';
      default:
        return 'group-hover:border-slate-400/50';
    }
  };

  // P44: axe-core fix — parent <li> zaten listitem semantiği veriyor; bu motion.div'de
  // role="listitem" duplikasyon yaratıyordu. Kaldırıldı.
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`relative h-full min-h-62.5 overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-8 lg:p-10 group transition-colors duration-500 ${getBorderColor(item.category)}`}
    >
      <MouseGlow />
      <div
        className={`absolute inset-0 bg-linear-to-br ${getGradient(item.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex flex-col">
          <div className="text-white font-medium text-2xl mb-1 tracking-wide">
            {item.label[lang]}
          </div>
          <div className="text-slate-400 text-sm font-light uppercase tracking-widest mt-2">
            {item.helperText[lang]}
          </div>
        </div>

        <div
          className="mt-12 text-[4rem] lg:text-[5.5rem] leading-none font-sans font-light text-white group-hover:text-white transition-colors duration-300 tabular-nums tracking-tighter"
          aria-label={`${item.value}${item.suffix}`}
        >
          <NumberTicker value={item.value} delay={delay} />
          <span className="text-secondary ml-1">{item.suffix}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const KPI: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  // Track view event
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackEvent('KPI', 'View', `Item Count: ${KPI_ITEMS.length}`);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    const element = document.getElementById('kpi');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // For a Bento grid, we assign different spans to items to make it asymmetrical
  const getSpanForItem = (index: number) => {
    if (index === 0) return 'md:col-span-2 lg:col-span-2';
    if (index === 1) return 'md:col-span-1 lg:col-span-1';
    if (index === 2) return 'md:col-span-1 lg:col-span-1';
    if (index === 3) return 'md:col-span-2 lg:col-span-2';
    return 'col-span-1';
  };

  return (
    <section
      id="kpi"
      className="py-32 lg:py-48 bg-neutral text-white relative overflow-hidden"
      aria-labelledby="kpi-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.08),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col items-center text-center mb-20 lg:mb-32">
          <FadeIn>
            <h2
              id="kpi-heading"
              className="text-h2-d font-sans font-light mb-6 leading-tight tracking-tight"
            >
              {KPI_COPY.titleLine1[lang]}{' '}
              <span className="text-secondary font-medium">{KPI_COPY.titleHighlight[lang]}</span>
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed font-light max-w-2xl mx-auto">
              {KPI_COPY.description[lang]}
            </p>
          </FadeIn>
        </div>

        {/* P44: axe-core fix — <li className="contents"> li'yi DOM render'dan
            kaldırarak ul/li parent-child role mismatch yaratıyordu. Span artık
            doğrudan <li>'de; KPIItem h-full ile dolduruyor. */}
        <ul className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:gap-8 list-none p-0 m-0">
          {KPI_ITEMS.map((item, idx) => (
            <li key={item.id} className={`${getSpanForItem(idx)} list-none h-full`}>
              <KPIItem
                item={item}
                delay={idx * 150}
                lang={lang}
                span={getSpanForItem(idx)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
