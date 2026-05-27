import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const SECTORS = [
  'Sanayi & Üretim',
  'Finans & Bankacılık',
  'Teknoloji',
  'Perakende & Tüketim',
  'Enerji',
  'Sağlık',
  'İnşaat & Gayrimenkul',
  'Diğer',
];
const HEADCOUNTS = ['1–50', '51–250', '251–1,000', '1,000+'];

const STEPS = [
  {
    icon: Mail,
    title: { tr: 'Formu Doldurun', en: 'Fill the Form' },
    desc: {
      tr: 'Şirketiniz ve öncelikleriniz hakkında kısa bilgi verin.',
      en: 'Share brief info about your company and priorities.',
    },
  },
  {
    icon: Calendar,
    title: { tr: 'Slot Seçin', en: 'Choose a Slot' },
    desc: {
      tr: 'Size uygun 30 dakikalık zaman dilimini belirleyin.',
      en: 'Pick a convenient 30-minute time slot.',
    },
  },
  {
    icon: CheckCircle2,
    title: { tr: 'Görüşelim', en: "Let's Talk" },
    desc: {
      tr: 'Taahhütsüz, stratejik netlik odaklı keşif görüşmesi.',
      en: 'No-obligation discovery call focused on strategic clarity.',
    },
  },
];

