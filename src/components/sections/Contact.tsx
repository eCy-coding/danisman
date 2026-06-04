import React, { useState } from 'react';
import { Send, CheckCircle, Mail, MapPin, Phone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MouseGlow } from '../ui/MouseGlow';
import { MagneticButton } from '../ui/MagneticButton';
import { CONTACT_CONFIG } from '../../constants';
import { sendContactEmail } from '../../services/emailService';
import { Logger } from '../../lib/logger';

const ContactInfoItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
}> = ({ icon, title, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className="flex items-start gap-4 text-slate-300 group"
  >
    <div className="mt-1 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-secondary group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-colors duration-500">
      {icon}
    </div>
    <div>
      <h3 className="font-medium text-white mb-1 group-hover:text-secondary transition-colors duration-300">
        {title}
      </h3>
      <div className="text-slate-400 font-light leading-relaxed">{children}</div>
    </div>
  </motion.div>
);

const InputField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  multiline?: boolean;
}> = ({ label, type = 'text', value, onChange, required, multiline }) => {
  const [isFocused, setIsFocused] = useState(false);
  const reactId = React.useId();
  const fieldId = `contact-section-${reactId}`;

  return (
    <div className="relative group">
      <label
        htmlFor={fieldId}
        className={`absolute left-4 transition-all duration-300 pointer-events-none z-10 ${
          isFocused || value
            ? '-top-2.5 text-xs bg-surface px-2 text-secondary'
            : 'top-4 text-slate-400'
        }`}
      >
        {label} {required && '*'}
      </label>

      {/* Ambient glow effect behind input */}
      <div
        className={`absolute -inset-0.5 bg-linear-to-r from-secondary/50 to-primary/50 rounded-xl blur opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-30' : 'group-hover:opacity-10'}`}
      />

      <div className="relative bg-surface rounded-xl border border-white/10 overflow-hidden transition-colors duration-300">
        {/* S13-R3-A9 — aria-required mirrors HTML `required` so SR users */}
        {/* are informed before they leave the field empty. Bare `*` glyph */}
        {/* in the label is announced as "asterisk" by some SRs — keep it */}
        {/* visible but back it up with semantic aria-required. */}
        {multiline ? (
          <textarea
            id={fieldId}
            aria-label={label}
            aria-required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            rows={4}
            className="w-full bg-transparent px-4 pt-4 pb-3 text-white focus:outline-none resize-none"
          />
        ) : (
          <input
            id={fieldId}
            aria-label={label}
            aria-required={required}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            className="w-full bg-transparent px-4 pt-4 pb-3 text-white focus:outline-none h-14"
          />
        )}
      </div>
    </div>
  );
};

