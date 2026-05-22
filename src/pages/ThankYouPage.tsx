/**
 * Track B — /thank-you confirmation page.
 *
 * Reached after form submit or Calendly booking redirect. Confirms receipt
 * + offers two next steps (read a case study, book a 1:1 directly) and a
 * secondary Founder Letter signup so warm leads don't drop off the funnel.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { NewsletterSection } from '../components/sections/NewsletterSection';
import { useTranslation } from '@/lib/i18n';
import { BRAND_NAME } from '@/constants/brand';
import { trackEvent } from '../lib/analytics';
import { getCalendlyCta, hasExternalCalendly } from '../lib/cta/calendly';

export const ThankYouPage: React.FC = () => {
  const { language } = useTranslation();
  const isTr = (language || 'en').startsWith('tr');

  React.useEffect(() => {
    trackEvent('Conversion', 'PageView', 'thank-you');
  }, []);

  const calendly = getCalendlyCta('thank-you-secondary');

  return (
    <React.Fragment>
      <Helmet>
        <title>
          {isTr
            ? `Teşekkürler — Talebiniz Alındı | ${BRAND_NAME}`
            : `Thanks — We Received Your Request | ${BRAND_NAME}`}
        </title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href="https://www.ecypro.com/thank-you" />
      </Helmet>
      <PageWrapper>
        <section className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
            {isTr ? 'Talebiniz bize ulaştı' : 'We received your request'}
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            {isTr
              ? 'Bir iş günü içinde size dönüş yapacağız. Bu arada aşağıdaki iki adım sonraki konuşmamızı çok daha verimli kılacak.'
              : "We'll get back to you within one business day. Meanwhile, the two steps below will make our next conversation noticeably sharper."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16 text-left">
            <Link
              to="/case-studies"
              data-cta="case-studies"
              data-track="cta-click"
              data-cta-source="thank-you"
              onClick={() => trackEvent('ThankYou', 'NextStep', 'case-studies')}
              className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-6"
            >
              <BookOpen className="w-6 h-6 text-secondary mb-3" aria-hidden="true" />
              <h2 className="text-white font-semibold mb-1">
                {isTr ? 'Vaka çalışmalarını oku' : 'Read our case studies'}
              </h2>
              <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                {isTr
                  ? 'Benzer büyüklükteki şirketlerle çalışırken aldığımız kararları görün.'
                  : 'See how we navigated similar-sized organizations through transformation.'}
              </p>
              <span className="inline-flex items-center gap-1 text-secondary text-sm group-hover:translate-x-1 transition-transform">
                {isTr ? 'İncele' : 'Browse'} <ArrowRight size={14} />
              </span>
            </Link>

            {hasExternalCalendly() ? (
              <a
                href={calendly.href}
                target={calendly.target}
                rel={calendly.rel}
                {...calendly.dataAttrs}
                onClick={() => trackEvent('ThankYou', 'NextStep', 'calendly-direct')}
                className="group block rounded-2xl border border-secondary/30 bg-secondary/10 hover:bg-secondary/15 transition-colors p-6"
              >
                <Calendar className="w-6 h-6 text-secondary mb-3" aria-hidden="true" />
                <h2 className="text-white font-semibold mb-1">
                  {isTr ? 'Direkt slot seç' : 'Pick a slot right now'}
                </h2>
                <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                  {isTr
                    ? 'Beklemek istemiyorsanız Discovery Call için takvimden uygun zamanı seçin.'
                    : "Don't want to wait? Pick a Discovery Call slot from the calendar."}
                </p>
                <span className="inline-flex items-center gap-1 text-secondary text-sm group-hover:translate-x-1 transition-transform">
                  {isTr ? 'Takvimi aç' : 'Open calendar'} <ArrowRight size={14} />
                </span>
              </a>
            ) : (
              <Link
                to={calendly.href}
                {...calendly.dataAttrs}
                onClick={() => trackEvent('ThankYou', 'NextStep', 'discovery-call-page')}
                className="group block rounded-2xl border border-secondary/30 bg-secondary/10 hover:bg-secondary/15 transition-colors p-6"
              >
                <Calendar className="w-6 h-6 text-secondary mb-3" aria-hidden="true" />
                <h2 className="text-white font-semibold mb-1">
                  {isTr ? 'Direkt slot seç' : 'Pick a slot right now'}
                </h2>
                <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                  {isTr
                    ? 'Beklemek istemiyorsanız Discovery Call için uygun zamanı seçin.'
                    : "Don't want to wait? Pick a Discovery Call slot."}
                </p>
                <span className="inline-flex items-center gap-1 text-secondary text-sm group-hover:translate-x-1 transition-transform">
                  {isTr ? 'Devam et' : 'Continue'} <ArrowRight size={14} />
                </span>
              </Link>
            )}
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Sparkles size={12} className="text-secondary" aria-hidden="true" />
            {isTr ? 'Bültene de katılın' : 'And subscribe to the Founder Letter'}
          </div>
        </section>

        <NewsletterSection />
      </PageWrapper>
    </React.Fragment>
  );
};

export default ThankYouPage;
