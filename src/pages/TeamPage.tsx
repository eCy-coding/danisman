import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { TEAM_COPY } from '../constants';
import { SEO } from '../components/common/SEO';

export const TeamPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(TEAM_COPY.title as MultiLang, lang)} description={getLang(TEAM_COPY.subtitle as MultiLang, lang)} />
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                    <h1 className="text-4xl font-bold text-primary mb-6">
                        {getLang(TEAM_COPY.title as MultiLang, lang)}
                    </h1>
                    <FadeIn>
                        <p className="text-lg text-slate-400 mb-12">
                            {getLang(TEAM_COPY.subtitle as MultiLang, lang)}
                        </p>
                        {/* Placeholder for Team Grid - to be populated with real data later if needed */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass-card p-6 rounded-xl h-64 flex items-center justify-center text-slate-400">
                                    Team Member {i} Check
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
        </div>
    );
};
