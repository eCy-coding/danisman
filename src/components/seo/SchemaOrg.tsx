import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../lib/i18n';


export const SchemaOrg: React.FC = () => {
    const { language } = useTranslation();

    const baseUrl = 'https://ecypro.com';
    const logoUrl = `${baseUrl}/pwa-512x512.png`;

    // 1. ProfessionalService Schema (The Core Identity)
    const professionalServiceSchema = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: 'EcyPro Premium Consulting',
        image: logoUrl,
        '@id': baseUrl,
        url: baseUrl,
        telephone: '+90-555-123-4567',
        priceRange: '$$$',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Maslak Mah. Buyukdere Cad. No:123/A',
            addressLocality: 'Istanbul',
            addressRegion: 'Sariyer',
            postalCode: '34398',
            addressCountry: 'TR',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 41.1128,
            longitude: 29.0223,
        },
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
            ],
            opens: '09:00',
            closes: '18:00',
        },
        sameAs: [
            'https://linkedin.com/company/ecypro',
            'https://twitter.com/ecypro',
            'https://instagram.com/ecypro',
        ],
    };

    // 2. Service Schema (Defining What We Sell)
    const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        serviceType: 'Management Consulting',
        provider: {
            '@type': 'ProfessionalService',
            name: 'EcyPro Premium Consulting',
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
                name: language === 'tr' ? 'Danışmanlık ücretleriniz nedir?' : 'What are your consulting fees?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: language === 'tr' 
                        ? 'Proje kapsamına ve süresine göre değişmektedir. Detaylı bilgi için iletişime geçiniz.' 
                        : 'Fees vary based on project scope and duration. Please contact us for details.',
                },
            },
             {
                '@type': 'Question',
                name: language === 'tr' ? 'Hangi sektörlere hizmet veriyorsunuz?' : 'Which industries do you serve?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: language === 'tr' 
                        ? 'Finans, Enerji, Teknoloji ve Perakende sektörleri başta olmak üzere geniş bir yelpazede hizmet sunuyoruz.' 
                        : 'We serve a wide range of sectors, primarily Finance, Energy, Technology, and Retail.',
                },
            }
        ],
    };

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(professionalServiceSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        </Helmet>
    );
};
