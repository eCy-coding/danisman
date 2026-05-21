/**
 * NewsletterSection — Sosyal Kanıtlı İnline Bülten Abone Formu
 * istek5.txt Phase 2: UI/UX — Lead Nurturing / Newsletter
 *
 * - Abone sayısı badge: "1.200+ profesyonel"
 * - Email + submit → POST /api/newsletter/subscribe
 * - KVKK/GDPR onay checkboxu
 * - Success → teşekkür + konfeti efekti
 * - i18n (tr/en), A11y: form, role="status"
 * - Son 3 yayın başlığı (statik seed + API fallback)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

const RECENT_ISSUES = [
  {
    tr: '5 Adımda Dijital Dönüşüm Yol Haritası',
    en: '5-Step Digital Transformation Roadmap',
  },
  {
    tr: 'Yapay Zeka ile İş Süreçlerini Otomatize Etme',
    en: 'Automating Business Processes with AI',
  },
  {
    tr: 'Kurumsal OKR Çerçevesi: Pratik Uygulama Kılavuzu',
    en: 'Enterprise OKR Framework: Practical Implementation Guide',
  },
];

export const NewsletterSection: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !consent || status === 'loading') return;

    setStatus('loading');
    trackEvent('Newsletter', 'Subscribe', 'section');

    try {
      const baseUrl = (
        (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api'
      ).replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: true, source: 'newsletter-section' }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setEmail('');
      trackEvent('Newsletter', 'Subscribe', 'success');
    } catch {
      setStatus('error');
      setErrorMsg(
        lang === 'tr'
          ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
          : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <section
      className="py-20 sm:py-24 px-4 sm:px-6"
      aria-label={lang === 'tr' ? 'Bülten aboneliği' : 'Newsletter subscription'}
      data-testid="newsletter-section"
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl border border-white/10 bg-linear-to-br from-secondary/5 via-transparent to-transparent overflow-hidden p-8 sm:p-12">
          {/* Background glow */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: copy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-secondary" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-widest text-secondary">
                  {lang === 'tr' ? 'Haftalık Bülten' : 'Weekly Newsletter'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif text-white mb-3">
                {lang === 'tr' ? 'Stratejik Büyüme İçgörüleri' : 'Strategic Growth Insights'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {lang === 'tr'
                  ? 'Her hafta 1.200+ yönetici ve girişimciye ulaşan bültenimizde veri odaklı stratejiler, başarı hikayeleri ve sektör analizleri.'
                  : 'Weekly insights reaching 1,200+ executives and entrepreneurs — data-driven strategies, success stories, and industry analysis.'}
              </p>

              {/* Social proof count */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  {['#2563EB', '#7C3AED', '#10B981', '#F59E0B'].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#0a0f1e] flex items-center justify-center text-xs text-white font-bold"
                      style={{ background: c }}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  {lang === 'tr' ? '1.200+ profesyonel abone' : '1,200+ professional subscribers'}
                </span>
              </div>

              {/* Recent issues */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-2">
                  {lang === 'tr' ? 'Son yayınlar:' : 'Recent issues:'}
                </p>
                {RECENT_ISSUES.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <Mail size={10} className="text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                    {lang === 'tr' ? issue.tr : issue.en}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div>
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-4 py-8"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle size={32} className="text-emerald-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {lang === 'tr' ? 'Hoş geldiniz!' : 'Welcome aboard!'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {lang === 'tr'
                        ? 'Bültenimize başarıyla abone oldunuz. İlk sayı yakında e-posta kutunuzda!'
                        : "You've successfully subscribed. First issue in your inbox soon!"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={(e) => void handleSubmit(e)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Email */}
                    <div>
                      <label htmlFor="nl-email" className="sr-only">
                        {lang === 'tr' ? 'Email adresi' : 'Email address'}
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                          aria-hidden="true"
                        />
                        <input
                          id="nl-email"
                          type="email"
                          data-testid="newsletter-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          aria-required="true"
                          aria-invalid={status === 'error' ? true : undefined}
                          aria-describedby={status === 'error' ? 'nl-email-error' : undefined}
                          placeholder={lang === 'tr' ? 'kurumsal@email.com' : 'work@email.com'}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Consent */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          data-testid="newsletter-consent"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            consent
                              ? 'bg-secondary border-secondary'
                              : 'border-white/30 group-hover:border-white/50'
                          }`}
                        >
                          {consent && (
                            <CheckCircle size={10} className="text-white" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 leading-relaxed">
                        {lang === 'tr'
                          ? 'KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum. İstediğimde aboneliğimi iptal edebilirim.'
                          : 'I consent to my personal data being processed per GDPR. I can unsubscribe at any time.'}
                      </span>
                    </label>

                    {/* Error */}
                    {status === 'error' && (
                      <p
                        id="nl-email-error"
                        role="alert"
                        aria-live="assertive"
                        className="text-xs text-rose-400"
                      >
                        {errorMsg}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      data-testid="newsletter-submit"
                      data-cta="newsletter"
                      data-track="cta-click"
                      data-cta-source="newsletter-section"
                      disabled={!email || !consent || status === 'loading'}
                      className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-neutral font-semibold py-3 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    >
                      {status === 'loading' ? (
                        <div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <>
                          <Mail size={15} aria-hidden="true" />
                          {lang === 'tr' ? 'Ücretsiz Abone Ol' : 'Subscribe for Free'}
                          <ArrowRight size={14} aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-slate-600">
                      {lang === 'tr'
                        ? 'Spam yok. İstediğinizde iptal.'
                        : 'No spam. Cancel anytime.'}
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
