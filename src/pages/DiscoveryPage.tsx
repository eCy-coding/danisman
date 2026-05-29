import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { PageWrapper } from '../components/layout/PageWrapper';
import { FadeIn } from '../components/common/FadeIn';
import { KVKKBadge } from '../components/discovery/KVKKBadge';
import { CalendlyEmbed } from '../components/booking/CalendlyEmbed';
import { useTranslation } from '../lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

// ── TYPES ────────────────────────────────────────────────────────────────────

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface DiscoveryFormFields {
  name: string;
  email: string;
  company: string;
  revenue: string;
  services: string[];
  message: string;
  kvkkConsent: boolean;
}

// ── COPY ────────────────────────────────────────────────────────────────────

const REVENUE_OPTIONS = [
  { value: '1m-10m', labelTr: '1M–10M TL', labelEn: '1M–10M TRY' },
  { value: '10m-50m', labelTr: '10M–50M TL', labelEn: '10M–50M TRY' },
  { value: '50m-250m', labelTr: '50M–250M TL', labelEn: '50M–250M TRY' },
  { value: '250m+', labelTr: '250M+ TL', labelEn: '250M+ TRY' },
  { value: 'undisclosed', labelTr: 'Belirtmek istemiyorum', labelEn: 'Prefer not to say' },
];

const SERVICE_OPTIONS = [
  { value: 'ma', labelTr: 'M&A Danışmanlığı', labelEn: 'M&A Advisory' },
  { value: 'esg', labelTr: 'ESG & Sürdürülebilirlik', labelEn: 'ESG & Sustainability' },
  {
    value: 'family-biz',
    labelTr: 'Aile Şirketi Yönetişimi',
    labelEn: 'Family Business Governance',
  },
  { value: 'digital', labelTr: 'Dijital Dönüşüm', labelEn: 'Digital Transformation' },
  { value: 'strategy', labelTr: 'Stratejik Planlama', labelEn: 'Strategic Planning' },
  { value: 'other', labelTr: 'Diğer', labelEn: 'Other' },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    titleTr: 'Vaka Çalışmaları',
    titleEn: 'Case Studies',
    descTr: 'Kanıtlanmış sonuçlar',
    descEn: 'Proven outcomes',
    href: '/case-studies',
  },
  {
    icon: User,
    titleTr: 'Kurucu Profili',
    titleEn: 'Founder Profile',
    descTr: 'Emre Can Yalçın, 10+ yıl',
    descEn: 'Emre Can Yalçın, 10+ years',
    href: '/founder',
  },
  {
    icon: ShieldCheck,
    titleTr: 'KVKK Uzmanı',
    titleEn: 'KVKK Expert',
    descTr: 'AB standartlarında veri güvenliği',
    descEn: 'EU-standard data security',
    href: '/privacy',
  },
];

// ── API BASE ─────────────────────────────────────────────────────────────────

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(
  /\/$/,
  '',
);

// ── COMPONENT ────────────────────────────────────────────────────────────────

