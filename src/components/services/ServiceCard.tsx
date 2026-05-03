import React from 'react';
import { motion, Variants } from 'motion/react';
import { Service } from '@/schemas/service';

interface ServiceCardProps {
  service: Service;
  categoryLabel?: string;
  variants?: Variants;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, categoryLabel, variants }) => {
  return (
    <motion.div
      variants={variants}
      layout
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8
                 hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/5
                 transition-all duration-500 overflow-hidden flex flex-col cursor-default"
    >
      {/* Ambient Lighting Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-secondary/15 transition-colors duration-700 pointer-events-none" />

      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-secondary/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />

      {/* Category Tag */}
      {categoryLabel && (
        <div className="absolute top-6 right-6 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase group-hover:text-secondary transition-colors font-sans z-10">
          {categoryLabel}
        </div>
      )}

      {/* Icon Container */}
      <div className="mb-6 relative z-10">
        <div
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center
                     text-slate-300 group-hover:text-secondary group-hover:scale-110 group-hover:border-secondary/30
                     group-hover:shadow-[0_0_20px_rgba(217,119,6,0.15)] transition-all duration-500"
        >
          <service.icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-serif font-medium text-white mb-4 group-hover:text-secondary transition-colors duration-300">
        {service.title}
      </h3>

      <p className="text-slate-400 font-sans text-sm font-normal leading-relaxed grow group-hover:text-slate-300 transition-colors duration-300">
        {service.description}
      </p>
    </motion.div>
  );
};
