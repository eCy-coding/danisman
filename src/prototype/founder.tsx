import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Linkedin, Menu, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const COPY = {
  hero: {
    name: 'Emre Can Yalçın',
    title: { tr: 'Kurucu & Yönetim Danışmanı', en: 'Founder & Management Consultant' },
    credentials: ['MBA · Stratejik Yönetim', '10+ Yıl Danışmanlık', 'İstanbul · Londra · AB'],
    bio: {
      tr: "Emre Can Yalçın, Türkiye'nin önde gelen şirketlerine ve aile işletmelerine kurumsal dönüşüm, M&A stratejisi ve yönetişim danışmanlığı sunmaktadır. Big4 metodolojisini boutique çevikliğiyle birleştiren eCyPro'yu, Türkiye-AB köprüsünde değer yaratan bir danışmanlık modeli olarak tasarlamıştır.",
      en: "Emre Can Yalçın provides corporate transformation, M&A strategy, and governance advisory to Turkey's leading companies and family businesses. He designed eCyPro to combine Big4 methodology with boutique agility, creating a value-generating advisory model across the Turkey-EU bridge.",
    },
    bio2: {
      tr: "Kariyer boyunca 40'tan fazla kurumsal dönüşüm projesine liderlik etmiş; M&A, ESG entegrasyonu ve aile şirketi yönetişimi alanlarında derin uzmanlık geliştirmiştir. Türkiye'nin AB ile entegrasyon sürecinin yarattığı fırsatları erken fark eden az sayıdaki danışmanlardan biridir.",
      en: "Throughout his career, he has led more than 40 corporate transformation projects and developed deep expertise in M&A, ESG integration, and family business governance. He is one of the few advisors to have recognized early the opportunities created by Turkey's integration process with the EU.",
    },
  },
  philosophy: {
    title: { tr: 'Danışmanlık Felsefesi', en: 'Advisory Philosophy' },
    principles: [
      {
        title: { tr: 'Boutique Hız, Big4 Derinliği', en: 'Boutique Speed, Big4 Depth' },
        desc: {
          tr: 'Bürokratik süreçleri ortadan kaldırarak kurumsal düzeyde analitik kaliteyi gerçek zamanlı sunuyoruz. Kararlar hızlı alınır; uygulama hızlı başlar.',
          en: 'Eliminating bureaucratic processes to deliver institutional-grade analytical quality in real time. Decisions are made fast; implementation starts fast.',
        },
      },
      {
        title: { tr: 'Türkiye-AB Köprüsü', en: 'Turkey-EU Bridge' },
        desc: {
          tr: "İstanbul'dan Londra'ya çift pazardaki yerel bağlam ve küresel standartları tek çatıda birleştiriyoruz. Bu köprü, müşterilerimizin rekabet avantajıdır.",
          en: "We combine local context and global standards across dual markets from Istanbul to London. This bridge is our clients' competitive advantage.",
        },
      },
      {
        title: { tr: 'Kültür Önce, Strateji Sonra', en: 'Culture First, Strategy Second' },
        desc: {
          tr: 'Kültürel zemini anlamadan strateji tasarlamak, temelsiz bina inşa etmektir. Her projede insanı ve organizasyonel dinamiği önce görürüz.',
          en: 'Designing strategy without understanding cultural ground is like building a structure without a foundation. In every project, we see people and organizational dynamics first.',
        },
      },
    ],
  },
  letters: {
    title: { tr: 'Kurucu Mektupları', en: 'Founder Letters' },
    items: [
      {
        date: '2026-Q1',
        title: {
          tr: 'Belirsizlikte Liderlik: 2026 Yönetim Ajandası',
          en: 'Leadership in Uncertainty: The 2026 Management Agenda',
        },
        excerpt: {
          tr: 'Makroekonomik türbülans, küresel tedarik zinciri kırılmaları ve düzenleyici dönüşümün aynı anda yaşandığı bir dönemde liderlerin öncelikli soruları...',
          en: 'In a period of simultaneous macroeconomic turbulence, global supply chain disruptions, and regulatory transformation, the priority questions for leaders...',
        },
      },
      {
        date: '2025-Q4',
        title: {
          tr: "ESG'den Hesap Verebilirliğe: Raporlamada Yeni Dönem",
          en: 'From ESG to Accountability: A New Era in Reporting',
        },
        excerpt: {
          tr: 'CSRD\'nin yürürlüğe girmesiyle birlikte "sürdürülebilirlik" söylemi yerini ölçülebilir hesap verebilirliğe bırakıyor...',
          en: "With CSRD coming into force, the 'sustainability' narrative gives way to measurable accountability...",
        },
      },
      {
        date: '2025-Q2',
        title: {
          tr: 'Aile Şirketlerinde Nesil Devri: Sessiz Kriz',
          en: 'Generational Succession in Family Businesses: The Silent Crisis',
        },
        excerpt: {
          tr: "Türkiye'deki 50.000'den fazla aile şirketinin %70'i önümüzdeki on yılda nesil devrini deneyimleyecek. Bu dönüşümü stratejik avantaja çevirmek mümkün.",
          en: "More than 70% of Turkey's 50,000+ family businesses will experience generational succession in the next decade. Turning this transformation into strategic advantage is possible.",
        },
      },
    ],
  },
  timeline: [
    {
      year: '2015',
      event: {
        tr: 'Danışmanlık kariyerinin başlangıcı — Kurumsal strateji',
        en: 'Start of consulting career — Corporate strategy',
      },
    },
    {
      year: '2017',
      event: {
        tr: 'İlk M&A projesi: Türk sanayi holdingi çıkış stratejisi',
        en: 'First M&A project: Turkish industrial holding exit strategy',
      },
    },
    {
      year: '2019',
      event: {
        tr: 'Londra ofisi — Türkiye-AB yatırım köprüsü çalışmaları',
        en: 'London office — Turkey-EU investment bridge work',
      },
    },
    { year: '2021', event: { tr: "eCyPro'nun kuruluşu", en: 'Founding of eCyPro' } },
    {
      year: '2023',
      event: {
        tr: 'ESG & Sürdürülebilirlik pratiğinin genişletilmesi',
        en: 'Expansion of ESG & Sustainability practice',
      },
    },
    {
      year: '2025',
      event: {
        tr: '40+ tamamlanan proje; 5 sektör, 2 kıta',
        en: '40+ completed projects; 5 sectors, 2 continents',
      },
    },
  ],
  linkedin: {
    cta: { tr: "LinkedIn'de Bağlanalım", en: "Let's Connect on LinkedIn" },
    sub: {
      tr: 'Yönetim danışmanlığı, strateji ve liderlik üzerine düşünceler.',
      en: 'Thoughts on management consulting, strategy, and leadership.',
    },
    btn: { tr: 'Bağlantı Kur', en: 'Connect' },
  },
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

export default function FounderPrototype() {
  const shouldReduce = useReducedMotion();
  const fadeIn = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* FOUNDER HERO — Split layout */}
        <section aria-labelledby="founder-name" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-12 items-start">
            <motion.div {...fadeIn} className="md:col-span-3">
              <span className="text-xs text-amber-400 tracking-widest uppercase border border-amber-500/30 px-3 py-1 rounded-full">
                Kurucu
              </span>
              <h1 id="founder-name" className="text-3xl sm:text-4xl font-bold mt-4 mb-2">
                {COPY.hero.name}
              </h1>
              <p className="text-slate-400 mb-4">{COPY.hero.title.tr}</p>
              <ul className="flex flex-wrap gap-2 mb-8">
                {COPY.hero.credentials.map((c) => (
                  <li
                    key={c}
                    className="text-xs bg-neutral-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300"
                  >
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-slate-300 leading-relaxed mb-4">{COPY.hero.bio.tr}</p>
              <p className="text-slate-400 leading-relaxed">{COPY.hero.bio2.tr}</p>
            </motion.div>
            <div className="md:col-span-2">
              {/* Photo placeholder — B4: replace with actual founder photo */}
              <div
                className="bg-slate-700 rounded-2xl aspect-[3/4] flex items-center justify-center border border-slate-600"
                aria-label="Emre Can Yalçın fotoğrafı"
              >
                <span className="text-4xl font-bold text-slate-500">EC</span>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section
          aria-labelledby="philosophy-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="philosophy-title" className="text-2xl font-bold mb-12">
              {COPY.philosophy.title.tr}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {COPY.philosophy.principles.map(({ title, desc }) => (
                <div key={title.tr} className="border-l-4 border-amber-500 pl-6 py-2">
                  <h3 className="font-semibold mb-3">{title.tr}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc.tr}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOUNDER LETTERS */}
        <section aria-labelledby="letters-title" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 id="letters-title" className="text-2xl font-bold mb-12">
              {COPY.letters.title.tr}
            </h2>
            <div className="space-y-4">
              {COPY.letters.items.map(({ date, title, excerpt }) => (
                <article
                  key={title.tr}
                  className="bg-neutral-800 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <time className="text-xs text-amber-400 font-medium">{date}</time>
                      <h3 className="font-semibold mt-1 mb-2">{title.tr}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{excerpt.tr}</p>
                    </div>
                    <Link
                      to="/insights"
                      className="shrink-0 text-amber-400 hover:text-amber-300"
                      aria-label={`${title.tr} mektubunu oku`}
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section
          aria-labelledby="timeline-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-3xl mx-auto">
            <h2 id="timeline-title" className="text-2xl font-bold mb-12">
              Kariyer Yolculuğu
            </h2>
            <ol className="space-y-0">
              {COPY.timeline.map(({ year, event }, i) => (
                <li key={year} className="relative flex gap-6 pb-8 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-3 h-3 rounded-full bg-amber-500 z-10 mt-1 shrink-0"
                      aria-hidden="true"
                    />
                    {i < COPY.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-slate-700 mt-1" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-2">
                    <time className="text-xs font-bold text-amber-400">{year}</time>
                    <p className="text-sm text-slate-300 mt-1">{event.tr}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* LINKEDIN CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-lg mx-auto bg-neutral-800 border border-slate-700 rounded-2xl p-8 text-center">
            <Linkedin size={32} className="text-blue-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold mb-2">{COPY.linkedin.cta.tr}</h2>
            <p className="text-sm text-slate-400 mb-6">{COPY.linkedin.sub.tr}</p>
            <a
              href="https://linkedin.com/in/emrecnyalcin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {COPY.linkedin.btn.tr}
              <ExternalLink size={14} />
            </a>
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
