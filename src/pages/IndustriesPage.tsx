import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { INDUSTRIES_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';

export const IndustriesPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(INDUSTRIES_COPY.title as MultiLang, lang)} description={getLang(INDUSTRIES_COPY.subtitle as MultiLang, lang)} />
            <JsonLd data={buildBreadcrumbSchema([
                { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
                { name: lang === 'tr' ? 'Sektörler' : 'Industries', url: 'https://ecypro.com/industries' },
            ])} />
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    {getLang(INDUSTRIES_COPY.title as MultiLang, lang)}
                </h1>
                <FadeIn>
                    <p className="text-lg text-slate-400 mb-12">
                        {getLang(INDUSTRIES_COPY.subtitle as MultiLang, lang)}
                    </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {['FinTech', 'HealthTech', 'Energy', 'Retail', 'Public Sector'].map((ind, i) => (
                            <div key={i} className="glass-card p-6 rounded-xl hover:border-white/20 transition-all">
                                <h2 className="font-bold text-lg text-primary mb-2">{ind}</h2>
                                <p className="text-sm text-slate-400">
                                    {lang === 'tr' ? `${ind} alanında küresel uzmanlık ve yenilikçi çözümler.` : `Global expertise and innovative solutions in ${ind}.`}
                                </p>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </div>
    );
};
