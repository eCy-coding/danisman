import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Mail,
  Linkedin,
  MapPin,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const TOPICS = [
  'Genel Soru',
  'M&A & Dönüşüm',
  'ESG Danışmanlık',
  'Fintech & Dijital',
  'Aile Şirketi',
  'Medya & Basın',
  'Kariyer',
];

const CONTACT_OPTIONS = [
  {
    icon: Calendar,
    title: { tr: 'Keşif Görüşmesi', en: 'Discovery Call' },
    desc: {
      tr: '30 dakika, taahhütsüz stratejik görüşme.',
      en: '30-minute, no-obligation strategic call.',
    },
    action: {
      label: { tr: 'Rezervasyon Yap', en: 'Book Now' },
      href: '/discovery',
      external: false,
    },
    highlight: true,
  },
  {
    icon: Mail,
    title: { tr: 'E-posta', en: 'Email' },
    desc: {
      tr: 'Genel sorular ve iş birlikleri için.',
      en: 'For general inquiries and partnerships.',
    },
    action: {
      label: { tr: 'E-posta Gönder', en: 'Send Email' },
      href: 'mailto:info@ecypro.com',
      external: true,
    },
    highlight: false,
  },
  {
    icon: Linkedin,
    title: { tr: 'LinkedIn', en: 'LinkedIn' },
    desc: { tr: 'Ağ ve sektör iletişimi için.', en: 'For networking and industry communication.' },
    action: {
      label: { tr: "LinkedIn'de Bul", en: 'Find on LinkedIn' },
      href: 'https://linkedin.com/company/ecypro',
      external: true,
    },
    highlight: false,
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

export default function ContactPrototype() {
  const shouldReduce = useReducedMotion();
  const [formState, setFormState] = useState<FormState>('idle');
  const [kvkk, setKvkk] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // B4: wire to EmailJS / server endpoint
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-50 font-sans">
      <NavBar />

      <main>
        {/* PAGE HERO */}
        <section
          aria-labelledby="contact-title"
          className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 border-b border-slate-800"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.4 },
                  })}
            >
              <h1 id="contact-title" className="text-3xl sm:text-4xl font-bold mb-3">
                İletişim
              </h1>
              <p className="text-slate-400 max-w-xl">
                Stratejik sorularınız, iş birlikleri veya keşif görüşmesi için aşağıdaki kanalları
                kullanabilirsiniz.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section aria-labelledby="options-title" className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <h2 id="options-title" className="sr-only">
              İletişim Kanalları
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {CONTACT_OPTIONS.map(({ icon: Icon, title, desc, action, highlight }) => (
                <div
                  key={title.tr}
                  className={`rounded-2xl p-6 border ${highlight ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700/50 bg-neutral-800'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${highlight ? 'bg-amber-500/20' : 'bg-slate-700'}`}
                  >
                    <Icon
                      size={18}
                      className={highlight ? 'text-amber-400' : 'text-slate-400'}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{title.tr}</h3>
                  <p className="text-sm text-slate-400 mb-4">{desc.tr}</p>
                  {action.external ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300"
                    >
                      {action.label.tr} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <Link
                      to={action.href}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${highlight ? 'bg-amber-500 hover:bg-amber-400 text-neutral-900' : 'text-amber-400 hover:text-amber-300'}`}
                    >
                      {action.label.tr} <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT FORM + OFFICE INFO */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 bg-neutral-800">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-xl font-bold mb-6">Mesaj Gönderin</h2>
              {formState === 'success' ? (
                <div
                  role="alert"
                  className="bg-green-950 border border-green-700 rounded-2xl p-8 text-center"
                >
                  <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-300 mb-2">Mesajınız İletildi</h3>
                  <p className="text-sm text-green-400">48 saat içinde yanıt vereceğiz.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="İletişim formu"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="c-name"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        Ad Soyad *
                      </label>
                      <input
                        id="c-name"
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full bg-neutral-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="c-email"
                        className="block text-sm font-medium text-slate-300 mb-1"
                      >
                        E-posta *
                      </label>
                      <input
                        id="c-email"
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full bg-neutral-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="c-topic"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Konu
                    </label>
                    <select
                      id="c-topic"
                      className="w-full bg-neutral-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="">Konu seçin</option>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="c-msg"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Mesajınız *
                    </label>
                    <textarea
                      id="c-msg"
                      required
                      rows={5}
                      className="w-full bg-neutral-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Mesajınızı buraya yazın..."
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      id="c-kvkk"
                      type="checkbox"
                      required
                      checked={kvkk}
                      onChange={(e) => setKvkk(e.target.checked)}
                      className="mt-0.5 accent-amber-500"
                    />
                    <label htmlFor="c-kvkk" className="text-xs text-slate-400 leading-relaxed">
                      <Link to="/privacy" className="text-amber-400 hover:underline">
                        KVKK Aydınlatma Metni
                      </Link>
                      \'ni okudum, onaylıyorum. *
                    </label>
                  </div>
                  {formState === 'error' && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 text-sm text-red-400 bg-red-950 border border-red-700 rounded-lg px-3 py-2"
                    >
                      <AlertCircle size={14} /> Bir hata oluştu. Lütfen tekrar deneyin.
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={formState === 'submitting' || !kvkk}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-neutral-900 font-semibold text-sm rounded-xl transition-colors"
                  >
                    {formState === 'submitting' ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                  </button>
                </form>
              )}
            </div>

            {/* Office Info */}
            <div>
              <h2 className="text-xl font-bold mb-6">Ofis Bilgileri</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">İstanbul</h3>
                    <p className="text-sm text-slate-400">Maslak, Istanbul, Türkiye</p>
                    <p className="text-xs text-slate-500 mt-1">Randevu bazlı ziyaret</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Londra / Brüksel</h3>
                    <p className="text-sm text-slate-400">Randevu bazlı görüşme</p>
                    <p className="text-xs text-slate-500 mt-1">AB müşterileri için</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-neutral-700 rounded-lg flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Ofis Saatleri</h3>
                    <p className="text-sm text-slate-400">Pzt – Cum, 09:00 – 18:00 (TST)</p>
                  </div>
                </div>
                <div className="bg-neutral-900 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={13} className="text-green-400" aria-hidden="true" />
                    <span className="text-xs font-semibold text-green-400">Yanıt Taahhüdü</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    İletişim formları ve e-postalar için{' '}
                    <strong className="text-slate-300">48 saat</strong> içinde yanıt. Gizlilik
                    taahhüdü — verileriniz üçüncü taraflarla paylaşılmaz.
                  </p>
                </div>
              </div>
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
