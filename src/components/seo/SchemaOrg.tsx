import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../lib/i18n';

export const SchemaOrg: React.FC = () => {
  const { language } = useTranslation();

  const baseUrl = 'https://www.ecypro.com';
  const logoUrl = `${baseUrl}/pwa-512x512.png`;

  // 1. ProfessionalService Schema (The Core Identity)
  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'eCyPro Premium Consulting',
    image: logoUrl,
    '@id': baseUrl,
    url: baseUrl,
    telephone: '+90-541-714-3000',
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Istanbul, Turkey',
      addressLocality: 'Istanbul',
      addressRegion: 'Sariyer',
      postalCode: '34000',
      addressCountry: 'TR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.1128,
      longitude: 29.0223,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    foundingDate: '2026-05-25',
    sameAs: [
      'https://www.linkedin.com/company/ecypro',
      'https://www.linkedin.com/in/emre-can-yalcin',
    ],
    // P39-T05: International Schema.org — Google trust signal for multilingual / multi-country
    areaServed: [
      { '@type': 'Country', name: 'Turkey', identifier: 'TR' },
      { '@type': 'Country', name: 'Germany', identifier: 'DE' },
      { '@type': 'Country', name: 'United Kingdom', identifier: 'GB' },
      { '@type': 'Country', name: 'United States', identifier: 'US' },
    ],
    availableLanguage: [
      { '@type': 'Language', name: 'Turkish', alternateName: 'tr-TR' },
      { '@type': 'Language', name: 'English', alternateName: 'en-US' },
    ],
    currenciesAccepted: 'TRY, USD, EUR',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  };

  // 2. Service Schema (Defining What We Sell)
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Management Consulting',
    provider: {
      '@type': 'ProfessionalService',
      name: 'eCyPro Premium Consulting',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Global',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Consulting Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Strategic Management',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Digital Transformation',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corporate Event Management',
          },
        },
      ],
    },
  };

  // 3. FAQPage Schema (For SERP Dominance)
  // Using static data for now, ideally mapped from FAQ component
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name:
          language === 'tr' ? 'Danışmanlık ücretleriniz nedir?' : 'What are your consulting fees?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            language === 'tr'
              ? 'Proje kapsamına ve süresine göre değişmektedir. Detaylı bilgi için iletişime geçiniz.'
              : 'Fees vary based on project scope and duration. Please contact us for details.',
        },
      },
      {
        '@type': 'Question',
        name:
          language === 'tr'
            ? 'Hangi sektörlere hizmet veriyorsunuz?'
            : 'Which industries do you serve?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            language === 'tr'
              ? 'Finans, Enerji, Teknoloji ve Perakende sektörleri başta olmak üzere geniş bir yelpazede hizmet sunuyoruz.'
              : 'We serve a wide range of sectors, primarily Finance, Energy, Technology, and Retail.',
        },
      },
    ],
  };

  // P12/4 — Person schema for founder / about page (Knowledge Graph signal)
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Emre Can Yalçın',
    jobTitle: language === 'tr' ? 'Kurucu & Baş Danışman' : 'Founder & Principal Consultant',
    url: `${baseUrl}/about`,
    image: `${baseUrl}/founder.jpg`,
    worksFor: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: baseUrl,
    },
    sameAs: [
      'https://www.linkedin.com/in/emre-can-yalcin',
      'https://twitter.com/ecypro',
      'https://github.com/emrecnyn',
    ],
    knowsAbout: [
      'Management Consulting',
      'Digital Transformation',
      'Enterprise Strategy',
      'Operational Excellence',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(professionalServiceSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(personSchema)}</script>
    </Helmet>
  );
};
