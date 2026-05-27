import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Share2,
  Linkedin,
  Twitter,
  ArrowLeft,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';

// Template — wire to actual CMS slug in B4
const ARTICLE = {
  slug: 'kmu-birlesmelerinde-kulturel-uyum',
  tag: { id: 'ma', label: 'M&A' },
  date: '2026-04-15',
  readTime: 8,
  author: { name: 'Emre Can Yalçın', title: 'Kurucu & Yönetim Danışmanı' },
  title: { tr: 'KOBİ Birleşmelerinde Kültürel Uyum', en: 'Cultural Alignment in SME Mergers' },
  intro: {
    tr: "Başarılı M&A süreçlerinin %70'i kültürel entegrasyonla belirlenir. Finansal due diligence'a harcanan zamanın yalnızca %10'u kültürel due diligence'a ayrılmasına rağmen, başarısız birleşmelerin en sık görülen nedeni kültürel uyumsuzluktur.",
    en: '70% of successful M&A outcomes are determined by cultural integration. While only 10% of the time spent on financial due diligence is allocated to cultural due diligence, cultural misalignment is the most common cause of failed mergers.',
  },
  sections: [
    {
      heading: { tr: 'Neden Kültürel Uyum Kritik?', en: 'Why Is Cultural Alignment Critical?' },
      body: {
        tr: 'İki organizasyonun birleşmesi yalnızca finansal ve operasyonel bir süreç değildir. İnsanların çalışma biçimleri, karar alma mekanizmaları, liderlik anlayışları ve örtük normları — kısaca organizasyonel kültür — entegrasyon başarısının belirleyicisidir.\n\nMcKinsey araştırmaları, M&A değer kaybının %70\'inin insan ve kültür faktörlerinden kaynaklandığını göstermektedir. Ancak çoğu M&A ekibi, kültürel değerlendirmeyi "soft" bir faaliyet olarak görerek ertelemekte ya da tamamen göz ardı etmektedir.',
        en: '',
      },
    },
    {
      heading: {
        tr: 'Kültürel Due Diligence Nasıl Yapılır?',
        en: 'How to Conduct Cultural Due Diligence?',
      },
      body: {
        tr: 'Kültürel due diligence süreci üç temel aşamadan oluşmaktadır:\n\n1. **Kültür Haritalama**: Her iki organizasyonun değerleri, normları ve davranış örüntülerinin belgelenmesi\n2. **Gap Analizi**: Kritik farklılıkların ve entegrasyon risklerinin tespiti\n3. **Entegrasyon Planı**: Kültürel köprü kurma stratejilerinin tasarımı\n\nBu sürecin en önemli aracı, yapılandırılmış niteliksel görüşmeler ve gözlem tabanlı değerlendirmedir.',
        en: '',
      },
    },
    {
      heading: { tr: 'eCyPro Yaklaşımı', en: 'eCyPro Approach' },
      body: {
        tr: "eCyPro'nun kültürel entegrasyon metodolojisi, Big4 rigor'u ile butik çevikliği birleştirmektedir. Due diligence sürecinin ilk haftasında başlayan kültürel değerlendirme, post-merger entegrasyonun 100. gününe kadar izlenmektedir.\n\nTürkiye-AB köprüsündeki deneyimimiz, çapraz kültürel entegrasyonlarda özellikle kritik olan bir perspektif sunmaktadır.",
        en: '',
      },
    },
  ],
  relatedArticles: [
    {
      slug: 'nesil-gecisinde-aile-sirketleri',
      title: { tr: 'Nesil Geçişinde Aile Şirketleri', en: '' },
      tag: 'Aile Şirketi',
    },
    {
      slug: 'csrd-turk-ihracatcilari',
      title: { tr: 'CSRD ve Türkiye İhracatçıları', en: '' },
      tag: 'ESG',
    },
  ],
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
        <Link to="/" className="text-xl font-bold text-amber-400">
          eCyPro
        </Link>
        <ul className="hidden md:flex items-center gap-8">
          {[
            { to: '/services', label: 'Hizmetler' },
            { to: '/about', label: 'Hakkımızda' },
            { to: '/insights', label: 'İçgörüler' },
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

export default function InsightDetailPrototype() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* BREADCRUMB */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="max-w-4xl mx-auto">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <li>
                  <Link to="/" className="hover:text-slate-300">
                    Ana Sayfa
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <li>
                  <Link to="/insights" className="hover:text-slate-300">
                    İçgörüler
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <li className="text-amber-400 truncate max-w-xs" aria-current="page">
                  {ARTICLE.title.tr}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* ARTICLE HEADER */}
        <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.4 },
                  })}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs text-amber-400 font-medium border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {ARTICLE.tag.label}
                </span>
                <time className="text-xs text-slate-500" dateTime={ARTICLE.date}>
                  {ARTICLE.date}
                </time>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={10} aria-hidden="true" />
                  {ARTICLE.readTime} dk okuma
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{ARTICLE.title.tr}</h1>

              {/* Author + share row */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-t border-b border-slate-800 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-400"
                    aria-hidden="true"
                  >
                    EC
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ARTICLE.author.name}</p>
                    <p className="text-xs text-slate-500">{ARTICLE.author.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" role="group" aria-label="Paylaş">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Share2 size={12} aria-hidden="true" />
                    Paylaş:
                  </span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                    aria-label="LinkedIn'de paylaş"
                  >
                    <Linkedin size={16} />
                  </button>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-sky-400 transition-colors"
                    aria-label="Twitter'da paylaş"
                  >
                    <Twitter size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* HERO IMAGE PLACEHOLDER */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div
            className="max-w-4xl mx-auto h-56 sm:h-72 bg-slate-700 rounded-2xl flex items-center justify-center"
            aria-hidden="true"
          >
            <BookOpen size={40} className="text-slate-500" />
          </div>
        </div>

        {/* ARTICLE BODY */}
        <article className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-2xl mx-auto">
            {/* Intro */}
            <p className="text-base text-slate-200 leading-relaxed font-medium mb-8 border-l-4 border-amber-500 pl-4">
              {ARTICLE.intro.tr}
            </p>

            {/* Sections */}
            {ARTICLE.sections.map(({ heading, body }) => (
              <section key={heading.tr} className="mb-8">
                <h2 className="text-lg font-bold mb-3">{heading.tr}</h2>
                {body.tr.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed mb-3">
                    {para}
                  </p>
                ))}
              </section>
            ))}

            {/* CTA block within article */}
            <div className="bg-neutral-800 border border-amber-500/30 rounded-2xl p-6 my-10 text-center">
              <h3 className="font-semibold mb-2">M&A stratejinizi güçlendirin</h3>
              <p className="text-sm text-slate-400 mb-4">
                30 dakikalık keşif görüşmesinde projenizi değerlendirelim.
              </p>
              <Link
                to="/discovery"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-neutral-900 font-semibold text-sm rounded-xl hover:bg-amber-400 transition-colors"
              >
                Keşif Görüşmesi <ArrowRight size={14} />
              </Link>
            </div>

            {/* Share footer */}
            <div className="border-t border-slate-800 pt-6 flex items-center justify-between">
              <Link
                to="/insights"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft size={14} /> Tüm İçgörüler
              </Link>
              <div className="flex items-center gap-2" role="group" aria-label="Paylaş">
                <span className="text-xs text-slate-500">Paylaş:</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-blue-400"
                  aria-label="LinkedIn'de paylaş"
                >
                  <Linkedin size={16} />
                </button>
                <button
                  type="button"
                  className="text-slate-400 hover:text-sky-400"
                  aria-label="Twitter'da paylaş"
                >
                  <Twitter size={16} />
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* RELATED ARTICLES */}
        <section
          aria-labelledby="related-title"
          className="px-4 sm:px-6 lg:px-8 py-12 bg-neutral-800"
        >
          <div className="max-w-4xl mx-auto">
            <h2 id="related-title" className="text-lg font-bold mb-6">
              İlgili İçgörüler
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {ARTICLE.relatedArticles.map(({ slug, title, tag }) => (
                <Link
                  key={slug}
                  to={`/insights/${slug}`}
                  className="bg-neutral-900 rounded-xl p-4 border border-slate-700/50 hover:border-amber-500/30 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs text-amber-400 font-medium mb-1 block">{tag}</span>
                    <span className="text-sm font-medium">{title.tr}</span>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-4"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
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
