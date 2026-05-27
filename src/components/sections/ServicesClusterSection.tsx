import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Handshake, Leaf, Cpu, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClusterItem {
  id: string;
  title: string;
  href: string;
}

interface Cluster {
  id: 'ma' | 'esg' | 'fintech' | 'aile';
  icon: React.ReactNode;
  heading: string;
  subtitle: string;
  color: string;
  borderColor: string;
  items: ClusterItem[];
}

const CLUSTERS: Cluster[] = [
  {
    id: 'ma',
    icon: <Handshake size={22} aria-hidden="true" />,
    heading: 'M&A Danışmanlığı',
    subtitle: 'Birleşme & Satın Alma',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    items: [
      {
        id: 'degerleme',
        title: 'Şirket Değerleme & DCF Analizi',
        href: '/services/mergers-acquisitions',
      },
      { id: 'dd', title: 'Due Diligence Hizmetleri', href: '/services/mergers-acquisitions' },
      {
        id: 'pmi',
        title: 'Birleşme Sonrası Entegrasyon (PMI)',
        href: '/services/mergers-acquisitions',
      },
      { id: 'exit', title: 'Exit Strateji Planlaması', href: '/services/mergers-acquisitions' },
      {
        id: 'jv',
        title: 'Joint Venture & Ortaklık Yapılandırma',
        href: '/services/strategic-transformation',
      },
    ],
  },
  {
    id: 'esg',
    icon: <Leaf size={22} aria-hidden="true" />,
    heading: 'ESG & Sürdürülebilirlik',
    subtitle: 'Çevre · Sosyal · Yönetişim',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    items: [
      { id: 'esrs', title: 'ESRS / IFRS S1-S2 Raporlaması', href: '/services/esg-reporting' },
      { id: 'karbon', title: 'Karbon Ayak İzi Analizi', href: '/services/esg-reporting' },
      { id: 'sdg', title: 'SDG Hedef Haritalama', href: '/services/esg-reporting' },
      {
        id: 'yonetisim',
        title: 'Kurumsal Yönetişim Danışmanlığı',
        href: '/services/strategic-transformation',
      },
      {
        id: 'raporlama',
        title: 'Paydaş İletişimi & ESG Raporlama',
        href: '/services/esg-reporting',
      },
    ],
  },
  {
    id: 'fintech',
    icon: <Cpu size={22} aria-hidden="true" />,
    heading: 'Fintech & Dijital',
    subtitle: 'Teknoloji Stratejisi',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    items: [
      {
        id: 'bddk',
        title: 'BDDK & MASAK Regülasyon Uyumu',
        href: '/services/digital-transformation',
      },
      {
        id: 'dijital',
        title: 'Dijital Dönüşüm Yol Haritası',
        href: '/services/digital-transformation',
      },
      { id: 'veri', title: 'Veri Yönetişimi & KVKK', href: '/services/digital-transformation' },
      {
        id: 'api',
        title: 'API Ekonomisi & Platform Stratejisi',
        href: '/services/digital-transformation',
      },
      {
        id: 'ai',
        title: 'Yapay Zeka Entegrasyon Danışmanlığı',
        href: '/services/digital-transformation',
      },
    ],
  },
  {
    id: 'aile',
    icon: <Users size={22} aria-hidden="true" />,
    heading: 'Aile Şirketi',
    subtitle: 'Yönetişim & Kurumsallaşma',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    items: [
      { id: 'anayasa', title: 'Aile Anayasası Hazırlanması', href: '/services/family-business' },
      { id: 'devir', title: 'Nesiller Arası Devir Planlaması', href: '/services/family-business' },
      {
        id: 'kurumsallasma',
        title: 'Kurumsallaşma Programları',
        href: '/services/family-business',
      },
      { id: 'catisma', title: 'Aile İçi Çatışma Yönetimi', href: '/services/family-business' },
      { id: 'vakif', title: 'Aile Vakfı & Tröst Yapılanması', href: '/services/family-business' },
    ],
  },
];

interface ServicesClusterSectionProps {
  className?: string;
}

export const ServicesClusterSection: React.FC<ServicesClusterSectionProps> = ({ className }) => {
  return (
    <section
      data-testid="services-cluster-section"
      aria-label="Hizmet küme detayları"
      className={cn('py-20 bg-[#060A14]', className)}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-4">
            Hizmet Kümelerimiz
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Her kümede uzman ekibimiz, sektöre özgü metodoloji ve kanıtlanmış çıktılarla yanınızda.
          </p>
        </div>

        {/* 2×2 cluster grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {CLUSTERS.map((cluster) => (
            <div
              key={cluster.id}
              data-testid={`cluster-group-${cluster.id}`}
              className={cn(
                'bg-[#0A0F1C]/60 border rounded-2xl p-8 hover:border-white/15 transition-colors duration-300',
                cluster.borderColor,
              )}
            >
              {/* Cluster header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={cn('mt-0.5', cluster.color)}>{cluster.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{cluster.heading}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                    {cluster.subtitle}
                  </p>
                </div>
              </div>

              {/* Service items */}
              <ul className="space-y-2" aria-label={`${cluster.heading} hizmetleri`}>
                {cluster.items.map((item) => (
                  <li key={item.id} data-testid={`cluster-item-${cluster.id}-${item.id}`}>
                    <Link
                      to={item.href}
                      className="group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-300 hover:text-white"
                    >
                      <ArrowRight
                        size={13}
                        className={cn(
                          'shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all',
                          cluster.color,
                        )}
                        aria-hidden="true"
                      />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
