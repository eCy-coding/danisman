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
                        {/* P45 D2: "Currently no open positions..." TR/EN mix kaldırıldı; i18n copy üzerinden render. */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                            <h2 className="text-2xl font-serif font-bold text-white mb-4">{getLang(CAREERS_COPY.openPositions as MultiLang, lang)}</h2>
                            <p className="text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                              {lang === 'tr'
                                ? 'Şu anda aktif açık pozisyonumuz yok. Ancak premium consulting pratiğine katkı sağlayabileceğini düşündüğünüz bir alan varsa, CV\'nizi ve kısa bir motivasyon notunuzu careers@ecypro.com adresine gönderebilirsiniz. Tüm başvuruları portföyümüze ekliyor, uygun engagement\'lar açıldığında dönüş yapıyoruz.'
                                : 'We have no active openings right now. If you believe you could contribute to our premium consulting practice, please send your CV and a short motivation note to careers@ecypro.com. We add every application to our portfolio and reach out when matching engagements open.'}
                            </p>
                            <a
                              href="mailto:careers@ecypro.com"
                              className="inline-flex items-center justify-center px-8 py-3 bg-secondary text-neutral rounded-xl font-semibold hover:bg-secondary/90 transition-colors"
                            >
                                {getLang(CAREERS_COPY.applyNow as MultiLang, lang)}
                            </a>
                        </div>
                    </FadeIn>
                </div>
        </div>
    );
};
