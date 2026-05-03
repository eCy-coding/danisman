import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { ABOUT_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';

export const AboutPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO
                title={getLang(ABOUT_COPY.title as MultiLang, lang)}
                description={getLang(ABOUT_COPY.missionDesc as MultiLang, lang)}
                canonical="/about"
            />
            <JsonLd
                data={buildBreadcrumbSchema([
                    { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
                    { name: getLang(ABOUT_COPY.title as MultiLang, lang), url: 'https://ecypro.com/about' },
                ])}
            />
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    {getLang(ABOUT_COPY.title as MultiLang, lang)}
                </h1>
                <FadeIn>
                    <div className="grid md:grid-cols-2 gap-12 mt-12">
                        <div>
                            <h2 className="text-2xl font-bold text-secondary mb-4">{getLang(ABOUT_COPY.missionTitle as MultiLang, lang)}</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {getLang(ABOUT_COPY.missionDesc as MultiLang, lang)}
                            </p>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-secondary mb-4">{getLang(ABOUT_COPY.visionTitle as MultiLang, lang)}</h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {getLang(ABOUT_COPY.visionDesc as MultiLang, lang)}
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
};
