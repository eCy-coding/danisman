import React from 'react';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { LOCATIONS_COPY } from '../constants';
import { SEO } from '../components/common/SEO';
import { MapPin, Phone } from 'lucide-react';

export const LocationsPage: React.FC = () => {
    const { language: lang } = useTranslation();
    
    return (
        <div className="min-h-screen bg-neutral">
             <SEO title={getLang(LOCATIONS_COPY.title as MultiLang, lang)} description={getLang(LOCATIONS_COPY.subtitle as MultiLang, lang)} />
            <FadeIn>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
                    <h1 className="text-4xl font-bold text-primary mb-6">
                        {getLang(LOCATIONS_COPY.title as MultiLang, lang)}
                    </h1>
                    <p className="text-lg text-slate-400 mb-12">
                        {getLang(LOCATIONS_COPY.subtitle as MultiLang, lang)}
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {LOCATIONS_COPY.offices.map((office, idx) => (
                            <div key={idx} className="glass-card p-8 rounded-xl border-t-4 border-primary">
                                <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-secondary" />
                                    {getLang(office.city as MultiLang, lang)}
                                </h3>
                                <p className="text-slate-400 mb-4 leading-relaxed">{getLang(office.address as MultiLang, lang)}</p>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Phone size={16} />
                                    <span>{office.phone}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};
