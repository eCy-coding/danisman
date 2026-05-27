import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Menu,
  X,
  TrendingUp,
  Users,
  Globe,
  Award,
  Zap,
  Shield,
  ChevronRight,
  Linkedin,
  Twitter,
  BookOpen,
  Building2,
  Leaf,
  Cpu,
  Home,
} from 'lucide-react';

const COPY = {
  nav: {
    logo: 'eCyPro',
    links: [
      { label: { tr: 'Hizmetler', en: 'Services' }, to: '/services' },
      { label: { tr: 'Hakkımızda', en: 'About' }, to: '/about' },
      { label: { tr: 'İçgörüler', en: 'Insights' }, to: '/insights' },
      { label: { tr: 'İletişim', en: 'Contact' }, to: '/contact' },
    ],
    cta: { tr: 'Keşif Görüşmesi', en: 'Discovery Call' },
  },
  hero: {
    badge: { tr: 'Premium Consulting · eCyPro', en: 'Premium Consulting · eCyPro' },
    title: {
      line1: { tr: 'Vizyon. Strateji.', en: 'Vision. Strategy.' },
      highlight: { tr: 'Sürdürülebilir', en: 'Sustainable' },
      line2: { tr: 'Sonuç.', en: 'Outcomes.' },
    },
    sub: {
      tr: "Türkiye'nin Big4-alternatif boutique danışmanlık firması. Organizasyonel dönüşüm, stratejik danışmanlık ve kültür mühendisliği ile lider organizasyonların yanındayız.",
      en: "Turkey's Big4-alternative boutique advisory firm. We partner with leading organizations on organizational transformation, strategic advisory, and culture engineering.",
    },
    cta1: { tr: 'Keşif Görüşmesi Başlat', en: 'Start Discovery Call' },
    cta2: { tr: 'Hizmetlerimiz', en: 'Our Services' },
    stats: [
      { value: '5+', label: { tr: 'Yıl Deneyim', en: 'Years' }, icon: TrendingUp },
      { value: '120+', label: { tr: 'Stratejik Proje', en: 'Projects' }, icon: Users },
      { value: 'TR·AB', label: { tr: 'Pazar Erişimi', en: 'Market Reach' }, icon: Globe },
      { value: '95%', label: { tr: 'Memnuniyet', en: 'Satisfaction' }, icon: Award },
    ],
  },
  valueProp: {
    title: { tr: 'Neden eCyPro?', en: 'Why eCyPro?' },
    items: [
      {
        icon: Zap,
        title: { tr: 'Boutique Hız', en: 'Boutique Speed' },
        desc: {
          tr: 'Bürokratik süreçler olmadan, stratejik kararları gerçek zamanlı hayata geçiririz.',
          en: 'We execute strategic decisions in real time, free from bureaucratic overhead.',
        },
      },
      {
        icon: Shield,
        title: { tr: 'Big4 Derinliği', en: 'Big4 Depth' },
        desc: {
          tr: 'Sektör uzmanları ve metodoloji disipliniyle kurumsal kalitede analiz üretiriz.',
          en: 'Institutional-grade analysis delivered by sector experts with methodological rigor.',
        },
      },
      {
        icon: Globe,
        title: { tr: 'Türkiye-AB Köprüsü', en: 'Turkey-EU Bridge' },
        desc: {
          tr: "İstanbul'dan Londra'ya çift pazarda yerel bağlam ve küresel standart bir arada.",
          en: 'Local context meets global standards — from Istanbul to London, across dual markets.',
        },
      },
    ],
  },
  services: {
    title: { tr: 'Hizmet Kümelerimiz', en: 'Service Clusters' },
    clusters: [
      {
        icon: Building2,
        cluster: { tr: 'M&A & Kurumsal Dönüşüm', en: 'M&A & Corporate Transformation' },
        items: [
          'Birleşme ve Satın Alma',
          'Kurumsal Yeniden Yapılanma',
          'Sermaye Piyasaları',
          'Due Diligence',
        ],
        slug: 'ma-kurumsal-donusum',
        color: 'text-amber-400',
      },
      {
        icon: Leaf,
        cluster: { tr: 'ESG & Sürdürülebilirlik', en: 'ESG & Sustainability' },
        items: [
          'ESG Strateji & Raporlama',
          'İklim Riski Yönetimi',
          'Etki Ölçümü',
          'Paydaş Katılımı',
        ],
        slug: 'esg-surdurulebilirlik',
        color: 'text-emerald-400',
      },
      {
        icon: Cpu,
        cluster: { tr: 'Fintech & Dijital', en: 'Fintech & Digital' },
        items: [
          'Dijital Dönüşüm',
          'Fintech Entegrasyonu',
          'Düzenleyici Uyum',
          'Veri & AI Danışmanlığı',
        ],
        slug: 'fintech-dijital',
        color: 'text-blue-400',
      },
      {
        icon: Home,
        cluster: { tr: 'Aile Şirketi Yönetişimi', en: 'Family Business Governance' },
        items: ['Aile Anayasası', 'Nesiller Arası Geçiş', 'Aile Konseyi', 'Veraset Planlaması'],
        slug: 'aile-sirketi',
        color: 'text-violet-400',
      },
    ],
  },
  founderSnippet: {
    quote: {
      tr: '"Danışmanlık, rapordan önce insandır. Kültürü anlamadan strateji kurmak, temelsiz bina inşa etmektir."',
      en: '"Consulting is about people before reports. Building strategy without understanding culture is like constructing a building without a foundation."',
    },
    name: 'Emre Can Yalçın',
    title: { tr: 'Kurucu & Yönetim Danışmanı', en: 'Founder & Management Consultant' },
    cta: { tr: 'Tam Mektubu Oku', en: 'Read Full Letter' },
  },
  insights: {
    title: { tr: 'Son İçgörüler', en: 'Latest Insights' },
    articles: [
      {
        tag: { tr: 'M&A', en: 'M&A' },
        date: '2026-04-15',
        title: {
          tr: 'KOBİ Birleşmelerinde Kültürel Uyum',
          en: 'Cultural Alignment in SME Mergers',
        },
        excerpt: {
          tr: "Başarılı M&A süreçlerinin %70'i kültürel entegrasyonla belirlenir.",
          en: '70% of successful M&A outcomes are determined by cultural integration quality.',
        },
      },
      {
        tag: { tr: 'ESG', en: 'ESG' },
        date: '2026-03-28',
        title: { tr: 'CSRD ve Türkiye İhracatçıları', en: 'CSRD and Turkish Exporters' },
        excerpt: {
          tr: "AB'nin CSRD direktifi Türk ihracatçıları için zorunlu bir dönüşüm kapısı açıyor.",
          en: "The EU's CSRD directive opens a mandatory transformation gate for Turkish exporters.",
        },
      },
      {
        tag: { tr: 'Fintech', en: 'Fintech' },
        date: '2026-03-10',
        title: {
          tr: "Türkiye'de Açık Bankacılık Fırsatları",
          en: 'Open Banking Opportunities in Turkey',
        },
        excerpt: {
          tr: 'BDDK düzenlemeleri olgunlaşırken, açık bankacılık ekosistemine girmek için kritik bir pencere açılıyor.',
          en: 'As BDDK regulations mature, a critical window opens to enter the open banking ecosystem.',
        },
      },
    ],
    cta: { tr: 'Tüm İçgörüler', en: 'All Insights' },
  },
  ctaBanner: {
    title: { tr: 'Stratejik Yolculuğunuzu Başlatın', en: 'Start Your Strategic Journey' },
    sub: {
      tr: '30 dakika. Taahhütsüz. Stratejik netlik.',
      en: '30 minutes. No obligation. Strategic clarity.',
    },
    cta: { tr: 'Keşif Görüşmesi Rezervasyonu', en: 'Book Discovery Call' },
  },
  footer: {
    tagline: {
      tr: "Turkey's Big4-Alternative Boutique Advisory",
      en: "Turkey's Big4-Alternative Boutique Advisory",
    },
    cols: [
      {
        title: { tr: 'Hizmetler', en: 'Services' },
        links: [
          { label: { tr: 'M&A Danışmanlık', en: 'M&A Advisory' }, to: '/services/ma' },
          { label: { tr: 'ESG', en: 'ESG' }, to: '/services/esg' },
          { label: { tr: 'Fintech', en: 'Fintech' }, to: '/services/fintech' },
          { label: { tr: 'Aile Şirketi', en: 'Family Business' }, to: '/services/aile' },
        ],
      },
      {
        title: { tr: 'Şirket', en: 'Company' },
        links: [
          { label: { tr: 'Hakkımızda', en: 'About' }, to: '/about' },
          { label: { tr: 'Kurucu', en: 'Founder' }, to: '/founder' },
          { label: { tr: 'Kariyer', en: 'Careers' }, to: '/careers' },
        ],
      },
      {
        title: { tr: 'İçgörüler', en: 'Insights' },
        links: [
          { label: { tr: 'Blog', en: 'Blog' }, to: '/insights' },
          { label: { tr: 'Vaka Çalışmaları', en: 'Case Studies' }, to: '/case-studies' },
        ],
      },
      {
        title: { tr: 'Yasal', en: 'Legal' },
        links: [
          { label: { tr: 'Gizlilik', en: 'Privacy' }, to: '/privacy' },
          { label: { tr: 'Şartlar', en: 'Terms' }, to: '/terms' },
          { label: { tr: 'Çerezler', en: 'Cookies' }, to: '/cookies' },
        ],
      },
    ],
    kvkk: {
      tr: 'Kişisel verileriniz KVKK kapsamında işlenmektedir.',
      en: 'Personal data processed under KVKK & GDPR.',
    },
    copy: '© 2026 eCyPro Premium Consulting. Tüm hakları saklıdır.',
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
};

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <nav
      role="navigation"
      aria-label="Ana navigasyon"
      className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-bold text-amber-400 tracking-tight">
          {COPY.nav.logo}
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {COPY.nav.links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="text-sm text-slate-300 hover:text-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                {l.label.tr}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/discovery"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-900 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {COPY.nav.cta.tr}
          <ArrowRight size={14} />
        </Link>
        <button
          className="md:hidden text-slate-300 hover:text-slate-50 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-neutral-900 border-t border-slate-800 px-4 py-4 space-y-3">
          {COPY.nav.links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block text-sm text-slate-300 py-2"
              onClick={() => setOpen(false)}
            >
              {l.label.tr}
            </Link>
          ))}
          <Link
            to="/discovery"
            className="block w-full text-center px-4 py-2 bg-amber-500 text-neutral-900 text-sm font-semibold rounded-lg mt-2"
            onClick={() => setOpen(false)}
          >
            {COPY.nav.cta.tr}
          </Link>
        </div>
      )}
    </nav>
  );
}

