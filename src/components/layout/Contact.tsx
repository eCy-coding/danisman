import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FadeIn } from '../common/FadeIn';
import { MessageCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { useTranslation } from '../../lib/i18n';
import { CONTACT_CONFIG, CONTACT_FORM_COPY } from '../../data/copy/common';
import { sendContactEmail } from '../../services/emailService';
import { Logger } from '../../lib/logger';

// Schema Generator for Bilingual Validation
const createContactSchema = (lang: 'tr' | 'en') => {
  return z.object({
    name: z.string().min(2, {
      message:
        lang === 'tr'
          ? 'Adınız en az 2 karakter olmalıdır.'
          : 'Name must be at least 2 characters.',
    }),
    email: z.string().email({
      message:
        lang === 'tr'
          ? 'Geçerli bir e-posta adresi giriniz.'
          : 'Please enter a valid email address.',
    }),
    subject: z.string().min(3, {
      message:
        lang === 'tr'
          ? 'Konu en az 3 karakter olmalıdır.'
          : 'Subject must be at least 3 characters.',
    }),
    message: z.string().min(10, {
      message:
        lang === 'tr'
          ? 'Mesajınız en az 10 karakter olmalıdır.'
          : 'Message must be at least 10 characters.',
    }),
    bot_check: z.string().optional(),
  });
};

type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;

export const Contact: React.FC = () => {
  const { language: lang } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(createContactSchema(lang)),
  });

  // Listen for service selection from Services component
  useEffect(() => {
    const handleServiceSelection = (e: CustomEvent) => {
      if (e.detail) {
        setValue('subject', `${e.detail}`);
      }
    };

    window.addEventListener('serviceSelected', handleServiceSelection as EventListener);

    // Check URL params on mount
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    if (subjectParam) {
      setValue('subject', subjectParam);
    }

    return () => {
      window.removeEventListener('serviceSelected', handleServiceSelection as EventListener);
    };
  }, [setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setStatus('submitting');
    setServerError('');

    try {
      const result = await sendContactEmail({
        name: data.name,
        email: data.email,
        message: `${data.subject}\n\n${data.message}`,
      });

      if (result.success) {
        trackEvent('Contact', 'Form Submit', 'Success');
        setStatus('success');
        reset();
      } else {
        trackEvent('Contact', 'Form Submit', 'Error');
        setStatus('error');
        setServerError(result.message);
      }
    } catch (_err) {
      trackEvent('Contact', 'Form Submit', 'Error');
      setStatus('error');
      setServerError(CONTACT_FORM_COPY.errorMsg[lang] || 'An error occurred.');
    }
  };

  return (
    <section
      id="contact"
      className="py-24 lg:py-32 bg-neutral border-t border-white/5"
      aria-labelledby="contact-heading"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
            <h2
              id="contact-heading"
              className="text-h2-d font-sans font-medium text-white mb-8 tracking-tight"
            >
              {CONTACT_FORM_COPY.title[lang]}
            </h2>
            <p className="text-slate-300 text-lg mb-12 leading-relaxed font-light">
              {CONTACT_FORM_COPY.description[lang]}
            </p>

            <div className="space-y-10 border-t border-white/10 pt-10">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {CONTACT_FORM_COPY.headquarters[lang]}
                </h4>
                <p className="text-white text-xl font-sans">
                  {CONTACT_CONFIG.address[lang as keyof typeof CONTACT_CONFIG.address]}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">
                    {CONTACT_FORM_COPY.emailLabel[lang]}
                  </h4>
                  <a
                    href={`mailto:${CONTACT_CONFIG.email}`}
                    className="text-primary text-lg hover:text-secondary transition-colors"
                  >
                    {CONTACT_CONFIG.email}
                  </a>
                </div>
                {/* P46 C4: Telefon CONTACT_CONFIG.phone boş ise gizle (kırık tel: link). */}
                {CONTACT_CONFIG.phone && CONTACT_CONFIG.phone.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">
                      {CONTACT_FORM_COPY.phoneLabel[lang]}
                    </h4>
                    <a
                      href={`tel:${CONTACT_CONFIG.phone}`}
                      className="text-primary text-lg hover:text-secondary transition-colors"
                    >
                      {CONTACT_CONFIG.phoneDisplay}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <a
                  href={CONTACT_CONFIG.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('Contact', 'WhatsApp Click')}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-[#0E7266] text-white rounded-lg font-bold shadow-sm hover:shadow-md hover:bg-[#128C7E] transition-all"
                >
                  <MessageCircle size={20} />
                  {CONTACT_FORM_COPY.whatsapp[lang]}
                </a>
              </div>
            </div>
          </div>

          <FadeIn delay={200}>
            <div className="glass-card p-10 md:p-14 rounded-3xl">
              <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {CONTACT_FORM_COPY.responsePromise[lang]}
              </p>

              {status === 'success' ? (
                <div className="bg-green-900/30 border border-green-700/30 rounded-xl p-8 text-center animate-in fade-in">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-300 mb-2">
                    {CONTACT_FORM_COPY.successTitle[lang]}
                  </h3>
                  <p className="text-green-400">{CONTACT_FORM_COPY.successDesc[lang]}</p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-sm font-bold text-green-400 hover:underline"
                  >
                    {CONTACT_FORM_COPY.newMsg[lang]}
                  </button>
                </div>
              ) : (
                <>
                  {/* Honeypot Field - Invisible to humans, tempting for bots */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register('bot_check')}
                    />
                  </div>

                  <form
                    className="space-y-6"
                    onSubmit={handleSubmit(async (data) => {
                      // Honeypot Check
                      if (data.bot_check) {
                        Logger.info('Bot detected. Silently rejecting.');
                        setStatus('success'); // Fake success
                        reset();
                        return;
                      }
                      await onSubmit(data);
                    })}
                    noValidate
                  >
                    {status === 'error' && serverError && (
                      <div
                        className="bg-red-900/30 border border-red-700/30 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2"
                        role="alert"
                      >
                        <AlertCircle size={18} />
                        <span className="text-sm">{serverError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group relative">
                        <input
                          type="text"
                          id="name"
                          {...register('name')}
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? 'name-error' : undefined}
                          className={`peer w-full bg-white/5 border rounded-lg px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all shadow-sm placeholder-transparent disabled:opacity-50 ${errors.name ? 'border-red-500' : 'border-white/10'}`}
                          placeholder={CONTACT_FORM_COPY.placeholders.name[lang]}
                          disabled={status === 'submitting'}
                        />
                        <label
                          htmlFor="name"
                          className="absolute left-4 top-2 text-xxs font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xxs peer-focus:text-secondary"
                        >
                          {CONTACT_FORM_COPY.labels.name[lang]}
                        </label>
                        {errors.name && (
                          <p id="name-error" role="alert" className="text-red-500 text-xs mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="group relative">
                        <input
                          type="email"
                          id="email"
                          {...register('email')}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          className={`peer w-full bg-white/5 border rounded-lg px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all shadow-sm placeholder-transparent disabled:opacity-50 ${errors.email ? 'border-red-500' : 'border-white/10'}`}
                          placeholder={CONTACT_FORM_COPY.placeholders.email[lang]}
                          disabled={status === 'submitting'}
                        />
                        <label
                          htmlFor="email"
                          className="absolute left-4 top-2 text-xxs font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xxs peer-focus:text-secondary"
                        >
                          {CONTACT_FORM_COPY.labels.email[lang]}
                        </label>
                        {errors.email && (
                          <p id="email-error" role="alert" className="text-red-500 text-xs mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="group relative">
                      <input
                        type="text"
                        id="subject"
                        {...register('subject')}
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? 'subject-error' : undefined}
                        className={`peer w-full bg-white/5 border rounded-lg px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all shadow-sm placeholder-transparent disabled:opacity-50 ${errors.subject ? 'border-red-500' : 'border-white/10'}`}
                        placeholder={CONTACT_FORM_COPY.placeholders.subject[lang]}
                        disabled={status === 'submitting'}
                      />
                      <label
                        htmlFor="subject"
                        className="absolute left-4 top-2 text-xxs font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xxs peer-focus:text-secondary"
                      >
                        {CONTACT_FORM_COPY.labels.subject[lang]}
                      </label>
                      {errors.subject && (
                        <p id="subject-error" role="alert" className="text-red-500 text-xs mt-1">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    <div className="group relative">
                      <textarea
                        id="message"
                        rows={4}
                        {...register('message')}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                        className={`peer w-full bg-white/5 border rounded-lg px-4 pt-6 pb-2 text-white focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all resize-none shadow-sm placeholder-transparent disabled:opacity-50 ${errors.message ? 'border-red-500' : 'border-white/10'}`}
                        placeholder={CONTACT_FORM_COPY.placeholders.message[lang]}
                        disabled={status === 'submitting'}
                      ></textarea>
                      <label
                        htmlFor="message"
                        className="absolute left-4 top-2 text-xxs font-bold text-slate-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xxs peer-focus:text-secondary"
                      >
                        {CONTACT_FORM_COPY.labels.message[lang]}
                      </label>
                      {errors.message && (
                        <p id="message-error" role="alert" className="text-red-500 text-xs mt-1">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full btn-premium-gold font-bold py-5 rounded-lg disabled:opacity-50 transition-colors shadow-lg uppercase tracking-wider text-sm outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary flex items-center justify-center gap-2"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />{' '}
                          {CONTACT_FORM_COPY.submitting[lang]}
                        </>
                      ) : (
                        CONTACT_FORM_COPY.send[lang]
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
