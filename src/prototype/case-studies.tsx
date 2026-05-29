import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useScrollReveal } from '../lib/motion/useScrollReveal';
import { ArrowRight, Menu, X, Building2, Leaf, Home as HomeIcon } from 'lucide-react';

type CaseCluster = 'all' | 'ma' | 'esg' | 'fintech' | 'aile';

const CASES = [
  {
    slug: 'sanayi-holding-cikis',
    cluster: 'ma' as CaseCluster,
    client: { tr: 'Büyük Ölçekli Sanayi Holdingi', en: 'Large Industrial Holding' },
    sector: { tr: 'Sanayi & Üretim', en: 'Industrial & Manufacturing' },
    icon: Building2,
    color: 'text-amber-400',
    challenge: {
      tr: 'Avrupa pazarına platform şirket edinimi ve 12 aylık entegrasyon',
      en: '12-month integration following platform company acquisition for European market',
    },
    outcome: {
      tr: '€65M başarılı anlaşma; entegrasyon 9 ayda tamamlandı',
      en: '€65M successful deal; integration completed in 9 months',
    },
    metrics: [
      { label: { tr: 'Anlaşma Değeri', en: 'Deal Value' }, value: '€65M' },
      { label: { tr: 'Entegrasyon Süresi', en: 'Integration Timeline' }, value: '9 ay' },
    ],
    duration: { tr: '8 ay', en: '8 months' },
  },
  {
    slug: 'tekstil-esg-donusum',
    cluster: 'esg' as CaseCluster,
    client: { tr: 'Lider Tekstil İhracatçısı', en: 'Leading Textile Exporter' },
    sector: { tr: 'Tekstil & Moda', en: 'Textile & Fashion' },
    icon: Leaf,
    color: 'text-emerald-400',
    challenge: {
      tr: 'AB müşterilerinin CSRD uyum taleplerine yanıt vermek ve ESG raporlama altyapısı kurmak',
      en: "Responding to EU clients' CSRD compliance demands and establishing ESG reporting infrastructure",
    },
    outcome: {
      tr: 'GRI uyumlu ilk ESG raporu; 3 AB müşterisi ile sözleşme yenileme',
      en: 'First GRI-aligned ESG report; contract renewals with 3 EU clients',
    },
    metrics: [
      { label: { tr: 'ESG Skoru Artışı', en: 'ESG Score Increase' }, value: '+42%' },
      { label: { tr: 'Süre', en: 'Duration' }, value: '6 ay' },
    ],
    duration: { tr: '6 ay', en: '6 months' },
  },
  {
    slug: 'aile-yonetisim',
    cluster: 'aile' as CaseCluster,
    client: { tr: '3. Nesil Aile Şirketi', en: '3rd Generation Family Business' },
    sector: { tr: 'Perakende & Tüketim', en: 'Retail & Consumer' },
    icon: HomeIcon,
    color: 'text-violet-400',
    challenge: {
      tr: '3. nesil liderlik geçişinde yönetişim krizini çözmek ve aile anayasası oluşturmak',
      en: 'Resolving governance crisis in 3rd-generation leadership transition and creating a family constitution',
    },
    outcome: {
      tr: 'Aile konseyi kuruldu; 5 yıllık nesil geçiş planı kabul gördü',
      en: 'Family council established; 5-year generational transition plan accepted',
    },
    metrics: [
      { label: { tr: 'Uzlaşı Başarısı', en: 'Consensus Rate' }, value: '%100' },
      { label: { tr: 'Süre', en: 'Duration' }, value: '5 ay' },
    ],
    duration: { tr: '5 ay', en: '5 months' },
  },
];

const FILTERS: { id: CaseCluster; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'ma', label: 'M&A' },
  { id: 'esg', label: 'ESG' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'aile', label: 'Aile Şirketi' },
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

export default function CaseStudiesPrototype() {
  const shouldReduce = useReducedMotion();
  const { ref: casesRef } = useScrollReveal<HTMLDivElement>({ stagger: 0.15, selector: 'article' });
  const [active, setActive] = useState<CaseCluster>('all');
  const filtered = active === 'all' ? CASES : CASES.filter((c) => c.cluster === active);

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* HERO */}
        <section
          aria-labelledby="cases-title"
          className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-slate-800"
        >
          <motion.div
            className="max-w-7xl mx-auto"
            {...(shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.45 },
                })}
          >
            <h1 id="cases-title" className="text-3xl sm:text-4xl font-bold mb-3">
              Vaka Çalışmaları
            </h1>
            <p className="text-slate-400 max-w-xl">
              Müşteri gizliliği nedeniyle tüm vakalar anonimleştirilmiştir. Sayısal sonuçlar gerçek
              proje çıktılarına dayanmaktadır.
            </p>
          </motion.div>
        </section>

        {/* FILTERS */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 bg-neutral-800 border-b border-slate-700 sticky top-16 z-40">
          <div
            className="max-w-7xl mx-auto flex gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Küme filtresi"
          >
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={active === id}
                onClick={() => setActive(id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${active === id ? 'bg-amber-500 text-neutral-900' : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* CASES */}
        <section aria-label="Vaka çalışmaları listesi" className="px-4 sm:px-6 lg:px-8 py-12">
          <div ref={casesRef} className="max-w-7xl mx-auto space-y-6">
            {filtered.map(
              ({
                slug,
                icon: Icon,
                color,
                client,
                sector,
                challenge,
                outcome,
                metrics,
                duration,
              }) => (
                <article
                  key={slug}
                  className="bg-neutral-800 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-colors grid md:grid-cols-3 gap-6"
                >
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} className={color} aria-hidden="true" />
                      <span className="text-xs text-slate-400">{sector.tr}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-400">{duration.tr}</span>
                    </div>
                    <h2 className="font-semibold mb-2">{client.tr}</h2>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                        Zorluk
                      </p>
                      <p className="text-sm text-slate-300">{challenge.tr}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                        Sonuç
                      </p>
                      <p className="text-sm text-slate-300">{outcome.tr}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex flex-wrap gap-3">
                      {metrics.map(({ label, value }) => (
                        <div
                          key={value}
                          className="bg-neutral-900 rounded-xl px-4 py-3 border border-slate-700"
                        >
                          <div className="text-xl font-bold text-amber-400">{value}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{label.tr}</div>
                        </div>
                      ))}
                    </div>
                    <Link
                      to={`/case-studies/${slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300"
                    >
                      Detayları Gör <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl px-8 py-10 text-center">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Projenizi Konuşalım</h2>
            <p className="text-neutral-800 mb-6">
              Sektörünüze özgü vaka deneyimlerimizi keşif görüşmesinde paylaşabiliriz.
            </p>
            <Link
              to="/discovery"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-amber-400 font-semibold rounded-xl hover:bg-neutral-800 transition-colors text-sm"
            >
              Keşif Görüşmesi <ArrowRight size={14} />
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
