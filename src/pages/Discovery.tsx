/**
 * L1-3 — Discovery form page (/discovery).
 *
 * "Tanışma Toplantısı" lead capture form. POSTs to /api/v1/discovery.
 * KVKK SAT-01: consent checkbox required, not pre-checked, 3yr retention.
 * Brand voice TR strict: Aday / Süreç / Founder.
 */

import React, { useState } from 'react';
import { Helmet } from '@/lib/seo-helmet';
import { JsonLd } from '@/components/seo/JsonLd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Lock } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { KvkkLayered } from '../components/legal/KvkkLayered';
import { buildCanonical } from '@/i18n/canonical';
import { getPostHog } from '@/lib/posthog';

// API base — same pattern as ContactForm
const DISCOVERY_ENDPOINT = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(
  /\/$/,
  '',
);

const HEADCOUNTS = ['1–50', '51–250', '251–1.000', '1.000+'];

interface DiscoveryPayload {
  name: string;
  email: string;
  company: string;
  sector: string;
  headcount: string;
  description: string;
  kvkkConsent: boolean;
}

async function submitDiscovery(payload: DiscoveryPayload): Promise<{ ok: boolean }> {
  const res = await fetch(`${DISCOVERY_ENDPOINT}/v1/discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Gönderim başarısız');
  }
  return res.json() as Promise<{ ok: boolean }>;
}

export const Discovery: React.FC = () => {
  const { t } = useTranslation('contact');
  const sectors = t('discovery.sectors', { returnObjects: true }) as string[];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [sector, setSector] = useState('');
  const [headcount, setHeadcount] = useState('');
  const [description, setDescription] = useState('');
  const [kvkkConsent, setKvkkConsent] = useState(false);

  const mutation = useMutation({
    mutationFn: submitDiscovery,
    onSuccess: () => {
      // L2-5: PostHog event — no PII, structural signals only
      getPostHog()
        .then((ph) =>
          ph?.capture('discovery_submit', {
            has_company: Boolean(company),
            has_sector: Boolean(sector),
            has_headcount: Boolean(headcount),
            description_length: description.length,
          }),
        )
        .catch(() => {});
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, email, company, sector, headcount, description, kvkkConsent });
  };

  const fieldClass =
    'w-full bg-neutral-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <React.Fragment>
      <Helmet>
        <title>{t('discovery.meta_title')}</title>
        <meta name="description" content={t('discovery.meta_description')} />
        <link rel="canonical" href={buildCanonical('/discovery', 'tr')} />
        <meta property="og:title" content="Tanışma Toplantısı Talebi — eCyPro Premium Consulting" />
        <meta
          property="og:description"
          content="30 dakika ücretsiz keşif görüşmesi. M&A, ESG, stratejik dönüşüm veya Aile Şirketi yönetişimi için taahhütsüz ilk değerlendirme."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={buildCanonical('/discovery', 'tr')} />
        <meta property="og:image" content="https://www.ecypro.com/og/discovery.png" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tanışma Toplantısı Talebi | eCyPro" />
        <meta
          name="twitter:description"
          content="30 dakika ücretsiz keşif görüşmesi. Taahhütsüz stratejik değerlendirme."
        />
        <meta name="twitter:image" content="https://www.ecypro.com/og/discovery.png" />
      </Helmet>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Tanışma Toplantısı Talebi',
          description:
            '30 dakika ücretsiz keşif görüşmesi. M&A, ESG, stratejik dönüşüm veya Aile Şirketi yönetişimi.',
          url: 'https://www.ecypro.com/discovery',
          provider: {
            '@type': 'ProfessionalService',
            name: 'eCyPro Premium Consulting',
            url: 'https://www.ecypro.com',
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: 'https://www.ecypro.com/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Tanışma Toplantısı',
              item: 'https://www.ecypro.com/discovery',
            },
          ],
        }}
      />

      <PageWrapper>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <header className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              {t('discovery.page_title')}
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-lg mx-auto">
              {t('discovery.page_subtitle')}
            </p>
          </header>

          {mutation.isSuccess ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-emerald-700 bg-emerald-950/50 p-8 text-center"
            >
              <CheckCircle2
                className="w-12 h-12 text-emerald-400 mx-auto mb-4"
                aria-hidden="true"
              />
              <h2 className="text-xl font-semibold text-white mb-2">
                {t('discovery.success_title')}
              </h2>
              <p className="text-slate-400 text-sm mb-6">{t('discovery.success_body')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://wa.me/905417143000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  {t('discovery.cta_whatsapp')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-colors"
                >
                  {t('discovery.cta_home')}
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-neutral-900 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="disc-name" className={labelClass}>
                    {t('discovery.label_name')}{' '}
                    <span className="text-red-400" aria-label={t('discovery.required_aria')}>
                      *
                    </span>
                  </label>
                  <input
                    id="disc-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                    placeholder={t('discovery.placeholder_name')}
                  />
                </div>
                <div>
                  <label htmlFor="disc-email" className={labelClass}>
                    {t('discovery.label_email')}{' '}
                    <span className="text-red-400" aria-label={t('discovery.required_aria')}>
                      *
                    </span>
                  </label>
                  <input
                    id="disc-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder={t('discovery.placeholder_email')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="disc-company" className={labelClass}>
                  {t('discovery.label_company')}{' '}
                  <span className="text-red-400" aria-label={t('discovery.required_aria')}>
                    *
                  </span>
                </label>
                <input
                  id="disc-company"
                  type="text"
                  required
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={fieldClass}
                  placeholder={t('discovery.placeholder_company')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="disc-sector" className={labelClass}>
                    {t('discovery.label_sector')}
                  </label>
                  <select
                    id="disc-sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">{t('discovery.placeholder_select')}</option>
                    {sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="disc-headcount" className={labelClass}>
                    {t('discovery.label_headcount')}
                  </label>
                  <select
                    id="disc-headcount"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">{t('discovery.placeholder_select')}</option>
                    {HEADCOUNTS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="disc-description" className={labelClass}>
                  {t('discovery.label_description')}
                </label>
                <textarea
                  id="disc-description"
                  rows={4}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${fieldClass} resize-none`}
                  placeholder={t('discovery.placeholder_description')}
                />
              </div>

              {/* KVKK consent — SAT-01, not pre-checked, ROPA SAT-01 kapsamı */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="disc-kvkk"
                  type="checkbox"
                  required
                  checked={kvkkConsent}
                  onChange={(e) => setKvkkConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-500 focus:ring-2 focus:ring-amber-400 focus:ring-offset-neutral-900 rounded"
                  aria-required="true"
                />
                <label htmlFor="disc-kvkk" className="text-xs text-slate-400 leading-relaxed">
                  <Link to="/privacy" className="text-amber-400 hover:underline">
                    {t('discovery.kvkk_link_text')}
                  </Link>
                  {t('discovery.kvkk_consent_text')}{' '}
                  <span className="text-red-400" aria-label={t('discovery.required_aria')}>
                    *
                  </span>
                </label>
              </div>

              <KvkkLayered basis="a" />

              {mutation.isError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm text-red-400 bg-red-950/60 border border-red-700/50 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    {t('discovery.error_text')}{' '}
                    <a
                      href="https://wa.me/905417143000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-red-300 hover:text-white"
                    >
                      {t('discovery.error_whatsapp')}
                    </a>
                    .
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !kvkkConsent}
                aria-busy={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-neutral-900 font-semibold text-sm rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {mutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {t('discovery.submit_loading')}
                  </>
                ) : (
                  <>
                    {t('discovery.submit_idle')}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          <footer className="mt-8 flex items-start gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              {t('discovery.footer_kvkk')}{' '}
              <Link to="/privacy" className="text-amber-400/70 hover:text-amber-400 underline">
                {t('discovery.footer_privacy_link')}
              </Link>
            </p>
          </footer>
        </div>
      </PageWrapper>
    </React.Fragment>
  );
};

export default Discovery;
