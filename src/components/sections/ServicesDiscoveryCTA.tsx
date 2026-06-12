import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { KVKKBadge } from '../common/KVKKBadge';
import { cn } from '@/lib/utils';

interface ServicesDiscoveryCTAProps {
  className?: string;
}

export const ServicesDiscoveryCTA: React.FC<ServicesDiscoveryCTAProps> = ({ className }) => {
  return (
    <section
      data-testid="services-discovery-cta"
      aria-label="Keşif görüşmesi"
      className={cn(
        'py-24 bg-linear-to-br from-primary/10 via-[#060A14] to-secondary/5 border-t border-white/5',
        className,
      )}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-blue-300 uppercase tracking-widest mb-8">
          <Calendar size={13} aria-hidden="true" />
          Ücretsiz
        </div>

        <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-6 leading-tight">
          Keşif Görüşmesi{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
            Ayarlayın
          </span>
        </h2>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          İhtiyaçlarınızı dinliyor, organizasyonunuza özel strateji yol haritasını birlikte
          konuşuyoruz. 45 dakika — ücretsiz, taahhütsüz.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            to="/contact"
            data-testid="discovery-cta-primary"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-secondary hover:bg-secondary/90 text-neutral font-bold uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.25)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all duration-300"
          >
            <Calendar size={18} aria-hidden="true" />
            Discovery Call — Keşif Görüşmesi
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="flex justify-center">
          <KVKKBadge variant="discovery" />
        </div>
      </div>
    </section>
  );
};