const FAQ = [
  {
    q: { tr: 'Ücretli mi?', en: 'Is it paid?' },
    a: {
      tr: 'Hayır, keşif görüşmesi tamamen ücretsizdir.',
      en: 'No, the discovery call is completely free.',
    },
  },
  {
    q: { tr: 'Kimler başvurabilir?', en: 'Who can apply?' },
    a: {
      tr: 'C-level yöneticiler, şirket sahipleri ve iş geliştirme sorumluları.',
      en: 'C-level executives, company owners, and business development managers.',
    },
  },
  {
    q: { tr: 'Hangi konuları konuşabiliriz?', en: 'What topics can we discuss?' },
    a: {
      tr: 'M&A, ESG, dijital dönüşüm, aile şirketi yönetişimi veya stratejik öncelikleriniz.',
      en: 'M&A, ESG, digital transformation, family business governance, or your strategic priorities.',
    },
  },
  {
    q: { tr: 'Sonrasında ne olur?', en: 'What happens after?' },
    a: {
      tr: '48 saat içinde önerilen sonraki adımları içeren bir özet e-posta gönderilir.',
      en: 'A summary email with proposed next steps is sent within 48 hours.',
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

export default function DiscoveryPrototype() {
  const shouldReduce = useReducedMotion();
  const [formState, setFormState] = useState<FormState>('idle');
  const [kvkk, setKvkk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // B4: wire to actual API / EmailJS
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* HERO */}
        <section
          aria-labelledby="discovery-title"
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
              <h1 id="discovery-title" className="text-3xl sm:text-4xl font-bold mb-4">
                Keşif Görüşmesi
              </h1>
              <p className="text-xl text-slate-300 mb-4">
                30 dakika · Taahhütsüz · Stratejik netlik.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Gizlilik Taahhüdü', 'KVKK Uyumlu', '48s İçinde Yanıt'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full"
                  >
                    <Lock size={10} aria-hidden="true" /> {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section aria-labelledby="how-title" className="px-4 sm:px-6 lg:px-8 py-12 bg-neutral-800">
          <div className="max-w-3xl mx-auto">
            <h2 id="how-title" className="text-lg font-semibold text-center mb-8 text-slate-300">
              Nasıl İşliyor?
            </h2>
            <ol className="flex flex-col sm:flex-row gap-6">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <li key={title.tr} className="flex-1 flex flex-col items-center text-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Icon size={18} className="text-amber-400" aria-hidden="true" />
                    </div>
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-neutral-900 text-xs font-bold flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold">{title.tr}</h3>
                  <p className="text-xs text-slate-400">{desc.tr}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* MAIN CONTENT — Calendly + Form */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
            {/* Calendly placeholder */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Slot Seçin</h2>
              <div
                className="bg-neutral-800 border border-slate-700 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-6"
                aria-label="Calendly takvim widget alanı"
              >
                <Calendar size={32} className="text-slate-500 mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-400">Calendly Widget</p>
                <p className="text-xs text-slate-600 mt-1">B4\'te gerçek entegrasyon eklenecek</p>
                <a
                  href="https://calendly.com/ecypro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Calendly\'yi aç →
                </a>
              </div>
            </div>

            {/* Pre-call form */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Ön Bilgi Formu</h2>

              {formState === 'success' ? (
                <div
                  role="alert"
                  className="bg-green-950 border border-green-700 rounded-2xl p-8 text-center"
                >
                  <CheckCircle2
                    size={32}
                    className="text-green-400 mx-auto mb-3"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-green-300 mb-2">Talebiniz Alındı!</h3>
                  <p className="text-sm text-green-400">48 saat içinde size ulaşacağız.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate aria-label="Keşif görüşmesi başvuru formu">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="fullname"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Ad Soyad <span aria-label="zorunlu">*</span>
                      </label>
                      <input
                        id="fullname"
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        E-posta <span aria-label="zorunlu">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="isim@sirket.com"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Şirket <span aria-label="zorunlu">*</span>
                      </label>
                      <input
                        id="company"
                        type="text"
                        required
                        autoComplete="organization"
                        className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Şirket adı"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="sector"
                          className="block text-sm font-medium text-slate-300 mb-1"
                        >
                          Sektör
                        </label>
                        <select
                          id="sector"
                          className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="">Seçin</option>
                          {SECTORS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="headcount"
                          className="block text-sm font-medium text-slate-300 mb-1"
                        >
                          Çalışan
                        </label>
                        <select
                          id="headcount"
                          className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <option value="">Seçin</option>
                          {HEADCOUNTS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="priority"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Güncel Önceliğiniz
                      </label>
                      <textarea
                        id="priority"
                        rows={3}
                        maxLength={300}
                        className="w-full bg-neutral-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                        placeholder="Şu anda ne üzerinde çalışıyorsunuz? (maks. 300 karakter)"
                      />
                    </div>

                    {/* KVKK consent */}
                    <div className="flex items-start gap-3">
                      <input
                        id="kvkk"
                        type="checkbox"
                        required
                        checked={kvkk}
                        onChange={(e) => setKvkk(e.target.checked)}
                        className="mt-0.5 accent-amber-500 focus:ring-2 focus:ring-amber-400"
                        aria-required="true"
                      />
                      <label htmlFor="kvkk" className="text-xs text-slate-400 leading-relaxed">
                        <Link to="/privacy" className="text-amber-400 hover:underline">
                          Gizlilik Politikası
                        </Link>
                        \'nı ve{' '}
                        <Link to="/privacy" className="text-amber-400 hover:underline">
                          KVKK Aydınlatma Metni
                        </Link>
                        \'ni okudum, onaylıyorum.{' '}
                        <span aria-label="zorunlu" className="text-red-400">
                          *
                        </span>
                      </label>
                    </div>

                    {formState === 'error' && (
                      <div
                        role="alert"
                        className="flex items-center gap-2 text-sm text-red-400 bg-red-950 border border-red-700 rounded-lg px-3 py-2"
                      >
                        <AlertCircle size={14} aria-hidden="true" /> Bir hata oluştu. Lütfen tekrar
                        deneyin.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formState === 'submitting' || !kvkk}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-neutral-900 font-semibold text-sm rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      aria-busy={formState === 'submitting'}
                    >
                      {formState === 'submitting' ? (
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="animate-spin" aria-hidden="true" />{' '}
                          Gönderiliyor...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Görüşme Talep Et <ArrowRight size={14} />
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* KVKK NOTICE */}
        <section
          aria-label="KVKK bildirimi"
          className="px-4 sm:px-6 lg:px-8 py-6 bg-neutral-800 border-t border-b border-slate-700"
        >
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <Lock size={14} className="text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Form aracılığıyla iletilen kişisel verileriniz, 6698 sayılı KVKK kapsamında eCyPro
              tarafından işlenmektedir. Veriler yalnızca keşif görüşmesi organizasyonu amacıyla
              kullanılır ve üçüncü taraflarla paylaşılmaz.{' '}
              <Link to="/privacy" className="text-amber-400/70 hover:text-amber-400 underline">
                Detaylı bilgi →
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 id="faq-title" className="text-xl font-bold mb-8 text-center">
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
