import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { CAREERS_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';

export const CareersPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(CAREERS_COPY.title as MultiLang, lang)} description={getLang(CAREERS_COPY.subtitle as MultiLang, lang)} />
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                    <h1 className="text-4xl font-bold text-primary mb-6">
                        {getLang(CAREERS_COPY.title as MultiLang, lang)}
                    </h1>
                    <FadeIn>
                        <p className="text-lg text-slate-400 mb-12">
                            {getLang(CAREERS_COPY.subtitle as MultiLang, lang)}
                        </p>
                        <div className="glass-card p-8 rounded-xl text-center">
                            <h2 className="text-2xl font-bold text-secondary mb-4">{getLang(CAREERS_COPY.openPositions as MultiLang, lang)}</h2>
                            <p className="text-slate-400 mb-8">Currently no open positions looking for super-humans.</p>
                            <button className="px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                                {getLang(CAREERS_COPY.applyNow as MultiLang, lang)}
                            </button>
                        </div>
                    </FadeIn>
                </div>
        </div>
    );
};
