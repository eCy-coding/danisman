import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Minus, Menu, X } from 'lucide-react';

type EngagementMode = 'monthly' | 'project';

const TIERS = [
  {
    id: 'starter',
    name: { tr: 'Starter', en: 'Starter' },
    subtitle: { tr: 'Keşif', en: 'Discovery' },
    profile: {
      tr: 'KOBİ, solo kurucu, erken aşama şirket',
      en: 'SME, solo founder, early-stage company',
    },
    features: [
      { tr: 'Aylık 2 danışmanlık görüşmesi', en: '2 advisory sessions/month' },
      { tr: 'E-posta desteği', en: 'Email support' },
      { tr: 'Aylık 1 çıktı belgesi', en: '1 deliverable document/month' },
      { tr: 'Öncelik: tek workstream', en: 'Focus: single workstream' },
    ],
    cta: { tr: 'Başla', en: 'Get Started' },
    highlighted: false,
  },
  {
    id: 'growth',
    name: { tr: 'Growth', en: 'Growth' },
    subtitle: { tr: 'Büyüme', en: 'Growth' },
    profile: { tr: 'Orta ölçekli şirket, büyüme aşaması', en: 'Mid-size company, growth stage' },
    features: [
      { tr: 'Haftalık danışmanlık görüşmeleri', en: 'Weekly advisory sessions' },
      { tr: 'Adanmış analist desteği', en: 'Dedicated analyst support' },
      { tr: 'Maksimum 3 workstream', en: 'Up to 3 workstreams' },
      { tr: 'Aylık yönetici raporu', en: 'Monthly executive report' },
      { tr: 'E-posta & anlık mesajlaşma', en: 'Email & instant messaging' },
    ],
    cta: { tr: 'Görüşelim', en: "Let's Talk" },
    highlighted: true,
    badge: { tr: 'En Popüler', en: 'Most Popular' },
  },
  {
    id: 'enterprise',
    name: { tr: 'Enterprise', en: 'Enterprise' },
    subtitle: { tr: 'Kurumsal', en: 'Corporate' },
    profile: { tr: 'Büyük şirket, holding, PE-destekli', en: 'Large corp, holding, PE-backed' },
    features: [
      { tr: 'Adanmış danışmanlık ekibi', en: 'Dedicated advisory team' },
      { tr: 'Yönetim kurulu erişimi', en: 'Board-level access' },
      { tr: 'Sınırsız workstream', en: 'Unlimited workstreams' },
      { tr: 'Çeyreklik stratejik inceleme', en: 'Quarterly strategic review' },
      { tr: 'Öncelikli yanıt (4s)', en: 'Priority response (4h)' },
    ],
    cta: { tr: 'Teklif Al', en: 'Get Proposal' },
    highlighted: false,
  },
];

const FEATURES = [
  {
    name: { tr: 'Danışmanlık görüşmesi', en: 'Advisory sessions' },
    starter: { tr: 'Ayda 2', en: '2/month' },
    growth: { tr: 'Haftalık', en: 'Weekly' },
    enterprise: { tr: 'İhtiyaca göre', en: 'On demand' },
  },
  {
    name: { tr: 'Adanmış analist', en: 'Dedicated analyst' },
    starter: null,
    growth: true,
    enterprise: true,
  },
  {
    name: { tr: 'Workstream sayısı', en: 'Workstreams' },
    starter: { tr: '1', en: '1' },
    growth: { tr: 'Maks. 3', en: 'Up to 3' },
    enterprise: { tr: 'Sınırsız', en: 'Unlimited' },
  },
  {
    name: { tr: 'Yönetici raporu', en: 'Executive report' },
    starter: null,
    growth: true,
    enterprise: true,
  },
  {
    name: { tr: 'Yönetim kurulu erişimi', en: 'Board access' },
    starter: null,
    growth: null,
    enterprise: true,
  },
  {
    name: { tr: 'Öncelikli destek', en: 'Priority support' },
    starter: null,
    growth: null,
    enterprise: true,
  },
  {
    name: { tr: 'KVKK veri işleme SLA', en: 'KVKK data SLA' },
    starter: true,
    growth: true,
    enterprise: true,
  },
  {
    name: { tr: 'Çeyreklik strateji revizyonu', en: 'Quarterly strategy review' },
    starter: null,
    growth: null,
    enterprise: true,
  },
];

