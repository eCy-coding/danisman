import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageWrapper } from '../components/layout/PageWrapper';
import { LazyMount } from '../components/common/LazyMount';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

// Mobile LCP: the 855-line wizard hydrating eagerly kept the main thread busy
// past the LCP <p> in the header. Lazy + intersection-gated mount frees CPU so
// the above-fold header paints at first frame (mirrors /services pattern).
const QuickCheckWizard = React.lazy(() =>
  import('../components/QuickCheckWizard').then((m) => ({ default: m.QuickCheckWizard })),
);

export const QuickCheckPage: React.FC = () => {
  const { language } = useTranslation();
  return (
    <React.Fragment>
      <Helmet>
        <title>KVKK Quick-Check — 5 dakikada şirketinizin compliance skoru | eCyPro</title>
        <meta
          name="description"
          content="10 soruda şirketinizin KVKK + EU regulatory compliance skorunu öğrenin. Risk seviyenize göre kişiselleştirilmiş aksiyon önerisi. KVKK m.5/2-f çerçevesinde işlenir."
        />
        <link rel="canonical" href={buildCanonical('/quick-check', language)} />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <PageWrapper>
        <section className="container mx-auto px-4 py-16 md:py-20 max-w-3xl">
          <header className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-3">
              Ücretsiz Lead Magnet · 5 dakika
            </p>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              KVKK + EU Regulatory Quick-Check
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              10 soruda şirketinizin compliance olgunluğunu ölçün; risk seviyenize göre
              kişiselleştirilmiş aksiyon önerisini ve isterseniz şirketinize özel 1 sayfalık risk
              özetini hemen alın.
            </p>
          </header>

          <LazyMount placeholderHeight={560}>
            <QuickCheckWizard />
          </LazyMount>

          <footer className="mt-10 text-center text-xs text-slate-500">
            Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz · eCyPro Premium Consulting
          </footer>
        </section>
      </PageWrapper>
    </React.Fragment>
  );
};

export default QuickCheckPage;
