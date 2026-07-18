/**
 * P47 — ServiceDetailPage rewrite.
 *
 * Eski sürüm GENERIC_SERVICE_DETAILS (tüm 21 servis için aynı) kullanıyordu;
 * her sayfa identik "Hizmet Hakkında / Kazanımlar / Özel Teklif" içerik
 * sergiliyordu. Yeni sürüm src/data/service-content.ts'den slug-spesifik
 * 16-section detaylı içerik render eder (ServiceDetailLayout component'i).
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SERVICES } from '@/data/services';
import { getServiceContent } from '@/data/service-content';
import { isCanonicalServiceSlug } from '@/data/service-taxonomy';
import { ServiceDetailLayout } from '@/components/services/ServiceDetailLayout';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { useTranslation } from '@/lib/i18n';
import { buildCanonical } from '@/i18n/canonical';

export const ServiceDetailPage: React.FC = () => {
  const { language } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/services" replace />;

  // Registry-first resolution (ADR-services-taxonomy-v2): the canonical slug
  // set lives in service-taxonomy.ts. The old catalog-only lookup hard-404'd
  // every menu pillar page and all adopted content slugs.
  if (!isCanonicalServiceSlug(slug)) return <Navigate to="/404" replace />;

  const detailedContent = getServiceContent(slug);
  const catalogEntry = SERVICES.find((s) => s.link?.endsWith(`/${slug}`));
  const fallbackTitle = detailedContent?.hero.title ?? catalogEntry?.title ?? slug;
  const fallbackDescription = detailedContent?.hero.subtitle ?? catalogEntry?.description ?? '';
  const serviceUrl = buildCanonical(`/services/${slug}`, language);

  // ServiceDetailLayout her halükarda render olur; içerik yoksa hero + fallback CTA döner.
  const content = detailedContent ?? {
    slug,
    hero: {
      title: fallbackTitle,
      subtitle: fallbackDescription,
      valueProp: '',
      primaryCtaText: 'Ücretsiz Strateji Görüşmesi Al',
    },
    problem: { title: '', painPoints: [] },
    outcomes: { title: '', results: [] },
    methodology: { title: '', phases: [] },
    deliverables: { title: '', artifacts: [] },
    timeline: { totalDuration: '', milestones: [] },
    investment: { range: '', model: '', paymentPlan: '' },
    trust: { anonymizedExample: '' },
    faq: { items: [] },
    related: [],
    assessment: { title: '', questions: [], rubric: '' },
  };

  return (
    <>
      <Helmet>
        <title>{`${fallbackTitle} | eCyPro Premium Consulting`}</title>
        <meta name="description" content={fallbackDescription} />
        <link rel="canonical" href={serviceUrl} />
        <meta property="og:title" content={`${fallbackTitle} | eCyPro Premium Consulting`} />
        <meta property="og:description" content={fallbackDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={serviceUrl} />
        <meta property="og:image" content="https://ecypro.com/og-image.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${fallbackTitle} | eCyPro Premium Consulting`} />
        <meta name="twitter:description" content={fallbackDescription} />
      </Helmet>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Anasayfa', url: 'https://ecypro.com/' },
          { name: 'Hizmetler', url: 'https://ecypro.com/services' },
          { name: fallbackTitle, url: serviceUrl },
        ])}
      />
      <ServiceDetailLayout
        content={content}
        fallbackTitle={fallbackTitle}
        fallbackDescription={fallbackDescription}
      />
    </>
  );
};

export default ServiceDetailPage;
