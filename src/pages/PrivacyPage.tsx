import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { LEGAL_COPY } from '../constants';
import { SEO } from '../components/common/SEO';

export const PrivacyPage: React.FC = () => {
    const { language: lang } = useTranslation();
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(LEGAL_COPY.privacyTitle as MultiLang, lang)} />
            <FadeIn>
                <div className="max-w-4xl mx-auto px-6 py-12">
                    <h1 className="text-3xl font-bold text-primary mb-2">{getLang(LEGAL_COPY.privacyTitle as MultiLang, lang)}</h1>
                    <p className="text-sm text-slate-400 mb-8">{getLang(LEGAL_COPY.lastUpdated as MultiLang, lang)}: 01.01.2024</p>
                    <div className="prose max-w-none text-slate-600">
                        <p>Privacy Policy Content Compliance Placeholder...</p>
                        {/* Real legal text would go here as HTML or mapped paragraphs */}
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};
