/**
 * DemoRequestModal — Kurumsal Demo Talep Formu
 * istek5.txt Phase 2: UI/UX — Enterprise Lead Capture (High-Intent)
 *
 * Tetikleyici: "Demo Talep Et" / "Request Demo" butonları
 * localStorage: `demo_requested` → 7 gün süre
 *
 * Form alanları:
 * - Ad Soyad, Kurumsal Email, Şirket Adı, Çalışan Sayısı, Mesaj (opsiyonel)
 * - KVKK/GDPR onay
 *
 * POST /api/contact → source=demo-request
 * Success → Calendly linki + teşekkür
 * Validation: email domain (no gmail/hotmail)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, BarChart3, CheckCircle, Send, Building2, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';

interface DemoFormData {
  name: string;
  email: string;
  company: string;
  size: string;
  message: string;
  consent: boolean;
}

const COMPANY_SIZES = [
  { value: '1-10', label: { tr: '1–10 kişi', en: '1–10 people' } },
  { value: '11-50', label: { tr: '11–50 kişi', en: '11–50 people' } },
  { value: '51-200', label: { tr: '51–200 kişi', en: '51–200 people' } },
  { value: '201-500', label: { tr: '201–500 kişi', en: '201–500 people' } },
  { value: '500+', label: { tr: '500+ kişi', en: '500+ people' } },
];

const PERSONAL_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'yandex', 'proton'];

function isCorporateEmail(email: string): boolean {
  const domain = email.split('@')[1]?.split('.')[0] ?? '';
  return !PERSONAL_DOMAINS.includes(domain.toLowerCase());
}

interface DemoRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ open, onClose }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const prefersReduced = useReducedMotion();

  const [form, setForm] = useState<DemoFormData>({
    name: '',
    email: '',
    company: '',
    size: '',
    message: '',
    consent: false,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<DemoFormData>>({});

  const setField = (k: keyof DemoFormData, v: string | boolean): void => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof DemoFormData, string>> = {};
    if (!form.name.trim()) e.name = lang === 'tr' ? 'Ad soyad gerekli' : 'Name required';
    if (!form.email || !isCorporateEmail(form.email)) {
      e.email = lang === 'tr' ? 'Kurumsal email gerekli' : 'Corporate email required';
    }
    if (!form.company.trim()) e.company = lang === 'tr' ? 'Şirket adı gerekli' : 'Company required';
    if (!form.size) e.size = lang === 'tr' ? 'Çalışan sayısı seçin' : 'Select company size';
    if (!form.consent) e.consent = lang === 'tr' ? 'Onay gerekli' : 'Consent required';
    setErrors(e as Partial<DemoFormData>);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate() || status === 'loading') return;

    setStatus('loading');
    trackEvent('DemoRequest', 'Submit', form.company);

    try {
      const baseUrl =
        (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'demo-request' }),
      });
      if (!res.ok) throw new Error('submit_failed');
      setStatus('success');
      try {
        localStorage.setItem('demo_requested', String(Date.now()));
      } catch {
        /* ignore */
      }
      trackEvent('DemoRequest', 'Success', form.company);
    } catch {
      setStatus('error');
    }
  };

  const FEATURES = [
    { tr: 'Canlı platform turu (30 dk)', en: 'Live platform tour (30 min)' },
    { tr: 'İş sektörünüze özel demo', en: 'Industry-specific demo' },
    { tr: 'ROI projeksiyonu', en: 'ROI projection' },
    { tr: 'Ücretsiz, taahhütsüz', en: 'Free, no-obligation' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-60"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'tr' ? 'Demo talep formu' : 'Demo request form'}
            data-testid="demo-request-modal"
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-61 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto relative w-full max-w-2xl bg-[#0a0f1e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <div
                className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-secondary to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/8 rounded-full blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5 text-secondary" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif text-white">
                        {lang === 'tr'
                          ? 'Kişiselleştirilmiş Demo Talep Et'
                          : 'Request a Personalized Demo'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lang === 'tr'
                          ? 'Uzman ekibimiz 24 saat içinde sizinle iletişime geçer'
                          : 'Our expert team will reach out within 24 hours'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
                    className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary shrink-0"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                {status === 'success' ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                      <CheckCircle size={32} className="text-emerald-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {lang === 'tr' ? 'Talebiniz Alındı!' : 'Request Received!'}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                      {lang === 'tr'
                        ? '24 saat içinde kurumsal email adresinize detayları göndereceğiz. Demo görüşmesi için takvimimizi paylaşacağız.'
                        : "We'll send details to your corporate email within 24 hours and share our calendar for the demo session."}
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
                    >
                      {lang === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
                    {/* Left: features */}
                    <div className="sm:col-span-2 hidden sm:block">
                      <div className="rounded-2xl bg-white/3 border border-white/8 p-5 h-full">
                        <p className="text-xs font-mono text-secondary uppercase tracking-widest mb-4">
                          {lang === 'tr' ? 'Demo İçeriği' : 'What You Get'}
                        </p>
                        <ul className="space-y-3">
                          {FEATURES.map((f) => (
                            <li
                              key={f.en}
                              className="flex items-start gap-2 text-xs text-slate-400"
                            >
                              <CheckCircle
                                size={12}
                                className="text-emerald-400 shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              {lang === 'tr' ? f.tr : f.en}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6 pt-4 border-t border-white/8">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-500" aria-hidden="true" />
                            <p className="text-[10px] text-slate-600">
                              {lang === 'tr'
                                ? 'Kurumsal müşterilere özel'
                                : 'For enterprise clients'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: form */}
                    <form
                      onSubmit={(e) => void handleSubmit(e)}
                      className="sm:col-span-3 space-y-4"
                      noValidate
                    >
                      {/* Name + Company */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setField('name', e.target.value)}
                            placeholder={lang === 'tr' ? 'Ad Soyad *' : 'Full Name *'}
                            aria-label={lang === 'tr' ? 'Ad soyad' : 'Full name'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/50 transition-colors"
                          />
                          {errors.name && (
                            <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={form.company}
                            onChange={(e) => setField('company', e.target.value)}
                            placeholder={lang === 'tr' ? 'Şirket Adı *' : 'Company *'}
                            aria-label={lang === 'tr' ? 'Şirket adı' : 'Company name'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/50 transition-colors"
                          />
                          {errors.company && (
                            <p className="text-[10px] text-rose-400 mt-1">{errors.company}</p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder={lang === 'tr' ? 'Kurumsal Email *' : 'Corporate Email *'}
                          aria-label={lang === 'tr' ? 'Kurumsal email' : 'Corporate email'}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/50 transition-colors"
                        />
                        {errors.email && (
                          <p className="text-[10px] text-rose-400 mt-1">{errors.email}</p>
                        )}
                      </div>

                      {/* Company size */}
                      <div>
                        <select
                          value={form.size}
                          onChange={(e) => setField('size', e.target.value)}
                          aria-label={lang === 'tr' ? 'Çalışan sayısı' : 'Company size'}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 transition-colors appearance-none"
                        >
                          <option value="" className="bg-[#0a0f1e]">
                            {lang === 'tr' ? 'Çalışan Sayısı *' : 'Company Size *'}
                          </option>
                          {COMPANY_SIZES.map((s) => (
                            <option key={s.value} value={s.value} className="bg-[#0a0f1e]">
                              {lang === 'tr' ? s.label.tr : s.label.en}
                            </option>
                          ))}
                        </select>
                        {errors.size && (
                          <p className="text-[10px] text-rose-400 mt-1">{errors.size}</p>
                        )}
                      </div>

                      {/* Message */}
                      <textarea
                        value={form.message}
                        onChange={(e) => setField('message', e.target.value)}
                        placeholder={
                          lang === 'tr' ? 'Özel notunuz (opsiyonel)' : 'Additional notes (optional)'
                        }
                        rows={2}
                        aria-label={lang === 'tr' ? 'Ek not' : 'Additional note'}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary/50 transition-colors resize-none"
                      />

                      {/* Consent */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={form.consent}
                            onChange={(e) => setField('consent', e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded border transition-colors ${form.consent ? 'bg-secondary border-secondary' : 'border-white/30'}`}
                          >
                            {form.consent && (
                              <CheckCircle size={10} className="text-white" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-relaxed">
                          {lang === 'tr'
                            ? 'Demo görüşmesi için verilerimin işlenmesine (KVKK) onay veriyorum.'
                            : 'I consent to processing my data for the demo call (GDPR).'}
                        </span>
                      </label>
                      {errors.consent && (
                        <p className="text-[10px] text-rose-400">{errors.consent}</p>
                      )}

                      {status === 'error' && (
                        <p role="alert" className="text-xs text-rose-400">
                          {lang === 'tr'
                            ? 'Bir hata oluştu. Tekrar deneyin.'
                            : 'Something went wrong. Please try again.'}
                        </p>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      >
                        {status === 'loading' ? (
                          <div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <>
                            <Send size={14} aria-hidden="true" />
                            {lang === 'tr' ? 'Demo Talep Et' : 'Request Demo'}
                            <ArrowRight size={14} aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
