import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PricingCalculatorWizard } from '../components/PricingCalculatorWizard';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

export const PricingCalculatorPage: React.FC = () => {
  const { language } = useTranslation();
  return (
    <React.Fragment>
      <Helmet>
        <title>Pricing Calculator — Hangi paket size uygun? | eCyPro</title>
        <meta
          name="description"
          content="4 soruda eCyPro premium consulting paketinden hangisinin şirketinize uygun olduğunu öğrenin. Quick-Check Pro’dan Annual Partnership’e 8 paket önerisi."
        />
        <link rel="canonical" href={buildCanonical('/pricing-calculator', language)} />
        <meta name="robots" content="index,follow" />
      </Helmet>
      <PageWrapper>
        <section className="container mx-auto px-4 py-16 md:py-20 max-w-3xl">
          <header className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-3">
              Ücretsiz Araç · 2 dakika
            </p>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              Hangi paket size uygun?
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              4 soruda sektörünüze, ölçeğinize ve aciliyetinize göre eCyPro paket önerisini ve fiyat
              aralığını öğrenin. Hesaplama tarayıcınızda çalışır; iletişim bilgilerinizi paylaşana
              kadar veri gönderilmez.
            </p>
          </header>

          <PricingCalculatorWizard />

          <footer className="mt-10 text-center text-xs text-slate-500">
            Verilerinizi KVKK m.5/2-f çerçevesinde işliyoruz · eCyPro Premium Consulting
          </footer>
        </section>
      </PageWrapper>
    </React.Fragment>
  );
};

export default PricingCalculatorPage;