export default function HomePrototype() {
  const shouldReduce = useReducedMotion();
  const motionProps = shouldReduce ? {} : fadeUp;

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* HERO — B4: GSAP TextReveal + parallax on bg */}
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-28"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div {...motionProps} className="max-w-3xl">
              <span className="inline-block text-xs font-medium tracking-widest text-amber-400 uppercase mb-4 border border-amber-500/30 px-3 py-1 rounded-full">
                {COPY.hero.badge.tr}
              </span>
              <h1
                id="hero-title"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                {COPY.hero.title.line1.tr}{' '}
                <span className="text-amber-400">{COPY.hero.title.highlight.tr}</span>{' '}
                {COPY.hero.title.line2.tr}
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
                {COPY.hero.sub.tr}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/discovery"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-900 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  {COPY.hero.cta1.tr}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 text-slate-200 hover:border-slate-400 rounded-xl transition-colors"
                >
                  {COPY.hero.cta2.tr}
                  <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              {...(shouldReduce
                ? {}
                : { ...fadeUp, transition: { ...fadeUp.transition, delay: 0.2 } })}
              className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800 rounded-2xl overflow-hidden border border-slate-700"
            >
              {COPY.hero.stats.map(({ value, label, icon: Icon }) => (
                <div key={value} className="bg-neutral-900 px-6 py-5 flex flex-col gap-1">
                  <Icon size={16} className="text-amber-400 mb-1" aria-hidden="true" />
                  <span className="text-2xl font-bold text-slate-50">{value}</span>
                  <span className="text-xs text-slate-400">{label.tr}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* VALUE PROP — B4: stagger reveal on scroll */}
        <section
          aria-labelledby="value-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="value-title" className="text-2xl sm:text-3xl font-bold text-center mb-12">
              {COPY.valueProp.title.tr}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {COPY.valueProp.items.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title.tr}
                  {...motionProps}
                  className="bg-neutral-900 rounded-2xl p-6 border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-amber-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title.tr}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc.tr}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES PREVIEW — B4: hover magnetic cards */}
        <section aria-labelledby="services-title" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 id="services-title" className="text-2xl sm:text-3xl font-bold">
                {COPY.services.title.tr}
              </h2>
              <Link
                to="/services"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Tümü <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COPY.services.clusters.map(({ icon: Icon, cluster, items, slug, color }) => (
                <Link
                  key={slug}
                  to={`/services/${slug}`}
                  className="group bg-neutral-800 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/40 transition-colors block"
                >
                  <Icon size={24} className={`${color} mb-4`} aria-hidden="true" />
                  <h3 className="text-sm font-semibold mb-3">{cluster.tr}</h3>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs text-amber-400 group-hover:gap-2 transition-all">
                    Detay <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FOUNDER LETTER SNIPPET — B4: scroll-triggered fade */}
        <section
          aria-labelledby="founder-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-3xl mx-auto text-center">
            <div
              className="w-20 h-20 rounded-full bg-slate-700 mx-auto mb-6 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-2xl font-bold text-slate-400">EC</span>
            </div>
            <blockquote className="font-display text-xl sm:text-2xl italic text-slate-200 leading-relaxed mb-6">
              {COPY.founderSnippet.quote.tr}
            </blockquote>
            <cite className="not-italic">
              <span className="block font-semibold text-slate-50">{COPY.founderSnippet.name}</span>
              <span className="text-sm text-slate-400">{COPY.founderSnippet.title.tr}</span>
            </cite>
            <Link
              to="/founder"
              id="founder-title"
              className="mt-6 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
            >
              {COPY.founderSnippet.cta.tr} <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* INSIGHTS PREVIEW */}
        <section aria-labelledby="insights-title" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 id="insights-title" className="text-2xl sm:text-3xl font-bold">
                {COPY.insights.title.tr}
              </h2>
              <Link
                to="/insights"
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {COPY.insights.cta.tr} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {COPY.insights.articles.map(({ tag, date, title, excerpt }) => (
                <article
                  key={title.tr}
                  className="bg-neutral-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-amber-500/30 transition-colors"
                >
                  <div
                    className="h-36 bg-slate-700 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <BookOpen size={32} className="text-slate-500" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-amber-400 font-medium border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {tag.tr}
                      </span>
                      <time className="text-xs text-slate-500" dateTime={date}>
                        {date}
                      </time>
                    </div>
                    <h3 className="font-semibold mb-2 text-sm leading-snug">{title.tr}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{excerpt.tr}</p>
                    <Link
                      to="/insights"
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      Devamını Oku <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
              {COPY.ctaBanner.title.tr}
            </h2>
            <p className="text-neutral-800 mb-8">{COPY.ctaBanner.sub.tr}</p>
            <Link
              to="/discovery"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-amber-400 font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              {COPY.ctaBanner.cta.tr}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        role="contentinfo"
        className="bg-neutral-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 pt-16 pb-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="text-xl font-bold text-amber-400">
                {COPY.nav.logo}
              </Link>
              <p className="mt-2 text-xs text-slate-500">{COPY.footer.tagline.tr}</p>
              <div className="flex gap-3 mt-4">
                <a
                  href="https://linkedin.com"
                  aria-label="LinkedIn"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href="https://twitter.com"
                  aria-label="Twitter"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Twitter size={16} />
                </a>
              </div>
            </div>
            {COPY.footer.cols.map((col) => (
              <nav key={col.title.tr} aria-label={col.title.tr}>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                  {col.title.tr}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {l.label.tr}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between gap-2">
            <p className="text-xs text-slate-600">{COPY.footer.copy}</p>
            <p className="text-xs text-slate-600">{COPY.footer.kvkk.tr}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
