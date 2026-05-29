import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { JsonLd } from '../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../lib/structured-data';
import { FadeIn } from '../components/common/FadeIn';
import { useTranslation } from '@/lib/i18n';

const RETENTION_TABLE = [
  {
    category: { tr: 'Danışmanlık proje dosyaları', en: 'Consulting project files' },
    period: { tr: '10 yıl (TTK 82)', en: '10 years (TTK 82)' },
  },
  {
    category: {
      tr: 'Ticari yazışmalar ve sözleşmeler',
      en: 'Commercial correspondence & contracts',
    },
    period: { tr: '10 yıl (TTK 82)', en: '10 years (TTK 82)' },
  },
  {
    category: { tr: 'Müşteri iletişim bilgileri', en: 'Client contact information' },
    period: { tr: 'İş ilişkisi + 2 yıl', en: 'Business relationship + 2 years' },
  },
  {
    category: { tr: 'Fatura ve mali kayıtlar', en: 'Invoices & financial records' },
    period: { tr: '10 yıl (VUK 253)', en: '10 years (VUK 253)' },
  },
  {
    category: { tr: 'Özgeçmiş / Aday başvuruları', en: 'CV / Candidate applications' },
    period: { tr: '2 yıl', en: '2 years' },
  },
  {
    category: {
      tr: 'Web sitesi çerez verileri (analytics)',
      en: 'Website cookie data (analytics)',
    },
    period: { tr: '13 ay', en: '13 months' },
  },
  {
    category: { tr: 'Pazarlama e-posta izinleri', en: 'Marketing email consents' },
    period: { tr: 'Vazgeçmeye kadar, max 3 yıl', en: 'Until opt-out, max 3 years' },
  },
];

