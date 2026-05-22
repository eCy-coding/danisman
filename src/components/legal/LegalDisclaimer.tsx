/**
 * LegalDisclaimer — Bilgilendirme banner for legal pages.
 *
 * P45 D3: "TASLAK — AVUKAT ONAYINDAN GEÇMEMİŞTİR" loud banner kaldırıldı.
 * Yerine subtle bir bilgilendirme notu + KVKK haklarına direkt link (C2 ile sync).
 * Eski banner premium consulting brand pozisyonuna uygun değildi ve kullanıcıyı
 * yayın hazır olmayan bir belge görüyormuş gibi hissettiriyordu.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export const LegalDisclaimer: React.FC = () => {
  const { language } = useTranslation();
  const lang = language === 'tr' ? 'tr' : 'en';

  return (
    <div role="note" className="border border-white/10 bg-white/3 p-4 mb-8 rounded-lg">
      <div className="flex items-start gap-3">
        <Info size={18} className="text-secondary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-slate-400 leading-relaxed">
          {lang === 'tr' ? (
            <>
              Bu sayfa bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. KVKK ve GDPR
              kapsamında kişisel verilerinize ilişkin hak taleplerinizi{' '}
              <Link
                to="/privacy/data-rights"
                className="text-secondary underline hover:no-underline"
              >
                KVKK / GDPR Veri Hakları Başvurusu
              </Link>{' '}
              sayfasından iletebilirsiniz. Hukuki yorum gerektiren konularda lütfen bir avukata
              danışın.
            </>
          ) : (
            <>
              This page is informational and does not constitute legal advice. To exercise your KVKK
              and GDPR rights regarding personal data, use the{' '}
              <Link
                to="/privacy/data-rights"
                className="text-secondary underline hover:no-underline"
              >
                KVKK / GDPR Data Rights Request
              </Link>{' '}
              page. Consult an attorney for matters requiring legal interpretation.
            </>
          )}
        </div>
      </div>
    </div>
  );
};
