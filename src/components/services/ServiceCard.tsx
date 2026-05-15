import React from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
import { ArrowRight } from 'lucide-react';
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
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      data-testid="service-card"
      data-service-id={service.id}
      data-category={service.category}
      className="group relative bg-white/5 border border-white/10 rounded-2xl p-8
                 hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/5
                 transition-all duration-500 overflow-hidden flex flex-col"
    >
      {/* Ambient glow — top-right */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-secondary/15 transition-colors duration-700 pointer-events-none" />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-secondary/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />

      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-0.5 h-0 bg-linear-to-b from-primary to-secondary group-hover:h-full transition-all duration-500 ease-out" />

      {/* Category tag */}
      {categoryLabel && (
        <div className="absolute top-6 right-6 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase group-hover:text-secondary/80 transition-colors font-sans z-10">
          {categoryLabel}
        </div>
      )}

      {/* Icon */}
      <div className="mb-6 relative z-10">
        <div
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center
                     text-slate-300 group-hover:text-secondary group-hover:scale-110 group-hover:border-secondary/30
                     group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all duration-500"
        >
          <service.icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-serif font-semibold text-white mb-3 group-hover:text-secondary transition-colors duration-300 leading-snug">
        {service.title}
      </h3>

      {/* Description */}
      <p className="text-slate-400 font-sans text-sm font-normal leading-relaxed grow group-hover:text-slate-300 transition-colors duration-300 mb-6">
        {service.description}
      </p>

      {/* CTA Link */}
      <Link
        to={service.link}
        data-testid="service-card-cta"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase
                   text-slate-500 group-hover:text-secondary transition-colors duration-300 mt-auto
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        aria-label={`${service.title} detaylarını görüntüle`}
      >
        <span>Keşfet</span>
        <ArrowRight
          size={14}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
      </Link>
    </motion.div>
  );
};
