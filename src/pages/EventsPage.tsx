import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { EVENTS_COPY } from '@/data/copy/pages';
import { SEO } from '../components/common/SEO';
import { Calendar } from 'lucide-react';

export const EventsPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
            <SEO title={getLang(EVENTS_COPY.title as MultiLang, lang)} description={getLang(EVENTS_COPY.subtitle as MultiLang, lang)} />
            <FadeIn>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                    <h1 className="text-4xl font-bold text-primary mb-6">
                        {getLang(EVENTS_COPY.title as MultiLang, lang)}
                    </h1>
                    <p className="text-lg text-slate-400 mb-12">
                        {getLang(EVENTS_COPY.subtitle as MultiLang, lang)}
                    </p>
                    <div className="flex flex-col items-center justify-center p-12 glass-card rounded-xl min-h-[300px]">
                        <Calendar size={48} className="text-slate-300 mb-4" />
                        <p className="text-slate-400 font-medium">{getLang(EVENTS_COPY.noEvents as MultiLang, lang)}</p>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};
