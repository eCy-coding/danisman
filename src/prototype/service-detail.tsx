import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, ChevronRight, Building2, Menu, X, Clock, Users } from 'lucide-react';
import { useState } from 'react';

// Template example: M&A Advisory — covers all 21 service pages
const SERVICE = {
  slug: 'ma-danismanlik',
  cluster: {
    tr: 'M&A & Kurumsal Dönüşüm',
    en: 'M&A & Corporate Transformation',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  name: { tr: 'Birleşme ve Satın Alma Danışmanlığı', en: 'Merger & Acquisition Advisory' },
  desc: {
    tr: "Hedef belirleme ve tarama süreçlerinden müzakere masasına, Due Diligence'den post-merger entegrasyona kadar tüm M&A yaşam döngüsünde stratejik ve operasyonel destek sağlıyoruz. Big4 metodolojisi, boutique çevikliğiyle birleşik.",
    en: 'We provide strategic and operational support throughout the entire M&A lifecycle, from target identification and screening to the negotiation table, Due Diligence, and post-merger integration. Big4 methodology combined with boutique agility.',
  },
  engagement: { tr: '3–12 ay', en: '3–12 months' },
  clientProfile: {
    tr: 'Orta-büyük ölçekli Türk şirketleri, aile holdingleri, PE-destekli şirketler',
    en: 'Mid-to-large Turkish companies, family holdings, PE-backed companies',
  },
  deliverables: [
    {
      tr: 'Hedef şirket uzun listesi ve kısa liste değerlendirmesi',
      en: 'Target long-list and short-list evaluation',
    },
    {
      tr: 'Bağımsız değerleme analizi ve fiyat görüşü',
      en: 'Independent valuation analysis and price opinion',
    },
    {
      tr: 'Kapsamlı finansal ve operasyonel Due Diligence raporu',
      en: 'Comprehensive financial and operational Due Diligence report',
    },
    {
      tr: 'Müzakere stratejisi ve SPA yapılandırması desteği',
      en: 'Negotiation strategy and SPA structuring support',
    },
    {
      tr: 'Post-merger entegrasyon planı (100 günlük plan)',
      en: 'Post-merger integration plan (100-day plan)',
    },
    {
      tr: 'Kültürel uyum değerlendirmesi ve yönetim önerileri',
      en: 'Cultural alignment assessment and management recommendations',
    },
  ],
  approach: [
    {
      step: '01',
      title: { tr: 'Durum Analizi', en: 'Situation Analysis' },
      desc: {
        tr: 'Stratejik hedefleri, piyasa koşullarını ve organizasyonel hazırlık düzeyini değerlendiriyoruz.',
        en: 'We assess strategic objectives, market conditions, and organizational readiness.',
      },
    },
    {
      step: '02',
      title: { tr: 'Strateji Tasarımı', en: 'Strategy Design' },
      desc: {
        tr: 'Hedef kriterleri, pazar haritası ve öncelikli fırsat havuzunu belirliyoruz.',
        en: 'We define target criteria, market map, and priority opportunity pool.',
      },
    },
    {
      step: '03',
      title: { tr: 'Yürütme', en: 'Execution' },
      desc: {
        tr: 'Due Diligence yönetimi, müzakere ve yapılandırma süreçlerini koordine ediyoruz.',
        en: 'We coordinate Due Diligence management, negotiation, and structuring processes.',
      },
    },
    {
      step: '04',
      title: { tr: 'Entegrasyon', en: 'Integration' },
      desc: {
        tr: 'Post-deal değer yaratma planını tasarlıyor ve ilk 100 günde uygulama desteği sağlıyoruz.',
        en: 'We design the post-deal value creation plan and provide implementation support in the first 100 days.',
      },
    },
  ],
  caseSnapshot: {
    client: {
      tr: 'Fortune 500 Sanayi Firması (Anonim)',
      en: 'Fortune 500 Industrial Company (Anon.)',
    },
    challenge: {
      tr: 'Avrupa pazarına giriş için uygun platform şirket edinimi ve entegrasyon stratejisi.',
      en: 'Acquisition of appropriate platform company for European market entry and integration strategy.',
    },
    outcome: {
      tr: '8 aylık süreçte €65M değerleme ile başarılı anlaşma; 12 aylık entegrasyon 9 ayda tamamlandı.',
      en: '€65M successful deal in 8 months; 12-month integration completed in 9 months.',
    },
  },
  related: [
    {
      slug: 'degerleme',
      name: { tr: 'Değerleme ve Due Diligence', en: 'Valuation & Due Diligence' },
    },
    { slug: 'buyume-stratejisi', name: { tr: 'Büyüme Stratejisi', en: 'Growth Strategy' } },
    { slug: 'cikis-planlama', name: { tr: 'Çıkış Planlama', en: 'Exit Planning' } },
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

export default function ServiceDetailPrototype() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* BREADCRUMB */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="max-w-7xl mx-auto">
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
                  <Link to="/services" className="hover:text-slate-300">
                    Hizmetler
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight size={12} />
                </li>
                <li className="text-amber-400" aria-current="page">
                  {SERVICE.name.tr}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* SERVICE HERO — split */}
        <section aria-labelledby="service-title" className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <motion.div
                {...(shouldReduce
                  ? {}
                  : {
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.4 },
                    })}
              >
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${SERVICE.cluster.color} border border-current/30 px-3 py-1 rounded-full mb-4`}
                >
                  <Building2 size={12} aria-hidden="true" />
                  {SERVICE.cluster.tr}
                </span>
                <h1 id="service-title" className="text-2xl sm:text-3xl font-bold mb-4">
                  {SERVICE.name.tr}
                </h1>
                <p className="text-slate-300 leading-relaxed text-base">{SERVICE.desc.tr}</p>
              </motion.div>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock size={14} className="text-amber-400" aria-hidden="true" />
                  <span>
                    Süre: <strong className="text-slate-200">{SERVICE.engagement.tr}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users size={14} className="text-amber-400" aria-hidden="true" />
                  <span className="truncate max-w-xs">{SERVICE.clientProfile.tr}</span>
                </div>
              </div>
            </div>

            {/* CTA sidebar card */}
            <aside className="bg-neutral-800 border border-amber-500/30 rounded-2xl p-6 h-fit">
              <h2 className="font-semibold mb-1">Bu Hizmeti Keşfedin</h2>
              <p className="text-xs text-slate-400 mb-4">
                30 dakika · Taahhütsüz · Stratejik netlik
              </p>
              <Link
                to="/discovery"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-900 font-semibold text-sm rounded-xl transition-colors mb-3"
              >
                Keşif Görüşmesi Başlat <ArrowRight size={14} />
              </Link>
              <p className="text-xs text-slate-500 text-center">
                Calendly üzerinden slot seçimi · KVKK uyumlu
              </p>
            </aside>
          </div>
        </section>

        {/* DELIVERABLES */}
        <section
          aria-labelledby="deliverables-title"
          className="px-4 sm:px-6 lg:px-8 py-16 bg-neutral-800"
        >
          <div className="max-w-7xl mx-auto">
            <h2 id="deliverables-title" className="text-xl font-bold mb-8">
              Ne Teslim Ediyoruz?
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {SERVICE.deliverables.map((d) => (
                <li key={d.tr} className="flex items-start gap-3">
                  <Check size={16} className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-sm text-slate-300">{d.tr}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* APPROACH STEPS */}
        <section aria-labelledby="approach-title" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <h2 id="approach-title" className="text-xl font-bold mb-8">
              Çalışma Yaklaşımımız
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICE.approach.map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="bg-neutral-800 rounded-2xl p-6 border border-slate-700/50"
                >
                  <div
                    className="text-4xl font-bold text-amber-400/25 mb-3 leading-none"
                    aria-hidden="true"
                  >
                    {step}
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{title.tr}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc.tr}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CASE SNAPSHOT */}
        <section aria-labelledby="case-title" className="px-4 sm:px-6 lg:px-8 py-16 bg-neutral-800">
          <div className="max-w-4xl mx-auto">
            <h2 id="case-title" className="text-xl font-bold mb-6">
              Vaka Özeti
            </h2>
            <div className="border-l-4 border-amber-500 bg-neutral-900 rounded-r-2xl p-6">
              <p className="text-xs text-amber-400 font-medium mb-2">
                {SERVICE.caseSnapshot.client.tr}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Zorluk
                  </h3>
                  <p className="text-sm text-slate-300">{SERVICE.caseSnapshot.challenge.tr}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Sonuç
                  </h3>
                  <p className="text-sm text-slate-300">{SERVICE.caseSnapshot.outcome.tr}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED SERVICES */}
        <section aria-labelledby="related-title" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <h2 id="related-title" className="text-xl font-bold mb-6">
              İlgili Hizmetler
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {SERVICE.related.map(({ slug, name }) => (
                <Link
                  key={slug}
                  to={`/services/${slug}`}
                  className="bg-neutral-800 rounded-xl p-4 border border-slate-700/50 hover:border-amber-500/40 transition-colors flex items-center justify-between group"
                >
                  <span className="text-sm font-medium">{name.tr}</span>
                  <ArrowRight
                    size={14}
                    className="text-amber-400 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              Bu hizmet hakkında konuşalım
            </h2>
            <p className="text-neutral-800 mb-8">
              30 dakikalık keşif görüşmesinde projenizi değerlendirelim.
            </p>
            <Link
              to="/discovery"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-amber-400 font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Keşif Görüşmesi <ArrowRight size={16} />
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
