import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormData } from '../../schemas/contact';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Logger } from '../../lib/logger';
import { trackForm } from '../../lib/analytics';

export const ContactForm: React.FC = () => {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Logger.info('Form submitted:', data);
      setSubmitStatus('success');
      trackForm('contact', 'submit_success');
      reset();
    } catch (error) {
      Logger.error('Submission error:', error);
      setSubmitStatus('error');
      trackForm('contact', 'submit_error');
    } finally {
      setIsSubmitting(false);
    }
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
    >
      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-400">
          {t('contact.form.name') || 'Ad Soyad'}
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
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
            {t('contact.form.submit') || 'Mesajı Gönder'} <Send size={20} />
          </>
        )}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div
          role="status"
          aria-live="polite"
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
