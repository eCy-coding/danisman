import React, { useRef } from 'react';
import { motion, useScroll } from 'motion/react';
import { useTranslation, getLang, MultiLang, Language } from '@/lib/i18n';
import { Microscope, Compass, Zap, TrendingUp, LucideIcon } from 'lucide-react';

interface Step {
  title: MultiLang;
  description: MultiLang;
  icon: string;
}

interface TimelineProps {
  steps: Step[];
}

const icons: Record<string, LucideIcon> = {
  Microscope,
  Compass,
  Zap,
  TrendingUp,
};

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  const { language } = useTranslation();
  const lang = language as Language;
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <div ref={containerRef} className="relative max-w-5xl mx-auto py-20 px-4">
      {/* Center Line */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-primary/10 via-primary/50 to-primary/10 transform -translate-x-1/2" />

      {/* Animated Progress Line */}
      <motion.div
        className="absolute left-4 md:left-1/2 top-0 w-1 bg-linear-to-b from-secondary via-primary to-secondary transform -translate-x-1/2 origin-top"
        style={{ height: '100%', scaleY: scrollYProgress }}
      />

      <div className="space-y-24 md:space-y-32">
        {steps.map((step, index) => {
          const Icon = icons[step.icon] || Zap;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
              className={`relative flex flex-col md:flex-row items-center gap-8 ${
                isEven ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Card Content */}
              <div className="flex-1 w-full md:w-auto pl-12 md:pl-0">
                <div
                  className={`p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group
                                    ${isEven ? 'md:text-left' : 'md:text-right'}
                                `}
                >
                  <div
                    className={`flex items-center gap-4 mb-4 ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="p-3 bg-linear-to-br from-primary/10 to-secondary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-500">
                      <Icon size={28} />
                    </div>
                    <span className="text-5xl font-bold text-slate-200/20 font-serif">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-primary transition-colors">
                    {getLang(step.title, lang)}
                  </h3>
                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {getLang(step.description, lang)}
                  </p>
                </div>
              </div>

              {/* Center Node */}
              <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-neutral border-4 border-slate-800 z-10 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <motion.div
                  className="w-3 h-3 bg-secondary rounded-full"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                />
              </div>

              {/* Empty space for alternate side */}
              <div className="flex-1 hidden md:block" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
