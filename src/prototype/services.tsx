import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Menu, X, Building2, Leaf, Cpu, Home as HomeIcon } from 'lucide-react';

type Cluster = 'all' | 'ma' | 'esg' | 'fintech' | 'aile';

const CLUSTERS: { id: Cluster; label: { tr: string; en: string } }[] = [
  { id: 'all', label: { tr: 'Tümü', en: 'All' } },
  { id: 'ma', label: { tr: 'M&A & Dönüşüm', en: 'M&A & Transformation' } },
  { id: 'esg', label: { tr: 'ESG & Sürdürülebilirlik', en: 'ESG & Sustainability' } },
  { id: 'fintech', label: { tr: 'Fintech & Dijital', en: 'Fintech & Digital' } },
  { id: 'aile', label: { tr: 'Aile Şirketi', en: 'Family Business' } },
];

interface Service {
  cluster: Cluster;
  name: { tr: string; en: string };
  desc: { tr: string; en: string };
  slug: string;
  icon: typeof Building2;
  color: string;
}

const SERVICES: Service[] = [
  {
    cluster: 'ma',
    name: { tr: 'Birleşme ve Satın Alma Danışmanlığı', en: 'M&A Advisory' },
    desc: {
      tr: 'Hedef belirleme, müzakere ve entegrasyon süreçlerinde tam destek.',
      en: 'End-to-end support across target identification, negotiation, and integration.',
    },
    slug: 'ma-danismanlik',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'Kurumsal Yeniden Yapılanma', en: 'Corporate Restructuring' },
    desc: {
      tr: 'Operasyonel ve finansal yeniden yapılanma stratejileri.',
      en: 'Operational and financial restructuring strategies.',
    },
    slug: 'yeniden-yapilanma',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'Sermaye Piyasaları Stratejisi', en: 'Capital Markets Strategy' },
    desc: {
      tr: 'Halka arz hazırlığı, yatırımcı ilişkileri ve sermaye yapısı optimizasyonu.',
      en: 'IPO readiness, investor relations, and capital structure optimization.',
    },
    slug: 'sermaye-piyasalari',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'Değerleme ve Due Diligence', en: 'Valuation & Due Diligence' },
    desc: {
      tr: 'Bağımsız değerleme analizi ve kapsamlı due diligence süreçleri.',
      en: 'Independent valuation analysis and comprehensive due diligence.',
    },
    slug: 'degerleme',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'İş Geliştirme Ortaklıkları', en: 'Business Development Partnerships' },
    desc: {
      tr: 'Stratejik ittifaklar, JV yapılandırması ve iş geliştirme.',
      en: 'Strategic alliances, JV structuring, and business development.',
    },
    slug: 'is-gelistirme',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'Büyüme Stratejisi', en: 'Growth Strategy' },
    desc: {
      tr: 'Organik ve inorganik büyüme yollarının haritalanması.',
      en: 'Mapping organic and inorganic growth pathways.',
    },
    slug: 'buyume-stratejisi',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'ma',
    name: { tr: 'Çıkış Planlama', en: 'Exit Planning' },
    desc: {
      tr: 'PE ve stratejik yatırımcılar için çıkış optimizasyonu.',
      en: 'Exit optimization for PE and strategic investors.',
    },
    slug: 'cikis-planlama',
    icon: Building2,
    color: 'text-amber-400',
  },
  {
    cluster: 'esg',
    name: { tr: 'ESG Strateji ve Raporlama', en: 'ESG Strategy & Reporting' },
    desc: {
      tr: 'CSRD, GRI ve TCFD uyumlu ESG çerçevesi tasarımı.',
      en: 'CSRD, GRI, and TCFD-aligned ESG framework design.',
    },
    slug: 'esg-strateji',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    cluster: 'esg',
    name: { tr: 'Sürdürülebilirlik Dönüşümü', en: 'Sustainability Transformation' },
    desc: {
      tr: 'Organizasyonel sürdürülebilirlik yol haritası ve uygulama.',
      en: 'Organizational sustainability roadmap and implementation.',
    },
    slug: 'surdurulebilirlik',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    cluster: 'esg',
    name: { tr: 'İklim Riski Yönetimi', en: 'Climate Risk Management' },
    desc: {
      tr: 'TCFD çerçevesinde fiziksel ve geçiş riski analizi.',
      en: 'Physical and transition risk analysis under TCFD framework.',
    },
    slug: 'iklim-riski',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    cluster: 'esg',
    name: { tr: 'Etki Ölçümü ve Raporlama', en: 'Impact Measurement & Reporting' },
    desc: {
      tr: 'Sosyal ve çevresel etki metrikleri ve raporlama çerçevesi.',
      en: 'Social and environmental impact metrics and reporting framework.',
    },
    slug: 'etki-olcumu',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    cluster: 'esg',
    name: { tr: 'Paydaş Katılımı', en: 'Stakeholder Engagement' },
    desc: {
      tr: 'Paydaş haritalama, diyalog stratejisi ve iletişim planı.',
      en: 'Stakeholder mapping, dialogue strategy, and communications plan.',
    },
    slug: 'paydas-katilimi',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    cluster: 'fintech',
    name: { tr: 'Dijital Dönüşüm', en: 'Digital Transformation' },
    desc: {
      tr: 'Teknoloji yol haritası ve dijital operasyon modeli tasarımı.',
      en: 'Technology roadmap and digital operating model design.',
    },
    slug: 'dijital-donusum',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    cluster: 'fintech',
    name: { tr: 'Fintech Ekosistemi Entegrasyonu', en: 'Fintech Ecosystem Integration' },
    desc: {
      tr: 'API bankacılığı, açık bankacılık ve fintech ortaklık stratejisi.',
      en: 'API banking, open banking, and fintech partnership strategy.',
    },
    slug: 'fintech-entegrasyon',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    cluster: 'fintech',
    name: { tr: 'Düzenleyici Uyum', en: 'Regulatory Compliance' },
    desc: {
      tr: 'BDDK, SPK ve AB regulasyon uyum danışmanlığı.',
      en: 'BDDK, CMB, and EU regulatory compliance advisory.',
    },
    slug: 'duzenleyici-uyum',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    cluster: 'fintech',
    name: { tr: 'Veri Analitiği ve AI Danışmanlığı', en: 'Data Analytics & AI Advisory' },
    desc: {
      tr: 'Veri stratejisi, AI kullanım senaryoları ve etik AI çerçevesi.',
      en: 'Data strategy, AI use cases, and ethical AI framework.',
    },
    slug: 'veri-ai',
    icon: Cpu,
    color: 'text-blue-400',
  },
  {
    cluster: 'aile',
    name: { tr: 'Aile Anayasası ve Yönetişim', en: 'Family Constitution & Governance' },
    desc: {
      tr: 'Aile şirketleri için kurumsal yönetişim çerçevesi.',
      en: 'Corporate governance framework for family businesses.',
    },
    slug: 'aile-anayasasi',
    icon: HomeIcon,
    color: 'text-violet-400',
  },
  {
    cluster: 'aile',
    name: { tr: 'Nesiller Arası Geçiş', en: 'Generational Transition' },
    desc: {
      tr: 'Liderlik devri ve nesil aktarımı süreçleri.',
      en: 'Leadership succession and generational transfer processes.',
    },
    slug: 'nesil-gecisi',
    icon: HomeIcon,
    color: 'text-violet-400',
  },
  {
    cluster: 'aile',
    name: { tr: 'Aile Konseyi Kurumu', en: 'Family Council Institution' },
    desc: {
      tr: 'Aile konseyi kurulumu, işletim modeli ve kolaylaştırma.',
      en: 'Family council setup, operating model, and facilitation.',
    },
    slug: 'aile-konseyi',
    icon: HomeIcon,
    color: 'text-violet-400',
  },
  {
    cluster: 'aile',
    name: { tr: 'Veraset Planlaması', en: 'Succession Planning' },
    desc: {
      tr: 'Yasal, vergisel ve duygusal boyutlarıyla veraset planlaması.',
      en: 'Succession planning across legal, tax, and emotional dimensions.',
    },
    slug: 'veraset',
    icon: HomeIcon,
    color: 'text-violet-400',
  },
  {
    cluster: 'aile',
    name: { tr: 'Konflikt Çözümü', en: 'Conflict Resolution' },
    desc: {
      tr: 'Aile içi anlaşmazlıklar için arabuluculuk ve çözüm süreçleri.',
      en: 'Mediation and resolution processes for intra-family disputes.',
    },
    slug: 'konflikt-cozumu',
    icon: HomeIcon,
    color: 'text-violet-400',
  },
];