const FAQ = [
  {
    q: { tr: 'Sözleşme süresi ne kadar?', en: 'What is the contract duration?' },
    a: {
      tr: 'Minimum 3 aylık angajman, proje bazlı modeller de mevcuttur. Detayları birlikte belirleriz.',
      en: 'Minimum 3-month engagement; project-based models are also available. We determine details together.',
    },
  },
  {
    q: { tr: 'Nasıl başlayabilirim?', en: 'How do I get started?' },
    a: {
      tr: '30 dakikalık ücretsiz keşif görüşmesiyle başlıyoruz; ihtiyaca göre uygun modeli belirliyoruz.',
      en: 'We start with a 30-minute free discovery call and determine the right model based on your needs.',
    },
  },
  {
    q: { tr: 'Ödeme modelleri neler?', en: 'What payment models exist?' },
    a: {
      tr: 'Aylık sabit ücret, saatlik ücret veya sonuç bazlı ödeme modellerinden birini tercih edebilirsiniz.',
      en: 'Monthly retainer, hourly rate, or outcomes-based payment — your choice.',
    },
  },
  {
    q: { tr: 'Ekipler arası koordinasyon mümkün mü?', en: 'Is cross-team coordination possible?' },
    a: {
      tr: 'Enterprise paketinde iç ekiplerinizle tam entegre çalışma modeli sunuyoruz.',
      en: 'In the Enterprise package, we offer a fully integrated working model with your internal teams.',
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

function FeatureCell({ value }: { value: boolean | { tr: string; en: string } | null }) {
  if (value === null)
    return <Minus size={14} className="text-slate-600 mx-auto" aria-label="Dahil değil" />;
  if (value === true)
    return <Check size={14} className="text-amber-400 mx-auto" aria-label="Dahil" />;
  return <span className="text-xs text-slate-300">{(value as { tr: string }).tr}</span>;
}

export default function PricingPrototype() {
  const shouldReduce = useReducedMotion();
  const [mode, setMode] = useState<EngagementMode>('monthly');

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* PAGE HERO */}
        <section
          aria-labelledby="pricing-title"
          className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center border-b border-slate-800"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.4 },
                  })}
            >
              <h1 id="pricing-title" className="text-3xl sm:text-4xl font-bold mb-3">
                Danışmanlık Paketleri
              </h1>
              <p className="text-slate-400 mb-8">
                Boyutunuza uygun stratejik ortaklık modeli. Fiyatlandırma proje kapsamına göre
                belirlenir.
              </p>

              {/* Engagement mode toggle */}
              <div
                className="inline-flex items-center bg-neutral-800 border border-slate-700 rounded-xl p-1 gap-1"
                role="group"
                aria-label="Angajman modeli seçimi"
              >
                {(['monthly', 'project'] as EngagementMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${mode === m ? 'bg-amber-500 text-neutral-900' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {m === 'monthly' ? 'Aylık Retainer' : 'Proje Bazlı'}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* TIER CARDS */}
        <section aria-label="Angajman paketleri" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
            {TIERS.map(({ id, name, subtitle, profile, features, cta, highlighted, badge }) => (
              <article
                key={id}
                className={`rounded-2xl p-6 border flex flex-col ${highlighted ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700/50 bg-neutral-800'}`}
                aria-label={`${name.tr} paketi`}
              >
                {badge && (
                  <span className="inline-block self-start text-xs font-bold bg-amber-500 text-neutral-900 px-2 py-0.5 rounded-full mb-2">
                    {badge.tr}
                  </span>
                )}
                <h2 className="text-xl font-bold">{name.tr}</h2>
                <p className="text-sm text-slate-400 mb-1">{subtitle.tr}</p>
                <p className="text-xs text-slate-500 mb-4 pb-4 border-b border-slate-700">
                  {profile.tr}
                </p>

                <p className="text-xs text-amber-400/70 font-medium mb-3">Dahil Olanlar:</p>
                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f.tr} className="flex items-start gap-2">
                      <Check
                        size={14}
                        className="text-amber-400 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-slate-300">{f.tr}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500 mb-3">
                    Fiyatlandırma proje kapsamına göre belirlenir.
                  </p>
                  <Link
                    to="/discovery"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${highlighted ? 'bg-amber-500 hover:bg-amber-400 text-neutral-900' : 'border border-slate-600 text-slate-200 hover:border-amber-500/50 hover:text-amber-400'}`}
                  >
                    {cta.tr} <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FEATURE COMPARISON TABLE */}
        <section
          aria-labelledby="compare-title"
          className="px-4 sm:px-6 lg:px-8 py-16 bg-neutral-800"
        >
          <div className="max-w-4xl mx-auto">
            <h2 id="compare-title" className="text-xl font-bold mb-8 text-center">
              Özellik Karşılaştırması
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="bg-neutral-900 border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Özellik</th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium">Starter</th>
                    <th className="text-center px-4 py-3 text-amber-400 font-semibold bg-amber-500/5">
                      Growth
                    </th>
                    <th className="text-center px-4 py-3 text-slate-400 font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(({ name, starter, growth, enterprise }, i) => (
                    <tr
                      key={name.tr}
                      className={`border-b border-slate-800 last:border-0 ${i % 2 === 0 ? 'bg-neutral-900/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-slate-300 text-sm">{name.tr}</td>
                      <td className="px-4 py-3 text-center">
                        <FeatureCell value={starter} />
                      </td>
                      <td className="px-4 py-3 text-center bg-amber-500/5">
                        <FeatureCell value={growth} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FeatureCell value={enterprise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="pfaq-title" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 id="pfaq-title" className="text-xl font-bold mb-8 text-center">
              Sık Sorulan Sorular
            </h2>
            <dl className="space-y-4">
              {FAQ.map(({ q, a }) => (
                <div
                  key={q.tr}
                  className="bg-neutral-800 rounded-xl p-5 border border-slate-700/50"
                >
                  <dt className="font-semibold text-sm mb-2">{q.tr}</dt>
                  <dd className="text-sm text-slate-400">{a.tr}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-amber-600 to-amber-500 rounded-3xl px-8 py-12 text-center">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Hangi model size uygun?</h2>
            <p className="text-neutral-800 mb-6">
              Konuşalım — birlikte en iyi yapıyı belirleyelim.
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
