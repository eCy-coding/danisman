import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContactForm } from '../components/forms/ContactForm';
import { useTranslation, getLang, MultiLang, Language } from '@/lib/i18n';
import { Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { CONTACT_CONFIG } from '@/data/copy/common';
import { Helmet } from 'react-helmet-async';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';

const PLAN_LABELS: Record<string, { tr: string; en: string }> = {
  starter: { tr: 'Başlangıç', en: 'Starter' },
  growth: { tr: 'Büyüme', en: 'Growth' },
  enterprise: { tr: 'Kurumsal', en: 'Enterprise' },
};

export const ContactPage: React.FC = () => {
  const { t, language } = useTranslation();
  const lang = language as Language;
  const [searchParams] = useSearchParams();
  const planParam = (searchParams.get('plan') || '').toLowerCase();
  const planLabel = PLAN_LABELS[planParam] ?? null;

  const getAddress = () => {
    return getLang(CONTACT_CONFIG.address as MultiLang, lang);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{t('contact.title') || 'İletişim'} | EcyPro Premium Consulting</title>
        <meta
          name="description"
          content="EcyPro ile hemen iletişime geçin. Stratejik büyüme hedefleriniz için profesyonel destek alın."
        />
        <link rel="canonical" href="https://ecypro.com/contact" />
      </Helmet>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang.startsWith('tr') ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
          {
            name: lang.startsWith('tr') ? 'İletişim' : 'Contact',
            url: 'https://ecypro.com/contact',
          },
        ])}
      />

      <div id="contact" className="bg-neutral min-h-screen pt-32 pb-24 font-sans text-slate-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className="space-y-12">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                  {t('contact.title') || 'Projelerinizi'} <br />
                  <span className="text-secondary">
                    {t('contact.subtitle') || 'Hayata Geçirelim'}
                  </span>
                </h1>
                <p className="text-lg text-slate-400 font-light leading-relaxed">
                  {t('contact.intro') ||
                    'Bizimle iletişime geçerek işinizi bir sonraki seviyeye taşıyacak stratejileri belirleyin.'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 glass-card rounded-xl transition-all hover:border-white/20">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Email</h3>
                    <a
                      href={`mailto:${CONTACT_CONFIG.email}`}
                      className="text-lg text-slate-300 hover:text-secondary transition-colors"
                    >
                      {CONTACT_CONFIG.email}
                    </a>
                    <p className="text-xs text-slate-400 mt-2">7/24 Destek</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-xl transition-all hover:border-white/20">
                  <div className="p-3 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Telefon</h3>
                    <a
                      href={`tel:${CONTACT_CONFIG.phone}`}
                      className="text-lg text-slate-300 hover:text-secondary transition-colors"
                    >
                      {CONTACT_CONFIG.phone}
                    </a>
                    <p className="text-xs text-slate-400 mt-2">Pazartesi - Cuma, 09:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-xl transition-all hover:border-white/20">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Merkez Ofis</h3>
                    <p className="text-lg text-slate-300 leading-relaxed">{getAddress()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="glass-card p-8 md:p-12 rounded-3xl sticky top-32">
              {planLabel && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-slate-100"
                >
                  <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <strong className="block text-white">
                      {lang.startsWith('tr')
                        ? `Seçilen plan: ${planLabel.tr}`
                        : `Selected plan: ${planLabel.en}`}
                    </strong>
                    <span className="text-slate-300">
                      {lang.startsWith('tr')
                        ? 'Teklifimizi bu planı baz alarak hazırlayacağız.'
                        : 'We will prepare your proposal based on this plan.'}
                    </span>
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold mb-8 text-white">
                {t('contact.form_title') || 'Mesaj Gönderin'}
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
