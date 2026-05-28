import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Leaf, Cpu, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cluster {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  href: string;
  services: string[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'ma',
    icon: <Handshake size={28} aria-hidden="true" />,
    title: 'M&A Danışmanlığı',
    subtitle: 'Birleşme & Satın Alma',
    description:
      'Şirket değerleme, due diligence, post-merger entegrasyon ve exit stratejileri. Türkiye & AB pazarı uzmanlığı.',
    color: 'from-blue-600/20 to-blue-900/5',
    href: '/services?category=isletme&q=m%26a',
    services: ['Değerleme', 'Due Diligence', 'PMI', 'Exit Stratejisi'],
  },
  {
    id: 'esg',
    icon: <Leaf size={28} aria-hidden="true" />,
    title: 'ESG & Sürdürülebilirlik',
    subtitle: 'Çevre · Sosyal · Yönetişim',
    description:
      'ESRS / IFRS S1-S2 uyumlu ESG raporlaması, karbon ayak izi analizi ve sürdürülebilirlik stratejisi.',
    color: 'from-emerald-600/20 to-emerald-900/5',
    href: '/services?category=maliye&q=esg',
    services: ['ESG Raporu', 'Karbon Analizi', 'ESRS Uyum', 'SDG Haritalama'],
  },
  {
    id: 'fintech',
    icon: <Cpu size={28} aria-hidden="true" />,
    title: 'Fintech & Dijital',
    subtitle: 'Teknoloji Stratejisi',
    description:
      'Dijital dönüşüm yol haritası, fintech regülasyon uyumu (BDDK, MASAK) ve veri yönetişimi çözümleri.',
    color: 'from-amber-500/20 to-amber-900/5',
    href: '/services?category=ybs&q=fintech',
    services: ['BDDK Uyum', 'Dijital Strateji', 'Veri Yönetişimi', 'API Stratejisi'],
  },
  {
    id: 'aile',
    icon: <Users size={28} aria-hidden="true" />,
    title: 'Aile Şirketi',
    subtitle: 'Yönetişim & Kurumsallaşma',
    description:
      'Nesiller arası devir planlaması, aile anayasası hazırlanması ve kurumsal yönetişim yapıları.',
    color: 'from-purple-600/20 to-purple-900/5',
    href: '/services?category=isletme&q=aile',
    services: ['Aile Anayasası', 'Devir Planlaması', 'Kurumsallaşma', 'Çatışma Yönetimi'],
  },
];

interface HomeServicePreviewProps {
  className?: string;
}

export const HomeServicePreview: React.FC<HomeServicePreviewProps> = ({ className }) => {
  return (
    <section
      data-testid="home-service-preview"
      aria-label="Hizmet kümeleri"
      className={cn('py-24 bg-[#060A14]', className)}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">
            Hizmet Alanlarımız
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-4">
            Dört ana alanda{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">
              uzman danışmanlık
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            M&A'dan ESG'ye, Fintech'ten Aile Şirketlerine — her alanda Big4 kalitesinde stratejik
            rehberlik.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {CLUSTERS.map((cluster) => (
            <article
              key={cluster.id}
              data-testid={`service-cluster-${cluster.id}`}
              className={cn(
                'group relative bg-gradient-to-br border border-white/5 rounded-2xl p-8 transition-all duration-300',
                'hover:border-white/15 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]',
                cluster.color,
              )}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                {cluster.icon}
              </div>

              {/* Subtitle chip */}
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">
                {cluster.subtitle}
              </p>

              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{cluster.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{cluster.description}</p>

              {/* Service tags */}
              <ul className="flex flex-wrap gap-2 mb-8" aria-label={`${cluster.title} hizmetleri`}>
                {cluster.services.map((svc) => (
                  <li
                    key={svc}
                    className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300"
                  >
                    {svc}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to={cluster.href}
                className="inline-flex items-center gap-2 text-sm font-bold text-secondary hover:text-white transition-colors group/link"
                aria-label={`${cluster.title} hizmetlerini incele`}
              >
                Detayları İncele
                <ArrowRight
                  size={15}
                  className="group-hover/link:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </article>
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 text-white font-bold uppercase tracking-widest rounded-xl transition-all duration-300 text-sm"
          >
            Tüm Hizmetleri Gör
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