export const GuvencePage: React.FC = () => {
  const { language: lang } = useTranslation();

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: lang === 'tr' ? 'eCyPro Güvence & Bağımsızlık' : 'eCyPro Trust & Independence',
    url: 'https://www.ecypro.com/guvence',
    description:
      lang === 'tr'
        ? 'KVKK uyumu, bağımsız denetim taahhüdü ve çıkar çatışması politikası.'
        : 'KVKK compliance, independent audit commitment, and conflict-of-interest policy.',
    publisher: {
      '@type': 'Organization',
      name: 'eCyPro Premium Consulting',
      url: 'https://www.ecypro.com',
    },
  };

  return (
    <div className="min-h-screen bg-neutral">
      <SEO
        title={lang === 'tr' ? 'Güvence & Bağımsızlık | eCyPro' : 'Trust & Independence | eCyPro'}
        description={
          lang === 'tr'
            ? 'KVKK saklama politikamız, bağımsızlık taahhüdümüz ve çıkar çatışması bildirimimiz. Şeffaf, hesap verebilir danışmanlık.'
            : 'Our KVKK data retention policy, independence commitment, and conflict-of-interest declaration. Transparent, accountable consulting.'
        }
        canonical="/guvence"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: lang === 'tr' ? 'Anasayfa' : 'Home', url: 'https://www.ecypro.com/' },
          { name: lang === 'tr' ? 'Güvence' : 'Trust', url: 'https://www.ecypro.com/guvence' },
        ])}
      />
      <JsonLd data={aboutJsonLd} />

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <FadeIn>
          <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-4">
            {lang === 'tr' ? 'Şeffaflık & Güven' : 'Transparency & Trust'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {lang === 'tr' ? 'Güvence & Bağımsızlık' : 'Trust & Independence'}
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-16">
            {lang === 'tr'
              ? 'Danışmanlık değerinin temeli güvendir. Bağımsızlığımızı, veri sorumluluğumuzu ve çıkar çatışması politikamızı tam şeffaflıkla paylaşıyoruz.'
              : 'The foundation of consulting value is trust. We share our independence, data responsibility, and conflict-of-interest policy with full transparency.'}
          </p>
        </FadeIn>

        {/* Bağımsızlık Bildirimi */}
        <FadeIn>
          <section
            className="glass-card p-8 rounded-xl mb-8 border border-secondary/20"
            aria-labelledby="bagimsizlik"
          >
            <div className="flex items-start gap-4 mb-6">
              <span className="text-3xl" aria-hidden="true">
                🛡️
              </span>
              <div>
                <h2 id="bagimsizlik" className="text-xl font-bold text-primary mb-2">
                  {lang === 'tr' ? 'Bağımsızlık Taahhüdü' : 'Independence Commitment'}
                </h2>
                <p className="text-secondary text-sm font-semibold">
                  {lang === 'tr'
                    ? '✓ Bağımsız Danışman Statüsü Doğrulandı'
                    : '✓ Independent Advisor Status Verified'}
                </p>
              </div>
            </div>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <p>
                {lang === 'tr'
                  ? 'eCyPro, herhangi bir yazılım satıcısı, sistem entegratörü veya finansal ürün sağlayıcısından komisyon veya teşvik almaz. Danışmanlık önerilerimiz yalnızca müşterinin çıkarına hizmet eder.'
                  : "eCyPro does not receive commissions or incentives from any software vendor, system integrator, or financial product provider. Our consulting recommendations serve the client's interests exclusively."}
              </p>
              <p>
                {lang === 'tr'
                  ? 'Tüm proje ekibi üyeleri, göreve başlamadan önce olası çıkar çatışmalarını yazılı olarak beyan eder. Çatışma durumunda ilgili uzman projeye atanmaz.'
                  : 'All project team members declare potential conflicts of interest in writing before assignment. In case of conflict, the relevant expert is not assigned to the project.'}
              </p>
            </div>
          </section>
        </FadeIn>

        {/* KVKK Saklama Tablosu */}
        <FadeIn>
          <section className="glass-card p-8 rounded-xl mb-8" aria-labelledby="kvkk-saklama">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-3xl" aria-hidden="true">
                🔒
              </span>
              <div>
                <h2 id="kvkk-saklama" className="text-xl font-bold text-primary mb-2">
                  {lang === 'tr' ? 'KVKK Veri Saklama Politikası' : 'KVKK Data Retention Policy'}
                </h2>
                <p className="text-sm text-slate-400">
                  {lang === 'tr'
                    ? '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında'
                    : 'Under the Personal Data Protection Law No. 6698'}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th
                      scope="col"
                      className="text-left text-xs font-bold text-white uppercase tracking-wide pb-3 pr-6"
                    >
                      {lang === 'tr' ? 'Veri Kategorisi' : 'Data Category'}
                    </th>
                    <th
                      scope="col"
                      className="text-left text-xs font-bold text-white uppercase tracking-wide pb-3"
                    >
                      {lang === 'tr' ? 'Saklama Süresi' : 'Retention Period'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION_TABLE.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="py-3 pr-6 text-slate-300">{row.category[lang]}</td>
                      <td className="py-3 text-secondary font-medium">{row.period[lang]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              {lang === 'tr'
                ? 'Saklama süreleri ilgili mevzuat kapsamında belirlenmekte ve yıllık gözden geçirilmektedir. Veri silme veya düzeltme talebi için:'
                : 'Retention periods are determined by relevant legislation and reviewed annually. For data deletion or correction requests:'}{' '}
              <Link
                to="/privacy/data-rights"
                className="text-secondary underline hover:text-secondary/80 outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              >
                {lang === 'tr' ? 'Veri Haklarım' : 'My Data Rights'}
              </Link>
            </p>
          </section>
        </FadeIn>

        {/* Çıkar Çatışması Bildirimi */}
        <FadeIn>
          <section className="glass-card p-8 rounded-xl mb-8" aria-labelledby="cikar">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-3xl" aria-hidden="true">
                ⚖️
              </span>
              <div>
                <h2 id="cikar" className="text-xl font-bold text-primary mb-2">
                  {lang === 'tr' ? 'Çıkar Çatışması Bildirimi' : 'Conflict of Interest Declaration'}
                </h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
              <p>
                {lang === 'tr'
                  ? 'eCyPro danışmanları aynı anda rakip firmalar için eş zamanlı aktif projeler üstlenemez. Olası rekabetçi durumlar başlamadan önce müşteriyle açıkça görüşülür ve yazılı mutabakat sağlanır.'
                  : 'eCyPro consultants cannot undertake simultaneous active projects for competing firms. Potential competitive situations are openly discussed with the client before commencement and written agreement is secured.'}
              </p>
              <p>
                {lang === 'tr'
                  ? 'Proje tamamlandıktan sonra 12 ay boyunca rakip bir şirket için aynı kapsam türünde proje kabul edilmez. Bu kural karşılıklı güvenin temelidir.'
                  : 'For 12 months after project completion, no project of the same scope type is accepted for a competing company. This rule is the foundation of mutual trust.'}
              </p>
            </div>
          </section>
        </FadeIn>

        {/* KGK Bağlantısı */}
        <FadeIn>
          <section className="glass-card p-8 rounded-xl mb-8" aria-labelledby="kgk">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-3xl" aria-hidden="true">
                🔍
              </span>
              <div>
                <h2 id="kgk" className="text-xl font-bold text-primary mb-2">
                  {lang === 'tr' ? 'KGK Denetçi Sorgulama' : 'KGK Auditor Lookup'}
                </h2>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {lang === 'tr'
                ? "Türkiye'de yetkili bağımsız denetçileri Kamu Gözetimi, Muhasebe ve Denetim Standartları Kurumu (KGK) üzerinden doğrulayabilirsiniz."
                : 'You can verify authorized independent auditors in Turkey through the Public Oversight, Accounting and Auditing Standards Authority (KGK).'}
            </p>
            <a
              href="https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/Bagimsiz%20Denetim/BA%C4%9EIMSIZ%20DENET%C3%87%C4%B0%20ARAMA%20K%C4%B0LAVUZU.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-secondary text-sm font-semibold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
              aria-label={
                lang === 'tr'
                  ? 'KGK resmi sitesinde denetçi ara (yeni sekmede açılır)'
                  : 'Search auditors on KGK official site (opens in new tab)'
              }
            >
              {lang === 'tr' ? 'KGK Resmi Sitesini Ziyaret Et' : 'Visit KGK Official Site'}
              <span aria-hidden="true">↗</span>
            </a>
          </section>
        </FadeIn>

        <FadeIn>
          <div className="text-center mt-16">
            <p className="text-slate-400 mb-6 text-sm">
              {lang === 'tr'
                ? 'Bağımsızlık politikamız veya veri işleme hakkında sorularınız için:'
                : 'For questions about our independence policy or data processing:'}
            </p>
            <Link
              to="/contact"
              className="inline-block border border-secondary text-secondary font-semibold py-3 px-8 rounded-lg hover:bg-secondary/10 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {lang === 'tr' ? 'İletişime Geç' : 'Contact Us'}
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
