import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Target,
  Eye,
  Zap,
  Shield,
  Users,
  Globe,
  Scale,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const MANIFESTO_QUOTES = [
  {
    tr: '"Big4\'ün bürokrasisini değil, derinliğini alıyoruz."',
    en: '"We take Big4\'s depth, not its bureaucracy."',
  },
  {
    tr: '"Startup\'ın hızını değil, çevikliğini alıyoruz."',
    en: '"We take the startup\'s agility, not its chaos."',
  },
  {
    tr: '"Türk şirketlerine AB standartlarında erişim açıyoruz."',
    en: '"We open EU-standard access to Turkish companies."',
  },
  {
    tr: '"Kültürü anlamadan strateji kurmuyoruz."',
    en: '"We don\'t build strategy without understanding culture."',
  },
];

const COMPARISON = [
  {
    feature: { tr: 'Karar Hızı', en: 'Decision Speed' },
    big4: { tr: 'Haftalarca', en: 'Weeks' },
    boutique: { tr: 'Günler', en: 'Days' },
    ecypro: { tr: 'Saatler → Günler', en: 'Hours → Days' },
  },
  {
    feature: { tr: 'Erişilebilirlik', en: 'Accessibility' },
    big4: { tr: 'Kıdemli Partner Uzak', en: 'Senior Partner Distant' },
    boutique: { tr: 'Sınırlı Kapasite', en: 'Limited Capacity' },
    ecypro: { tr: 'Kurucu Erişimi', en: 'Founder Access' },
  },
  {
    feature: { tr: 'Kültürel Bağlam', en: 'Cultural Context' },
    big4: { tr: 'Globalleştirilmiş', en: 'Globalized' },
    boutique: { tr: 'Yerel Odaklı', en: 'Local Focused' },
    ecypro: { tr: 'TR + AB İkili', en: 'TR + EU Dual' },
  },
  {
    feature: { tr: 'Fiyat Modeli', en: 'Price Model' },
    big4: { tr: 'Yüksek / Esnek Değil', en: 'High / Inflexible' },
    boutique: { tr: 'Değişken', en: 'Variable' },
    ecypro: { tr: 'Değer Bazlı', en: 'Value-Based' },
  },
  {
    feature: { tr: 'Kapsam', en: 'Scope' },
    big4: { tr: 'Geniş / Jenerik', en: 'Wide / Generic' },
    boutique: { tr: 'Niş / Dar', en: 'Niche / Narrow' },
    ecypro: { tr: '21 Hizmet, 4 Küme', en: '21 Services, 4 Clusters' },
  },
];

const VALUES = [
  {
    icon: Target,
    title: { tr: 'Sonuç Odaklılık', en: 'Result-Driven' },
    desc: {
      tr: "Her projeyi ölçülebilir KPI'lar ile yönetiriz.",
      en: 'We manage every project with measurable KPIs.',
    },
  },
  {
    icon: Shield,
    title: { tr: 'Güvenilirlik', en: 'Reliability' },
    desc: {
      tr: 'Her koşulda güvenilen partner olmak önceliğimizdir.',
      en: 'Being a trusted partner in all conditions is our priority.',
    },
  },
  {
    icon: Zap,
    title: { tr: 'İnovasyon', en: 'Innovation' },
    desc: {
      tr: 'AI ve verinin gücünü geleneksel deneyimle birleştiririz.',
      en: 'We combine the power of AI and data with traditional experience.',
    },
  },
  {
    icon: Users,
    title: { tr: 'Ortaklık', en: 'Partnership' },
    desc: {
      tr: 'Danışman değil, ortak olarak çalışırız.',
      en: 'We work as partners, not consultants.',
    },
  },
  {
    icon: Eye,
    title: { tr: 'Şeffaflık', en: 'Transparency' },
    desc: {
      tr: 'Süreç, karar ve sonuçlarda tam şeffaflık.',
      en: 'Full transparency in process, decisions, and outcomes.',
    },
  },
  {
    icon: Scale,
    title: { tr: 'Etik', en: 'Ethics' },
    desc: {
      tr: 'Etik standartların üzerinde çalışma prensibi.',
      en: 'Working above and beyond ethical standards.',
    },
  },
];

