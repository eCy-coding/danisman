import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useScrollReveal } from '../lib/motion/useScrollReveal';
import { ArrowRight, BookOpen, Clock, Menu, X, Search } from 'lucide-react';

type Tag = 'all' | 'ma' | 'esg' | 'fintech' | 'aile' | 'liderlik';

const TAGS: { id: Tag; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'ma', label: 'M&A' },
  { id: 'esg', label: 'ESG' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'aile', label: 'Aile Şirketi' },
  { id: 'liderlik', label: 'Liderlik' },
];

const ARTICLES = [
  {
    slug: 'kmu-birlesmelerinde-kulturel-uyum',
    tag: 'ma' as Tag,
    date: '2026-04-15',
    readTime: 8,
    title: { tr: 'KOBİ Birleşmelerinde Kültürel Uyum', en: 'Cultural Alignment in SME Mergers' },
    excerpt: {
      tr: "Başarılı M&A süreçlerinin %70'i kültürel entegrasyonla belirlenir. Peki bu entegrasyon nasıl ölçülür?",
      en: '70% of successful M&A outcomes are determined by cultural integration. How is this integration measured?',
    },
  },
  {
    slug: 'csrd-turk-ihracatcilari',
    tag: 'esg' as Tag,
    date: '2026-03-28',
    readTime: 10,
    title: { tr: 'CSRD ve Türkiye İhracatçıları', en: 'CSRD and Turkish Exporters' },
    excerpt: {
      tr: "AB'nin CSRD direktifi Türk ihracatçılar için zorunlu bir dönüşüm kapısı açıyor.",
      en: "The EU's CSRD directive opens a mandatory transformation gate for Turkish exporters.",
    },
  },
  {
    slug: 'acik-bankacilik-firsatlari',
    tag: 'fintech' as Tag,
    date: '2026-03-10',
    readTime: 7,
    title: {
      tr: "Türkiye'de Açık Bankacılık Fırsatları",
      en: 'Open Banking Opportunities in Turkey',
    },
    excerpt: {
      tr: 'BDDK düzenlemeleri olgunlaşırken kritik bir pencere açılıyor.',
      en: 'As BDDK regulations mature, a critical window opens.',
    },
  },
  {
    slug: 'nesil-gecisinde-aile-sirketleri',
    tag: 'aile' as Tag,
    date: '2026-02-20',
    readTime: 12,
    title: {
      tr: 'Nesil Geçişinde Aile Şirketleri',
      en: 'Family Businesses in Generational Transition',
    },
    excerpt: {
      tr: "Türkiye'deki 50.000+ aile şirketinin çoğu önümüzdeki 10 yılda nesil devri yaşayacak.",
      en: "Most of Turkey's 50,000+ family businesses will experience generational succession in the next 10 years.",
    },
  },
  {
    slug: 'belirsizlikte-liderlik',
    tag: 'liderlik' as Tag,
    date: '2026-02-05',
    readTime: 9,
    title: { tr: 'Belirsizlikte Liderlik', en: 'Leadership in Uncertainty' },
    excerpt: {
      tr: 'Makroekonomik türbülans döneminde liderlerin öncelikli soruları ve yanıtları.',
      en: 'Priority questions and answers for leaders during macroeconomic turbulence.',
    },
  },
  {
    slug: 'esg-raporlama-cercevesi',
    tag: 'esg' as Tag,
    date: '2026-01-18',
    readTime: 11,
    title: { tr: 'ESG Raporlama Çerçevesi Seçimi', en: 'Choosing an ESG Reporting Framework' },
    excerpt: {
      tr: 'GRI, SASB, TCFD veya CSRD? Doğru çerçeveyi seçmek stratejik bir karar.',
      en: 'GRI, SASB, TCFD, or CSRD? Choosing the right framework is a strategic decision.',
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
    </nav>
  );
}

export default function InsightsPrototype() {
  const shouldReduce = useReducedMotion();
  const { ref: gridRef } = useScrollReveal<HTMLDivElement>({ stagger: 0.06, selector: 'article' });
  const [activeTag, setActiveTag] = useState<Tag>('all');
  const [search, setSearch] = useState('');

  const filtered = ARTICLES.filter((a) => {
    const matchTag = activeTag === 'all' || a.tag === activeTag;
    const matchSearch = !search || a.title.tr.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* HERO */}
        <section
          aria-labelledby="insights-title"
          className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-slate-800"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.45 },
                  })}
            >
              <h1 id="insights-title" className="text-3xl sm:text-4xl font-bold mb-2">
                İçgörüler
              </h1>
              <p className="text-slate-400">Strateji, dönüşüm ve sektör analizleri.</p>
            </motion.div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İçgörü ara..."
                aria-label="İçgörülerde ara"
                className="w-full bg-neutral-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </section>

        {/* TAG FILTERS */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 bg-neutral-800 border-b border-slate-700 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto">
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Konu filtresi"
            >
              {TAGS.map(({ id, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTag === id}
                  onClick={() => setActiveTag(id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${activeTag === id ? 'bg-amber-500 text-neutral-900' : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ARTICLE GRID */}
        <section aria-label="Makale listesi" className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <BookOpen size={40} className="mx-auto mb-4 opacity-30" aria-hidden="true" />
                <p>Bu kriterlere uygun içgörü bulunamadı.</p>
              </div>
            ) : (
              <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(({ slug, tag, date, readTime, title, excerpt }) => {
                  const tagLabel = TAGS.find((t) => t.id === tag)?.label ?? tag;
                  return (
                    <article
                      key={slug}
                      className="group bg-neutral-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-amber-500/30 transition-colors flex flex-col"
                    >
                      <div
                        className="h-40 bg-slate-700 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <BookOpen size={28} className="text-slate-500" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-amber-400 font-medium border border-amber-500/30 px-2 py-0.5 rounded-full">
                            {tagLabel}
                          </span>
                          <time className="text-xs text-slate-500" dateTime={date}>
                            {date}
                          </time>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={10} aria-hidden="true" />
                            {readTime}dk
                          </span>
                        </div>
                        <h2 className="font-semibold text-sm leading-snug mb-2">{title.tr}</h2>
                        <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-4">
                          {excerpt.tr}
                        </p>
                        <Link
                          to={`/insights/${slug}`}
                          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-auto"
                        >
                          Devamını Oku <ArrowRight size={12} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
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