const PROCESS = [
  {
    step: '01',
    title: { tr: 'Keşif', en: 'Discovery' },
    desc: {
      tr: 'Durumu, fırsatları ve kısıtları dinleyerek anlıyoruz.',
      en: 'We listen and understand the situation, opportunities, and constraints.',
    },
  },
  {
    step: '02',
    title: { tr: 'Analiz', en: 'Analysis' },
    desc: {
      tr: 'Veri odaklı derin analiz ile gerçek nedenleri tespit ediyoruz.',
      en: 'Data-driven deep analysis to identify root causes.',
    },
  },
  {
    step: '03',
    title: { tr: 'Strateji', en: 'Strategy' },
    desc: {
      tr: 'Bağlama özgü, uygulanabilir bir yol haritası tasarlıyoruz.',
      en: 'We design a contextual, actionable roadmap.',
    },
  },
  {
    step: '04',
    title: { tr: 'Uygulama', en: 'Implementation' },
    desc: {
      tr: 'Yanınızda yürüyerek stratejiyi operasyona dönüştürüyoruz.',
      en: 'Walking alongside you to translate strategy into operation.',
    },
  },
];

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <nav
      role="navigation"
      aria-label="Ana navigasyon"
      className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-bold text-amber-400">
          eCyPro
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {[
            { to: '/services', label: 'Hizmetler' },
            { to: '/about', label: 'Hakkımızda' },
            { to: '/insights', label: 'İçgörüler' },
            { to: '/contact', label: 'İletişim' },
          ].map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="text-sm text-slate-300 hover:text-slate-50 transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/discovery"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-900 text-sm font-semibold rounded-lg transition-colors"
        >
          Keşif Görüşmesi <ArrowRight size={14} />
        </Link>
        <button
          className="md:hidden text-slate-300 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-neutral-900 border-t border-slate-800 px-4 py-4 space-y-2">
          {[
            { to: '/services', label: 'Hizmetler' },
            { to: '/about', label: 'Hakkımızda' },
            { to: '/insights', label: 'İçgörüler' },
            { to: '/contact', label: 'İletişim' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block text-sm text-slate-300 py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function ServicesPrototype() {
  const shouldReduce = useReducedMotion();
  const [active, setActive] = useState<Cluster>('all');

  const filtered = active === 'all' ? SERVICES : SERVICES.filter((s) => s.cluster === active);

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* PAGE HERO */}
        <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-slate-800">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex items-center gap-2 text-xs text-slate-500">
                <li>
                  <Link to="/" className="hover:text-slate-300">
                    Ana Sayfa
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRightIcon />
                </li>
                <li className="text-amber-400" aria-current="page">
                  Hizmetler
                </li>
              </ol>
            </nav>
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.4 },
                  })}
            >
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Hizmetlerimiz</h1>
              <p className="text-slate-400">
                21 hizmet, 4 stratejik küme. Boyutunuza ve önceliğinize göre özelleştirilmiş
                danışmanlık.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CLUSTER FILTER TABS */}
        <section className="px-4 sm:px-6 lg:px-8 py-6 bg-neutral-800 sticky top-16 z-40 border-b border-slate-700">
          <div className="max-w-7xl mx-auto">
            <div
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              role="tablist"
              aria-label="Hizmet kümesi filtresi"
            >
              {CLUSTERS.map(({ id, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active === id}
                  onClick={() => setActive(id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    active === id
                      ? 'bg-amber-500 text-neutral-900'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-700'
                  }`}
                >
                  {label.tr}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section aria-label="Hizmet listesi" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(({ name, desc, slug, icon: Icon, color, cluster }) => {
                const clusterLabel = CLUSTERS.find((c) => c.id === cluster)?.label.tr ?? '';
                return (
                  <article
                    key={slug}
                    className="bg-neutral-800 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Icon size={20} className={color} aria-hidden="true" />
                      <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                        {clusterLabel}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm mb-2 leading-snug">{name.tr}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{desc.tr}</p>
                    <Link
                      to={`/services/${slug}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      Detay <ArrowRight size={12} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROCESS SECTION */}
        <section
          aria-labelledby="process-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="process-title" className="text-2xl font-bold text-center mb-12">
              Çalışma Sürecimiz
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROCESS.map(({ step, title, desc }) => (
                <div key={step} className="relative">
                  <div
                    className="text-5xl font-bold text-amber-400/20 mb-3 leading-none"
                    aria-hidden="true"
                  >
                    {step}
                  </div>
                  <h3 className="text-base font-semibold mb-2">{title.tr}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc.tr}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Hangi Hizmet Size Uygun?</h2>
            <p className="text-neutral-800 mb-8">
              30 dakikalık keşif görüşmesiyle birlikte belirleyelim.
            </p>
            <Link
              to="/discovery"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-amber-400 font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Keşif Görüşmesi Başlat <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer
        role="contentinfo"
        className="bg-neutral-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-12 text-center"
      >
        <p className="text-xs text-slate-600">
          © 2026 eCyPro Premium Consulting ·{' '}
          <Link to="/privacy" className="hover:text-slate-400">
            Gizlilik
          </Link>
        </p>
      </footer>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
