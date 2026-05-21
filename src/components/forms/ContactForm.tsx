import React from 'react';
import posthog from 'posthog-js';
import { useNavigate } from 'react-router-dom';
import { contactSchema, ContactFormData } from '../../schemas/contact';
import { Send, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { trackForm } from '../../lib/analytics';
import { createForm } from '../../lib/forms/createForm';

// P15 — Tek otorite: createForm factory.
//   • zod resolver + submit-lock + AbortController + mountedRef
//   • idempotency-key, analytics start/success/error
//   • honeypot (hp_field) — bot trap (schema'da `optional`)
//
// Track B — bağlı endpoint /api/v1/contact. createForm fetch'i kendi yapar;
// dev/preview build'lerde aynı host'a relative POST eder. Mock-server (E2E)
// 200 OK döndürerek mevcut success akışını korur.
const CONTACT_ENDPOINT = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(
  /\/$/,
  '',
);
const contactForm = createForm({
  name: 'contact',
  schema: contactSchema,
  endpoint: `${CONTACT_ENDPOINT}/v1/contact`,
  defaultValues: {
    name: '',
    email: '',
    company: '',
    subject: 'general',
    message: '',
    kvkkConsent: false,
    hp_field: '',
  },
});

export const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { rhf, status, submit, reset } = contactForm.useTypedForm();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = rhf;

  const isSubmitting = status === 'submitting';
  const submitStatus: 'idle' | 'success' | 'error' =
    status === 'success'
      ? 'success'
      : status === 'error' || status === 'rate_limited'
        ? 'error'
        : 'idle';

  // On success: brief inline confirmation, then route to /thank-you so the
  // post-conversion experience (case studies + Calendly direct + newsletter)
  // takes over instead of the user staring at an empty form.
  React.useEffect(() => {
    if (status === 'success') {
      const r = setTimeout(() => reset(), 3000);
      const n = setTimeout(() => navigate('/thank-you'), 1200);
      return () => {
        clearTimeout(r);
        clearTimeout(n);
      };
    }
    return undefined;
  }, [status, reset, navigate]);

  const onSubmit = (data: ContactFormData) => {
    // P97 — PostHog capture is a no-op when the user hasn't opted in
    // (init runs with opt_out_capturing_by_default: true). Safe to call
    // unconditionally; payload carries no PII (name/email/message are
    // intentionally excluded — only structural signals).
    try {
      posthog.capture('contact_submit', {
        has_company: Boolean(data.company),
        message_length: data.message?.length ?? 0,
      });
    } catch {
      // PostHog not initialised (no env key) — silently degrade
    }
    void submit(data);
  };

  const handleFirstFocus = (): void => {
    trackForm('contact', 'start');
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      data-testid="contact-form"
      aria-label="Contact form"
      noValidate
    >
      {/* P15 — Honeypot field, off-screen + tabIndex=-1 — bot trap. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <label htmlFor="hp_field">Leave this empty</label>
        <input
          id="hp_field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('hp_field')}
        />
      </div>
      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-400">
          {t('contact.form.name') || 'Ad Soyad'}
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
          data-testid="contact-name"
          onFocus={handleFirstFocus}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full px-4 py-3 rounded-lg border bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
            errors.name ? 'border-red-400/50 bg-red-500/5' : 'border-white/10 focus:border-primary'
          }`}
          placeholder={t('contact.form.name_placeholder') || 'Adınız Soyadınız'}
        />
        {errors.name && (
          <p
            id="name-error"
            role="alert"
            className="text-red-500 text-xs flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} aria-hidden="true" />{' '}
            {t(errors.name.message || 'contact.form.required')}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-400">
          {t('contact.form.email') || 'E-posta Adresi'}
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          data-testid="contact-email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-4 py-3 rounded-lg border bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
            errors.email ? 'border-red-400/50 bg-red-500/5' : 'border-white/10 focus:border-primary'
          }`}
          placeholder="email@company.com"
        />
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="text-red-500 text-xs flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} aria-hidden="true" />{' '}
            {t(errors.email.message || 'contact.form.invalid_email')}
          </p>
        )}
      </div>

      {/* Subject Field */}
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-slate-400">
          {t('contact.form.subject') || 'Konu'}
        </label>
        <select
          {...register('subject')}
          id="subject"
          data-testid="contact-subject"
          aria-required="true"
          className="w-full px-4 py-3 rounded-lg border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/5 text-white"
        >
          <option value="general">{t('contact.form.subjects.general') || 'Genel Bilgi'}</option>
          <option value="project">{t('contact.form.subjects.project') || 'Proje Teklifi'}</option>
          <option value="partnership">
            {t('contact.form.subjects.partnership') || 'İş Ortaklığı'}
          </option>
          <option value="career">{t('contact.form.subjects.career') || 'Kariyer'}</option>
        </select>
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-slate-400">
          {t('contact.form.message') || 'Mesajınız'}
        </label>
        <textarea
          {...register('message')}
          id="message"
          rows={5}
          data-testid="contact-message"
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={`w-full px-4 py-3 rounded-lg border bg-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none ${
            errors.message
              ? 'border-red-400/50 bg-red-500/5'
              : 'border-white/10 focus:border-primary'
          }`}
          placeholder={t('contact.form.message_placeholder') || 'Size nasıl yardımcı olabiliriz?'}
        />
        {errors.message && (
          <p
            id="message-error"
            role="alert"
            className="text-red-500 text-xs flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} aria-hidden="true" />{' '}
            {t(errors.message.message || 'contact.form.required')}
          </p>
        )}
      </div>

      {/* KVKK explicit opt-in — required by server schema */}
      <div className="space-y-2">
        <label
          htmlFor="kvkkConsent"
          className="flex items-start gap-3 cursor-pointer text-sm text-slate-300 leading-relaxed"
        >
          <input
            {...register('kvkkConsent')}
            id="kvkkConsent"
            type="checkbox"
            data-testid="contact-kvkk"
            aria-required="true"
            aria-invalid={!!errors.kvkkConsent}
            aria-describedby={errors.kvkkConsent ? 'kvkk-error' : undefined}
            className="mt-1 w-4 h-4 accent-secondary cursor-pointer shrink-0"
          />
          <span>
            {t('contact.form.kvkk_label') ||
              'Verilerimin eCyPro tarafından bu talebi yanıtlamak amacıyla işlenmesini kabul ediyorum.'}{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline"
              data-cta="privacy"
              data-track="cta-click"
            >
              {t('contact.form.kvkk_link') || 'Gizlilik Politikası'}
            </a>
          </span>
        </label>
        {errors.kvkkConsent && (
          <p
            id="kvkk-error"
            role="alert"
            className="text-red-500 text-xs flex items-center gap-1 mt-1"
          >
            <AlertCircle size={12} aria-hidden="true" />{' '}
            {t(errors.kvkkConsent.message || 'contact.form.kvkk_required')}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        data-testid="contact-submit"
        data-cta="contact"
        data-track="cta-click"
        className={`w-full py-4 min-h-[52px] rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          isSubmitting
            ? 'bg-white/5 text-slate-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl active:scale-95'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />{' '}
            {t('contact.form.sending') || 'Gönderiliyor...'}
          </>
        ) : (
          <>
            {t('contact.form.submit') || 'Mesajı Gönder · 1 İş Günü Yanıt'} <Send size={20} />
          </>
        )}
      </button>

      {/* P46 C8: Form trust microcopy — submit'in altında SSL + KVKK reassurance.
          Conversion için "güvenlik" friction'ını azaltır (form submission'da
          %15-25 abandon riski kişisel veri concern'leri yüzünden olur). */}
      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Lock size={12} className="text-emerald-400" aria-hidden="true" />
        <span>SSL ile şifreli · KVKK & GDPR uyumlu · Verileriniz 3. taraf ile paylaşılmaz</span>
      </p>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div
          role="status"
          aria-live="polite"
          data-testid="contact-success"
          className="p-4 bg-green-500/10 text-green-400 rounded-xl flex items-center gap-3 animate-fade-in"
        >
          <CheckCircle size={24} aria-hidden="true" />
          <div>
            <p className="font-bold">{t('contact.form.success_title') || 'Mesajınız İletildi!'}</p>
            <p className="text-sm">
              {t('contact.form.success_desc') || 'En kısa sürede size dönüş yapacağız.'}
            </p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          data-testid="contact-error"
          className="p-4 bg-red-500/10 text-red-400 rounded-xl flex items-center gap-3 animate-fade-in"
        >
          <AlertCircle size={24} aria-hidden="true" />
          <div>
            <p className="font-bold">{t('contact.form.error_title') || 'Bir Hata Oluştu'}</p>
            <p className="text-sm">
              {t('contact.form.error_desc') || 'Lütfen tekrar deneyiniz veya telefon ile ulaşınız.'}
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
