import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Service } from '@/schemas/service';
import { DOMAIN_ACCENT_MAP } from '@/lib/service-utils';
import { getLifecyclePosition } from '@/data/service-taxonomy';

export { DOMAIN_ACCENT_MAP } from '@/lib/service-utils';

interface ServiceCardProps {
  service: Service;
  categoryLabel?: string;
  variants?: Variants;
}

/** Pointer-driven 3D tilt — motion-spec budget: rotateX/Y ≤ 6°, transform-only,
 *  rAF-throttled, pointer:fine only, disabled under prefers-reduced-motion. */
const MAX_TILT_DEG = 6;

function useCardTilt() {
  const frame = useRef<number | null>(null);
  const enabled = useRef<boolean | null>(null);

  const isEnabled = () => {
    if (enabled.current === null) {
      enabled.current =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(pointer: fine)').matches &&
        !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }
    return enabled.current;
  };

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEnabled()) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(800px) rotateX(${(-py * MAX_TILT_DEG).toFixed(2)}deg) rotateY(${(px * MAX_TILT_DEG).toFixed(2)}deg)`;
    });
  }, []);

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transform = '';
  }, []);

  return { onPointerMove, onPointerLeave };
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, categoryLabel, variants }) => {
  const accent = DOMAIN_ACCENT_MAP[service.category] ?? {
    badge: 'text-slate-400 bg-white/5 border border-white/10',
    glow: '',
  };
  const slug = service.link.split('/').pop() ?? '';
  const lifecycle = getLifecyclePosition(slug);
  const tilt = useCardTilt();

  return (
    <motion.div
      variants={variants}
      data-testid="service-card"
      data-service-id={service.id}
      data-category={service.category}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="group relative bg-white/5 border border-white/10 rounded-2xl p-8
                 hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/5
                 transition-[border-color,box-shadow] duration-300 overflow-hidden flex flex-col
                 will-change-transform"
    >
      {/* Ambient glow — decorative geometry on the fib scale (136px) */}
      <div
        className={`absolute -top-fib-21 -right-fib-21 w-fib-34 h-fib-34 bg-primary/10 rounded-full blur-3xl ${accent.glow} transition-colors duration-400 pointer-events-none`}
        aria-hidden="true"
      />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-secondary/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 ease-out" />

      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-0.5 h-0 bg-linear-to-b from-primary to-secondary group-hover:h-full transition-all duration-300 ease-out" />

      {/* Domain accent badge — top-left */}
      {categoryLabel && (
        <div
          data-testid="service-domain-badge"
          className={`absolute top-5 left-5 text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full ${accent.badge} z-10`}
        >
          {categoryLabel}
        </div>
      )}

      {/* Lifecycle position — scan-first hint ("step N of M in this workflow") */}
      {lifecycle && (
        <div
          data-testid="service-lifecycle-hint"
          className="absolute top-5 right-5 text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full text-slate-500 bg-white/5 border border-white/10 tabular-nums z-10"
        >
          {`Adım ${lifecycle.step}/${lifecycle.total}`}
        </div>
      )}

      {/* Icon */}
      <div className="mb-6 relative z-10 mt-6">
        <div
          className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center
                     text-slate-300 group-hover:text-secondary group-hover:scale-110 group-hover:border-secondary/30
                     group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all duration-300"
        >
          <service.icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-serif font-semibold text-white mb-3 group-hover:text-secondary transition-colors duration-300 leading-snug">
        {service.title}
      </h3>

      {/* Description — clamped for scan-first card geometry */}
      <p className="text-slate-400 font-sans text-sm font-normal leading-relaxed grow group-hover:text-slate-300 transition-colors duration-300 mb-6 line-clamp-3">
        {service.description}
      </p>

      {/* CTA Link */}
      <Link
        to={service.link}
        data-testid="service-card-cta"
        className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide
                   text-slate-600 group-hover:text-secondary transition-colors duration-300 mt-auto
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        aria-label={`${service.title} detaylarını görüntüle`}
      >
        <span>Detay</span>
        <ChevronRight
          size={13}
          className="group-hover:translate-x-0.5 transition-transform duration-300"
        />
      </Link>
    </motion.div>
  );
};
