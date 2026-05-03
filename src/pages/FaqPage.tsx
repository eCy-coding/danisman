import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { FAQ_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';

export const FaqPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(FAQ_COPY.title as MultiLang, lang)} description={getLang(FAQ_COPY.subtitle as MultiLang, lang)} />
            <FadeIn>
                <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
                    <h1 className="text-4xl font-bold text-primary mb-6">
                        {getLang(FAQ_COPY.title as MultiLang, lang)}
                    </h1>
                    <p className="text-lg text-slate-400 mb-12">
                        {getLang(FAQ_COPY.subtitle as MultiLang, lang)}
                    </p>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <details key={i} className="group glass-card p-6 rounded-xl cursor-pointer">
                                <summary className="font-bold text-primary flex justify-between items-center list-none">
                                    <span>Question {i}?</span>
                                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="mt-4 text-slate-400">Answer placeholder...</p>
                            </details>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};
