/**
 * P77.B — Dedicated Discovery Call landing page.
 *
 * Full-page Calendly embed for shareable links (LinkedIn posts, email signatures,
 * direct outreach). Provides premium first-impression context before slot picker.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, Video, ShieldCheck } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { CalendlyEmbed } from '../components/booking/CalendlyEmbed';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

export const DiscoveryCallPage: React.FC = () => {
  const { language } = useTranslation();
  const isTr = language?.startsWith('tr');

  return (
    <React.Fragment>
      <Helmet>
        <title>
          {isTr
            ? 'Ücretsiz Strateji Görüşmesi — eCyPro Premium Consulting'
            : 'Free Discovery Call — eCyPro Premium Consulting'}
        </title>
        <meta
          name="description"
          content={
            isTr
              ? '30 dakika ücretsiz keşif görüşmesi. Stratejik dönüşüm, M&A, ESG veya operasyonel mükemmellik konularında ilk değerlendirme.'
              : '30-minute free discovery call. Strategic transformation, M&A, ESG, or operational excellence — initial assessment.'
          }
        />
        <link rel="canonical" href={buildCanonical('/discovery-call', language)} />
        <meta
          property="og:title"
          content="Ücretsiz Strateji Görüşmesi | eCyPro Premium Consulting"
        />
        <meta property="og:url" content={buildCanonical('/discovery-call', language)} />
        <meta property="og:type" content="website" />
      </Helmet>
      <PageWrapper>
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
              {isTr ? 'Ücretsiz Strateji Görüşmesi' : 'Free Discovery Call'}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
              {isTr
                ? '30 dakika, video görüşme, taahhütsüz. Stratejik dönüşüm, M&A, ESG veya operasyonel mükemmellik konularında ilk değerlendirme.'
                : '30 minutes, video meeting, no commitment. Initial assessment on strategic transformation, M&A, ESG, or operational excellence.'}
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-center">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Clock className="w-6 h-6 text-secondary mx-auto mb-2" aria-hidden="true" />
              <p className="text-white text-sm font-semibold">30 dk</p>
              <p className="text-slate-400 text-xs mt-1">{isTr ? 'Süre' : 'Duration'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Video className="w-6 h-6 text-secondary mx-auto mb-2" aria-hidden="true" />
              <p className="text-white text-sm font-semibold">Google Meet</p>
              <p className="text-slate-400 text-xs mt-1">{isTr ? 'Platform' : 'Platform'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Calendar className="w-6 h-6 text-secondary mx-auto mb-2" aria-hidden="true" />
              <p className="text-white text-sm font-semibold">Mon–Fri</p>
              <p className="text-slate-400 text-xs mt-1">09:00 – 18:00 Istanbul</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <ShieldCheck className="w-6 h-6 text-secondary mx-auto mb-2" aria-hidden="true" />
              <p className="text-white text-sm font-semibold">{isTr ? 'Ücretsiz' : 'Free'}</p>
              <p className="text-slate-400 text-xs mt-1">{isTr ? 'Taahhütsüz' : 'No commitment'}</p>
            </div>
          </div>

          <CalendlyEmbed source="discovery-call-page" heightPx={760} />

          <footer className="text-center mt-8">
            <p className="text-slate-400 text-sm">
              {isTr ? 'Uygun zaman bulamıyorsanız ' : 'No suitable time? Email us at '}
              <a
                href="mailto:info@ecypro.com"
                className="text-secondary hover:text-secondary/80 underline"
              >
                info@ecypro.com
              </a>
              {isTr
                ? ' adresine yazın, 24 saat içinde alternatif zaman sunuyoruz.'
                : ' — alternative times within 24 hours.'}
            </p>
          </footer>
        </div>
      </PageWrapper>
    </React.Fragment>
  );
};

export default DiscoveryCallPage;