export const DiscoveryPage: React.FC = () => {
  const shouldReduce = useReducedMotion();
  const { language: lang } = useTranslation();
  const isTr = lang?.startsWith('tr');

  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fields, setFields] = useState<DiscoveryFormFields>({
    name: '',
    email: '',
    company: '',
    revenue: '',
    services: [],
    message: '',
    kvkkConsent: false,
  });

  const fadeProps = shouldReduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

  const handleServiceToggle = (value: string) => {
    setFields((prev) => ({
      ...prev,
      services: prev.services.includes(value)
        ? prev.services.filter((s) => s !== value)
        : [...prev.services, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.kvkkConsent) return;
    if (formState === 'submitting') return;

    setFormState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          company: fields.company,
          revenue: fields.revenue,
          services: fields.services,
          message: fields.message,
          kvkkConsent: fields.kvkkConsent,
          service: 'discovery',
          source: 'discovery-page',
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Gönderim başarısız');
      }

      setFormState('success');
    } catch (err) {
      setFormState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {isTr
            ? '30 Dakikada İhtiyacınızı Anlayalım — eCyPro Premium Consulting'
            : "Let's Understand Your Needs in 30 Minutes — eCyPro Premium Consulting"}
        </title>
        <meta
          name="description"
          content={
            isTr
              ? 'Stratejik dönüşüm, M&A, ESG veya operasyonel mükemmellik — taahhütsüz, ücretsiz keşif görüşmesi.'
              : 'Strategic transformation, M&A, ESG, or operational excellence — no-obligation, free discovery call.'
          }
        />
        <link rel="canonical" href={buildCanonical('/discovery', lang)} />
      </Helmet>

      <PageWrapper>
        {/* ── atom-5-1: HERO ────────────────────────────────────────────── */}
        <section
          aria-labelledby="discovery-hero-title"
          data-testid="discovery-hero"
          className="px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-4xl mx-auto text-center"
        >
          <motion.div {...fadeProps}>
            <span className="inline-block text-xs text-amber-400 tracking-widest uppercase border border-amber-500/30 px-3 py-1 rounded-full mb-6">
              {isTr ? 'Keşif Görüşmesi' : 'Discovery Call'}
            </span>
            <h1
              id="discovery-hero-title"
              className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
            >
              {isTr
                ? '30 Dakikada İhtiyacınızı Anlayalım'
                : "Let's Understand Your Needs in 30 Minutes"}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              {isTr
                ? 'Stratejik dönüşüm, M&A, ESG veya operasyonel mükemmellik — taahhütsüz, ücretsiz keşif görüşmesi.'
                : 'Strategic transformation, M&A, ESG, or operational excellence — no-obligation, free discovery call.'}
            </p>
          </motion.div>
        </section>

        {/* ── atom-5-2: FORM + atom-5-3: KVKK BADGE ────────────────────── */}
        <section
          aria-labelledby="discovery-form-title"
          className="px-4 sm:px-6 lg:px-8 pb-20 max-w-2xl mx-auto"
        >
          <FadeIn>
            <h2 id="discovery-form-title" className="sr-only">
              {isTr ? 'Keşif Formu' : 'Discovery Form'}
            </h2>

            {formState === 'success' ? (
              <div
                data-testid="discovery-success"
                className="text-center py-16 bg-slate-800/50 border border-green-500/30 rounded-2xl"
              >
                <CheckCircle2
                  size={48}
                  className="text-green-400 mx-auto mb-4"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  {isTr ? 'Formunuz alındı!' : 'Form received!'}
                </h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  {isTr
                    ? '48 saat içinde sizinle iletişime geçeceğiz.'
                    : "We'll get back to you within 48 hours."}
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                data-testid="discovery-form"
                noValidate
                className="space-y-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="discovery-name"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    {isTr ? 'Ad Soyad' : 'Full Name'}
                    <span className="text-amber-400 ml-1" aria-label="zorunlu">
                      *
                    </span>
                  </label>
                  <input
                    id="discovery-name"
                    type="text"
                    required
                    minLength={2}
                    value={fields.name}
                    onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
                    placeholder={isTr ? 'Adınız ve soyadınız' : 'Your full name'}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    aria-required="true"
                    data-testid="discovery-name-input"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="discovery-email"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    {isTr ? 'E-posta' : 'Email'}
                    <span className="text-amber-400 ml-1" aria-label="zorunlu">
                      *
                    </span>
                  </label>
                  <input
                    id="discovery-email"
                    type="email"
                    required
                    value={fields.email}
                    onChange={(e) => setFields((p) => ({ ...p, email: e.target.value }))}
                    placeholder={isTr ? 'ornek@sirket.com' : 'you@company.com'}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    aria-required="true"
                    data-testid="discovery-email-input"
                  />
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="discovery-company"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    {isTr ? 'Şirket' : 'Company'}
                    <span className="text-amber-400 ml-1" aria-label="zorunlu">
                      *
                    </span>
                  </label>
                  <input
                    id="discovery-company"
                    type="text"
                    required
                    value={fields.company}
                    onChange={(e) => setFields((p) => ({ ...p, company: e.target.value }))}
                    placeholder={isTr ? 'Şirket adı' : 'Company name'}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    aria-required="true"
                  />
                </div>

                {/* Revenue */}
                <div>
                  <label
                    htmlFor="discovery-revenue"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    {isTr ? 'Ciro Aralığı' : 'Revenue Range'}
                  </label>
                  <select
                    id="discovery-revenue"
                    value={fields.revenue}
                    onChange={(e) => setFields((p) => ({ ...p, revenue: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                    data-testid="discovery-revenue-select"
                  >
                    <option value="">{isTr ? 'Seçiniz…' : 'Select…'}</option>
                    {REVENUE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isTr ? opt.labelTr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Services multi-select */}
                <fieldset>
                  <legend className="block text-sm font-medium text-slate-300 mb-3">
                    {isTr ? 'Hizmet İlgisi' : 'Service Interest'}
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          checked={fields.services.includes(opt.value)}
                          onChange={() => handleServiceToggle(opt.value)}
                          className="rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500/30"
                          data-testid={`discovery-service-${opt.value}`}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          {isTr ? opt.labelTr : opt.labelEn}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Message */}
                <div>
                  <label
                    htmlFor="discovery-message"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    {isTr ? 'Açıklama (isteğe bağlı)' : 'Message (optional)'}
                  </label>
                  <textarea
                    id="discovery-message"
                    value={fields.message}
                    onChange={(e) => setFields((p) => ({ ...p, message: e.target.value }))}
                    rows={4}
                    placeholder={
                      isTr
                        ? 'Mevcut durumunuzu ve önceliklerinizi kısaca anlatın…'
                        : 'Briefly describe your current situation and priorities…'
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
                  />
                </div>

                {/* atom-5-3: KVKK Consent */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="discovery-kvkk"
                      checked={fields.kvkkConsent}
                      onChange={(e) => setFields((p) => ({ ...p, kvkkConsent: e.target.checked }))}
                      required
                      className="mt-0.5 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500/30 shrink-0"
                      data-testid="discovery-kvkk-checkbox"
                      aria-required="true"
                    />
                    <span className="text-sm text-slate-400 leading-relaxed">
                      {isTr ? (
                        <>
                          <Link
                            to="/privacy"
                            className="text-amber-400 hover:text-amber-300 underline"
                            target="_blank"
                          >
                            KVKK Aydınlatma Metni
                          </Link>
                          &apos;ni okudum, kişisel verilerimin işlenmesine onay veriyorum.
                        </>
                      ) : (
                        <>
                          I have read the{' '}
                          <Link
                            to="/privacy"
                            className="text-amber-400 hover:text-amber-300 underline"
                            target="_blank"
                          >
                            Privacy Notice
                          </Link>{' '}
                          and consent to processing of my personal data.
                        </>
                      )}
                      <span className="text-amber-400 ml-1" aria-label="zorunlu">
                        *
                      </span>
                    </span>
                  </label>

                  <KVKKBadge />
                </div>

                {/* Error message */}
                {formState === 'error' && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle size={16} aria-hidden="true" />
                    {errorMsg ||
                      (isTr
                        ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
                        : 'An error occurred. Please try again.')}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!fields.kvkkConsent || formState === 'submitting'}
                  data-testid="discovery-submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors"
                  aria-disabled={!fields.kvkkConsent}
                >
                  {formState === 'submitting' ? (
                    isTr ? (
                      'Gönderiliyor…'
                    ) : (
                      'Sending…'
                    )
                  ) : (
                    <>
                      {isTr ? 'Formu Gönder' : 'Submit Form'}
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            )}
          </FadeIn>
        </section>

        {/* ── atom-5-4: CALENDLY EMBED ─────────────────────────────────── */}
        <section
          aria-labelledby="calendly-alt-title"
          data-testid="discovery-calendly"
          className="px-4 sm:px-6 lg:px-8 pb-20 max-w-3xl mx-auto"
        >
          <FadeIn>
            <h2 id="calendly-alt-title" className="text-xl font-bold text-white text-center mb-3">
              {isTr ? 'Zaman Bulmakta Güçlük mü Çekiyorsunuz?' : 'Having Trouble Finding Time?'}
            </h2>
            <p className="text-slate-400 text-center text-sm mb-8">
              {isTr
                ? 'Formu doldurmak yerine doğrudan uygun zaman dilimini seçebilirsiniz.'
                : 'You can pick a convenient time slot directly instead of filling the form.'}
            </p>
            <CalendlyEmbed source="discovery-page" heightPx={600} />
          </FadeIn>
        </section>

        {/* ── atom-5-5: TRUST SIGNALS ──────────────────────────────────── */}
        <section
          aria-labelledby="trust-signals-title"
          data-testid="discovery-trust-signals"
          className="px-4 sm:px-6 lg:px-8 pb-20 max-w-4xl mx-auto"
        >
          <FadeIn>
            <h2 id="trust-signals-title" className="sr-only">
              {isTr ? 'Güven Unsurları' : 'Trust Signals'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {TRUST_SIGNALS.map((signal) => (
                <Link
                  key={signal.titleTr}
                  to={signal.href}
                  className="group bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
                  aria-label={isTr ? signal.titleTr : signal.titleEn}
                >
                  <signal.icon size={24} className="text-amber-400 mb-4" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {isTr ? signal.titleTr : signal.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400">{isTr ? signal.descTr : signal.descEn}</p>
                </Link>
              ))}
            </div>
          </FadeIn>
        </section>
      </PageWrapper>
    </>
  );
};

export default DiscoveryPage;