const OPEN_POSITIONS = [
  { tr: 'Senior Strateji Danışmanı (İstanbul)', en: 'Senior Strategy Consultant (Istanbul)' },
  { tr: 'ESG Analist (Hybrid)', en: 'ESG Analyst (Hybrid)' },
  { tr: 'M&A Uzmanı (Londra)', en: 'M&A Specialist (London)' },
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

export default function AboutPrototype() {
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
        {/* ABOUT HERO — manifesto */}
        <section aria-labelledby="about-title" className="px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeIn}>
              <h1 id="about-title" className="text-3xl sm:text-4xl font-bold mb-6">
                Hakkımızda
              </h1>
              <p className="text-xl sm:text-2xl text-slate-300 leading-relaxed">
                Big4\'ün bürokrasisini değil,{' '}
                <span className="text-amber-400 font-semibold">derinliğini</span>; startup\'ın
                hızını değil, <span className="text-amber-400 font-semibold">çevikliğini</span>{' '}
                alıyoruz.
              </p>
            </motion.div>
          </div>
        </section>

        {/* MANIFESTO SECTION — B4: stagger scroll reveal */}
        <section
          aria-labelledby="manifesto-title"
          className="px-4 sm:px-6 lg:px-8 py-16 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="manifesto-title" className="text-2xl font-bold mb-10 text-center">
              Neden Varız?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {MANIFESTO_QUOTES.map((q) => (
                <div
                  key={q.tr}
                  className="bg-neutral-900 rounded-2xl p-6 border border-slate-700/50"
                >
                  <blockquote className="font-display text-lg italic text-slate-200 leading-relaxed">
                    {q.tr}
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE — Big4 vs Boutique vs eCyPro */}
        <section aria-labelledby="comparison-title" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 id="comparison-title" className="text-2xl font-bold mb-10 text-center">
              Neden eCyPro?
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Big4, Butik ve eCyPro karşılaştırması"
              >
                <thead>
                  <tr className="bg-neutral-800 border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium w-1/4">Kriter</th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium">Big4</th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium">Butik</th>
                    <th className="text-center px-4 py-3 text-amber-400 font-semibold border-l border-amber-500/30 bg-amber-500/5">
                      eCyPro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, big4, boutique, ecypro }, i) => (
                    <tr
                      key={feature.tr}
                      className={`border-b border-slate-800 last:border-0 ${i % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-300">{feature.tr}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{big4.tr}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{boutique.tr}</td>
                      <td className="px-4 py-3 text-center text-amber-300 font-medium border-l border-amber-500/20 bg-amber-500/5">
                        {ecypro.tr}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* TURKEY-EU BRIDGE */}
        <section
          aria-labelledby="bridge-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="bridge-title" className="text-2xl font-bold mb-4">
                Türkiye-AB Köprüsü
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                İstanbul'dan Londra'ya çift pazarda hem yerel bağlamı hem küresel standartları aynı
                anda taşıyoruz. Türk şirketlerinin AB regülasyonlarına (CSRD, GDPR, AI Act) uyum
                süreçlerinde ve AB şirketlerinin Türkiye pazarına girişinde stratejik rehberlik
                sağlıyoruz.
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  'CSRD & ESG uyum danışmanlığı',
                  'AB pazar giriş stratejisi',
                  'Türkiye regülasyon navigasyonu',
                  'Çift pazar yatırım optimizasyonu',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4" aria-hidden="true">
              {[
                { city: 'İstanbul', tag: 'TR HQ' },
                { city: 'Londra', tag: 'EU Hub' },
                { city: 'Brüksel', tag: 'AB Regülasyon' },
                { city: 'Frankfurt', tag: 'Finans' },
              ].map(({ city, tag }) => (
                <div
                  key={city}
                  className="bg-neutral-900 border border-slate-700 rounded-xl p-4 text-center"
                >
                  <Globe size={20} className="text-amber-400 mx-auto mb-2" />
                  <div className="font-semibold text-sm">{city}</div>
                  <div className="text-xs text-slate-500 mt-1">{tag}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM PLACEHOLDER */}
        <section aria-labelledby="team-title" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-neutral-800 border border-dashed border-slate-600 rounded-2xl p-10 text-center">
              <h2 id="team-title" className="text-xl font-bold mb-2">
                Ekibimizi Genişletiyoruz
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Danışmanlık, analiz ve iş geliştirme pozisyonlarında deneyimli profesyoneller
                arıyoruz.
              </p>
              <ul className="space-y-2 mb-6 text-left max-w-xs mx-auto">
                {OPEN_POSITIONS.map((pos) => (
                  <li key={pos.tr} className="flex items-center gap-2 text-sm text-slate-300">
                    <ArrowRight size={12} className="text-amber-400" aria-hidden="true" />
                    {pos.tr}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-neutral-900 text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                CV Gönder <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* VALUES GRID */}
        <section
          aria-labelledby="values-title"
          className="px-4 sm:px-6 lg:px-8 py-20 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="values-title" className="text-2xl font-bold mb-10 text-center">
              Değerlerimiz
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title.tr}
                  className="bg-neutral-900 rounded-2xl p-6 border border-slate-700/50"
                >
                  <Icon size={20} className="text-amber-400 mb-4" aria-hidden="true" />
                  <h3 className="font-semibold mb-2">{title.tr}</h3>
                  <p className="text-sm text-slate-400">{desc.tr}</p>
                </div>
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
