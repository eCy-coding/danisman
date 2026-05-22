/**
 * P51.4 — Industry Report Gated Download.
 *
 * Lead magnet: kullanıcı email + isim + kurum girer → PDF download link.
 * Backend `/api/newsletter/subscribe` ile entegre (source: 'industry-report:<slug>').
 * Drip campaign trigger: post-download welcome + report context follow-up.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { trackFormSubmit } from '../lib/integrations/analytics';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

const REPORT = {
  slug: 'turkey-premium-consulting-2026',
  title: 'Türkiye Premium Consulting Pazarı · 2026 Görünüm Raporu',
  subtitle:
    'Big4 dampingi sonrası boutique fırsatları, sektörel öncelikler, fiyatlandırma benchmarks.',
  pageCount: 28,
  sections: [
    'Yönetici Özeti (3 sayfa)',
    'Big4 mid-market stratejisi analizi (4 sayfa)',
    'Boutique pozisyonu — 5 sektörel benchmark (8 sayfa)',
    'Fiyatlandırma yapıları — engagement tipi × süre matrix (3 sayfa)',
    'Yetenek havuzu + recruitment maliyeti (3 sayfa)',
    'Pazara giriş için 12-aylık yol haritası (4 sayfa)',
    'Methodology + kaynakça (3 sayfa)',
  ],
  publishDate: 'Mayıs 2026',
  authors: ['Emre Can Yalçın'],
  pdfUrl: '/reports/turkey-premium-consulting-2026.pdf', // placeholder — kullanıcı PDF upload'undan sonra aktif
};

export const IndustryReportPage: React.FC = () => {
  const { language } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', org: '', role: '' });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email) || !consent) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          source: `industry-report:${REPORT.slug}`,
          metadata: form,
        }),
      });
      if (res.ok || res.status === 409) {
        setStatus('success');
        trackFormSubmit(`industry-report-${REPORT.slug}`, true);
      } else {
        setStatus('error');
        trackFormSubmit(`industry-report-${REPORT.slug}`, false);
      }
    } catch {
      setStatus('error');
      trackFormSubmit(`industry-report-${REPORT.slug}`, false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-slate-300">
      <Helmet>
        <title>{`${REPORT.title} | eCyPro`}</title>
        <meta name="description" content={REPORT.subtitle} />
        <link rel="canonical" href={buildCanonical(`/industry-reports/${REPORT.slug}`, language)} />
      </Helmet>
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-10 items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-secondary mb-3 flex items-center gap-2">
              <FileText size={12} /> Industry Report · {REPORT.publishDate}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
              {REPORT.title}
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-6">{REPORT.subtitle}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 mb-8">
              <span>
                <strong className="text-white">{REPORT.pageCount}</strong> sayfa
              </span>
              <span>
                <strong className="text-white">7 bölüm</strong>
              </span>
              <span>Yazar: {REPORT.authors.join(', ')}</span>
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              İçindekiler
            </h2>
            <ul className="space-y-2 mb-6">
              {REPORT.sections.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-200">
                  <span className="w-6 h-6 rounded-md bg-secondary/10 border border-secondary/20 text-xs font-bold text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 italic">
              Bu rapor anonimized engagement data + sektörel benchmark + yurtdışı kaynak üçlüsünden
              derlenmiştir.
            </p>
          </div>
          <aside className="md:sticky md:top-32 h-fit p-6 bg-gradient-to-br from-secondary/15 to-primary/10 border border-secondary/30 rounded-2xl">
            <h3 className="text-lg font-serif font-bold text-white mb-3">Ücretsiz PDF Erişimi</h3>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              E-postanıza PDF link gönderilir + bültenimize abone olursunuz (istediğinizde
              abonelikten çıkabilirsiniz).
            </p>
            {status === 'success' ? (
              <div className="text-center" role="status" aria-live="polite">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-200 text-sm mb-4">PDF link e-postanıza geldi!</p>
                <a
                  href={REPORT.pdfUrl}
                  download
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors text-sm"
                >
                  <Download size={14} /> Direkt İndir
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3" noValidate>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ad Soyad"
                  aria-label="İsim"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@kurum.com"
                  aria-label="E-posta"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
                <input
                  type="text"
                  value={form.org}
                  onChange={(e) => setForm({ ...form, org: e.target.value })}
                  placeholder="Kurum"
                  aria-label="Kurum"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Pozisyon (opsiyonel)"
                  aria-label="Pozisyon"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
                <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-secondary"
                  />
                  <span className="leading-relaxed">
                    KVKK kapsamında bülten + rapor erişimi için açık rıza.{' '}
                    <Link to="/privacy/data-rights" className="text-secondary underline">
                      Detay
                    </Link>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Gönderiliyor
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Raporu Al
                    </>
                  )}
                </button>
                {status === 'error' && (
                  <p className="text-xs text-red-400" role="alert">
                    Bir hata oluştu. Lütfen email + KVKK rızasını kontrol edin.
                  </p>
                )}
              </form>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default IndustryReportPage;
