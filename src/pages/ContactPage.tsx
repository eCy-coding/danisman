import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContactForm } from '../components/forms/ContactForm';
import { useTranslation, getLang, MultiLang, Language } from '@/lib/i18n';
import {
  Mail,
  MapPin,
  Phone,
  Sparkles,
  MessageCircle,
  Linkedin,
  Calendar,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT_CONFIG } from '@/data/copy/common';
import { Helmet } from 'react-helmet-async';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { buildCanonical } from '@/i18n/canonical';
import { CalendlyEmbed } from '../components/booking/CalendlyEmbed';

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
        {/* P32-T12: keyword-optimised title (primary: "ücretsiz strateji görüşmesi" / "free strategy consultation") */}
        <title>
          {lang.startsWith('tr')
            ? 'Ücretsiz Strateji Görüşmesi — Danışmanlık İletişim | eCyPro'
            : 'Free Strategy Consultation — Contact eCyPro Consulting'}
        </title>
        <meta
          name="description"
          content={
            lang.startsWith('tr')
              ? '45 dakikalık ücretsiz strateji görüşmesi rezervasyonu. KVKK uyumu, dijital dönüşüm ve operasyonel verimlilik danışmanlığı için doğrudan iletişim.'
              : 'Book a complimentary 45-minute strategy session. Direct contact for KVKK compliance, digital transformation and operational efficiency consulting.'
          }
        />
        <link rel="canonical" href={buildCanonical('/contact', lang)} />
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
          {/* atom-6-1: Contact Hero + value prop */}
          <section data-testid="contact-hero" className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-amber-400 mb-4 font-medium">
              {lang.startsWith('tr') ? 'Doğrudan Founder Erişimi' : 'Direct Founder Access'}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {lang.startsWith('tr') ? 'Projenizi Konuşalım' : "Let's Talk About Your Project"}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {lang.startsWith('tr')
                ? '48 saat içinde yanıt, taahhütsüz 30 dakikalık strateji görüşmesi.'
                : 'Response within 48 hours, complimentary 30-minute strategy session.'}
            </p>
          </section>

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

                {/* P46 C4: Telefon kartı CONTACT_CONFIG.phone boş olduğunda
                    kırık `tel:` linki render etmesin. Phone aktive edilince bu
                    kart yeniden görünür hale gelir. */}
                {CONTACT_CONFIG.phone && CONTACT_CONFIG.phone.length > 0 && (
                  <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20">
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Telefon</h3>
                      <a
                        href={`tel:${CONTACT_CONFIG.phone}`}
                        className="text-lg text-slate-300 hover:text-secondary transition-colors"
                      >
                        {CONTACT_CONFIG.phoneDisplay || CONTACT_CONFIG.phone}
                      </a>
                      <p className="text-xs text-slate-400 mt-2">Pazartesi - Cuma, 09:00 - 18:00</p>
                    </div>
                  </div>
                )}

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

            {/* atom-6-2: Form section */}
            <section
              data-testid="contact-form-section"
              className="glass-card p-8 md:p-12 rounded-3xl sticky top-32"
            >
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
            </section>
          </div>
        </div>

        {/* atom-6-3: Channels grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16">
          <section data-testid="contact-channels">
            <h2 className="text-2xl font-bold text-white mb-8">
              {lang.startsWith('tr') ? 'Bize Ulaşın' : 'Get in Touch'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="https://wa.me/905XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/40 hover:bg-green-500/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-green-500/10 text-green-400 flex-shrink-0">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">
                    WhatsApp
                  </h3>
                  <p className="text-sm text-slate-400">
                    {lang.startsWith('tr') ? 'Hızlı mesaj için' : 'Quick message'}
                  </p>
                </div>
              </a>
              <a
                href={`mailto:${CONTACT_CONFIG.email}`}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    E-posta
                  </h3>
                  <p className="text-sm text-slate-400">{CONTACT_CONFIG.email}</p>
                </div>
              </a>
              <a
                href="https://linkedin.com/company/ecypro"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all group"
              >
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 flex-shrink-0">
                  <Linkedin size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">
                    LinkedIn
                  </h3>
                  <p className="text-sm text-slate-400">
                    {lang.startsWith('tr') ? 'Ağ iletişimi' : 'Professional network'}
                  </p>
                </div>
              </a>
              <Link
                to="/discovery"
                className="flex items-start gap-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/15 transition-all group"
              >
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                    {lang.startsWith('tr') ? 'Discovery Call' : 'Discovery Call'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {lang.startsWith('tr') ? '30 dk. ücretsiz' : '30 min. free'}
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </div>

        {/* atom-6-4: 48h promise + office location */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 mb-16">
          <section data-testid="contact-promise" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-8">
              <div className="text-amber-400 mb-4">
                <Clock size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">
                {lang.startsWith('tr') ? '48 Saat İçinde Yanıt' : 'Response Within 48 Hours'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {lang.startsWith('tr')
                  ? 'Her soruyu dikkatle inceleyip 48 iş saati içinde yanıtlıyoruz. Önce anlıyoruz, sonra konuşuyoruz.'
                  : 'We carefully review every inquiry and respond within 48 business hours. We listen first, then respond.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
              <div className="text-slate-400 mb-4">
                <MapPin size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">
                {lang.startsWith('tr') ? 'Merkez Ofis' : 'Head Office'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">{getAddress()}</p>
            </div>
          </section>
        </div>

        {/* P77.B — Calendly alternative booking path */}
        <div className="container mx-auto px-4 pb-20 max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
              {lang.startsWith('tr')
                ? 'Veya doğrudan takvimden randevu alın'
                : 'Or book directly from the calendar'}
            </h2>
            <p className="text-slate-300">
              {lang.startsWith('tr')
                ? '30 dakika ücretsiz Discovery Call — müsait zaman dilimini siz seçin.'
                : '30-minute free Discovery Call — pick the time slot that works for you.'}
            </p>
          </div>
          <CalendlyEmbed source="contact-page-form-alt" heightPx={720} />
        </div>
      </div>
    </React.Fragment>
  );
};