export const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string>('');

  // S13-P4 F26 — Previously this handler did
  //   `await new Promise(r => setTimeout(r, 1500)); setStatus('success')`
  // i.e. the homepage contact form was a SILENT NO-OP and pretended every
  // submission succeeded. Users were never reaching us. Wire it to the same
  // backend pipeline (`/api/contact` via sendContactEmail) used by the
  // dedicated /contact page so submissions actually hit Telegram + audit
  // log. EmailService already handles validation, demo-mode fallback, and
  // i18n error strings.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setServerError('');

    try {
      const result = await sendContactEmail({
        name: formState.name,
        email: formState.email,
        message: formState.message,
      });

      if (result.success) {
        setStatus('success');
        setFormState({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
        setServerError(result.message);
      }
    } catch (err) {
      Logger.error('Homepage contact submit failed', err);
      setStatus('error');
      setServerError('Bir hata oluştu — lütfen birkaç saniye sonra tekrar deneyin.');
    }
  };

  return (
    // S13-R3-A8 — section copy is TR-only ("İletişim", "Geleceği Birlikte
    // Tasarlayalım", etc.). Set lang="tr" so SR/Voice Control pronounce
    // correctly until proper i18n wiring lands.
    <section id="contact" lang="tr" className="py-32 lg:py-48 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(30,58,138,0.08),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Contact Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                İletişim
              </div>
              {/* S13-P4 F13 — original "Geleceği Birlikte<br/>{' '} */}
              {/* <span>Tasarlayalım</span>" produced "Geleceği Birlikte  */}
              {/* Tasarlayalım" (double space) in textContent. Dropping the */}
              {/* whitespace entirely produced "Geleceği BirlikteTasarlayalım" */}
              {/* (no space). The visual layout uses <br/> for the line break; */}
              {/* a single explicit {' '} keeps textContent and aria-label sane */}
              {/* for SEO and screen readers without a visible glyph. */}
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-sans font-light text-white mb-8 leading-tight tracking-tight"
                aria-label="Geleceği Birlikte Tasarlayalım"
              >
                Geleceği Birlikte
                <br />
                <span className="text-secondary font-medium"> Tasarlayalım</span>
              </h2>
              <p className="text-slate-400 text-lg lg:text-xl font-light mb-16 max-w-lg leading-relaxed">
                Projeleriniz için stratejik bir ortak arıyorsanız, uzman ekibimizle tanışın. İlk
                adımı bugün atın.
              </p>
            </motion.div>

            <div className="space-y-8">
              <ContactInfoItem icon={<MapPin size={20} />} title="Ofis" delay={0.2}>
                <p>İstanbul / Online görüşme — adres sahibe bağlı paylaşılır</p>
              </ContactInfoItem>
              <ContactInfoItem icon={<Phone size={20} />} title="Telefon" delay={0.3}>
                <a
                  href={`tel:${CONTACT_CONFIG.phone}`}
                  className="hover:text-secondary transition-colors"
                >
                  {CONTACT_CONFIG.phoneDisplay}
                </a>
              </ContactInfoItem>
              <ContactInfoItem icon={<Mail size={20} />} title="E-posta" delay={0.4}>
                <p>info@ecypro.com</p>
              </ContactInfoItem>
            </div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            {/* Soft backdrop glow behind the form */}
            <div
              className="absolute -inset-10 bg-linear-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-20 pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative bg-surface/80 border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
              <MouseGlow />

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="h-full flex flex-col items-center justify-center text-center py-16"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center mb-8 relative">
                      <div
                        className="absolute inset-0 rounded-full border-t border-green-500 animate-spin opacity-50"
                        style={{ animationDuration: '3s' }}
                      />
                      <CheckCircle size={36} />
                    </div>
                    <h3 className="text-3xl font-sans font-medium text-white mb-4">
                      Mesajınız Alındı
                    </h3>
                    <p className="text-slate-400 font-light text-lg mb-12">
                      En kısa sürede profesyonel ekibimiz size dönüş yapacaktır.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="px-8 py-3 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                    >
                      Yeni Mesaj Gönder
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 relative z-10"
                    noValidate
                  >
                    {status === 'error' && serverError && (
                      <div
                        role="alert"
                        className="flex items-center gap-3 rounded-lg border border-red-700/40 bg-red-900/30 px-4 py-3 text-sm text-red-200"
                      >
                        <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                        <span>{serverError}</span>
                      </div>
                    )}
                    <InputField
                      label="Ad Soyad"
                      value={formState.name}
                      onChange={(val) => setFormState({ ...formState, name: val })}
                      required
                    />

                    <InputField
                      label="E-posta"
                      type="email"
                      value={formState.email}
                      onChange={(val) => setFormState({ ...formState, email: val })}
                      required
                    />

                    <InputField
                      label="Mesajınız"
                      multiline
                      value={formState.message}
                      onChange={(val) => setFormState({ ...formState, message: val })}
                      required
                    />

                    <div className="pt-4">
                      <MagneticButton>
                        <button
                          type="submit"
                          disabled={status === 'submitting'}
                          className="w-full bg-white text-black font-medium py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group overflow-hidden relative"
                        >
                          <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                          <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                            {status === 'submitting' ? 'Gönderiliyor...' : 'Mesajı Gönder'}
                          </span>
                          {/* S13-R12-T1 — `status.includes('submitting')` */}
                          {/* worked only because TS narrowed the finite union */}
                          {/* to `string`. The intent is "hide the icon while */}
                          {/* submitting"; equality is the correct, deterministic */}
                          {/* check that doesn't pretend to substring-match. */}
                          {status !== 'submitting' && (
                            <Send
                              size={18}
                              className="relative z-10 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-500"
                            />
                          )}
                        </button>
                      </MagneticButton>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
