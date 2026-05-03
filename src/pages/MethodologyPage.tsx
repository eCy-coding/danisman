import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { METHODOLOGY_COPY } from '../constants';
import { SEO } from '../components/common/SEO';
import { Timeline } from '../components/features/roadmap/Timeline';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';

type MethodologyStep = {
    icon: string;
    title: MultiLang;
    description: MultiLang;
};

export const MethodologyPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO
                title={getLang(METHODOLOGY_COPY.title as MultiLang, lang)}
                description={getLang(METHODOLOGY_COPY.subtitle as MultiLang, lang)}
                canonical="/methodology"
            />
            <JsonLd
                data={buildBreadcrumbSchema([
                    { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://ecypro.com/' },
                    { name: getLang(METHODOLOGY_COPY.title as MultiLang, lang), url: 'https://ecypro.com/methodology' },
                ])}
            />
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                <h1 className="text-4xl font-bold text-primary mb-6">
                    {getLang(METHODOLOGY_COPY.title as MultiLang, lang)}
                </h1>
                <FadeIn>
                    <p className="text-lg text-slate-400 mb-20 md:text-center max-w-3xl mx-auto font-light leading-relaxed">
                        {getLang(METHODOLOGY_COPY.subtitle as MultiLang, lang)}
                    </p>
                    
                    <Timeline steps={METHODOLOGY_COPY.steps as MethodologyStep[]} />
                </FadeIn>
            </div>
        </div>
    );
};
