/**
 * Perspektif Blog System — Seed Data
 * 20 örnek post (4 domain × 5), 2 series, Founder author, 15 tag
 *
 * Çalıştır: npx tsx prisma/seed-perspektif.ts
 */

import {
  PrismaClient,
  ArticleType,
  CategoryStatus,
  Domain,
  Language,
  PostStatus,
  SeriesStatus,
  TagAxis,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Perspektif seed başlıyor...');

  // ─── Author (Founder) ─────────────────────────────────────────────────────

  const founder = await prisma.author.upsert({
    where: { slug: 'emre-can-yalcin' },
    update: {},
    create: {
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr:
        'eCyPro kurucusu. 15+ yıl M&A, ESG ve aile şirketi danışmanlığı. Ex-Big4, şimdi bağımsız.',
      bioEn:
        'Founder of eCyPro. 15+ years in M&A, ESG and family business advisory. Ex-Big4, now independent.',
      avatarUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/team/emre-can-yalcin.jpg',
      linkedinUrl: 'https://linkedin.com/in/emrecan-yalcin',
      isFounder: true,
    },
  });

  console.log(`✓ Founder author: ${founder.displayName}`);

  // ─── Series ───────────────────────────────────────────────────────────────

  const maSeries = await prisma.series.upsert({
    where: { slug: 'ma-master-class-2026' },
    update: {},
    create: {
      slug: 'ma-master-class-2026',
      titleTr: 'M&A Master Class 2026',
      titleEn: 'M&A Master Class 2026',
      descriptionTr:
        "Türkiye orta piyasa M&A sürecinin uçtan uca rehberi. Due diligence'dan kapanışa 12 bölüm.",
      descriptionEn:
        'End-to-end guide to Turkish mid-market M&A. 12 parts from due diligence to close.',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/series/ma-master-class.jpg',
      totalParts: 12,
      status: SeriesStatus.ACTIVE,
    },
  });

  const esgSeries = await prisma.series.upsert({
    where: { slug: 'turkiye-esg-365-gun' },
    update: {},
    create: {
      slug: 'turkiye-esg-365-gun',
      titleTr: 'Türkiye ESG 365 Gün',
      descriptionTr: 'Her hafta bir ESRS standardı. 52 haftalık Türkiye ESG uyum rehberi.',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/series/esg-365.jpg',
      totalParts: 52,
      status: SeriesStatus.ACTIVE,
    },
  });

  console.log(`✓ Series: ${maSeries.titleTr}, ${esgSeries.titleTr}`);

  // ─── Tags ─────────────────────────────────────────────────────────────────

  const tags = await Promise.all([
    // Format
    prisma.tag.upsert({
      where: { slug: 'format-case-study' },
      update: {},
      create: {
        slug: 'format-case-study',
        labelTr: 'Vaka Analizi',
        labelEn: 'Case Study',
        axis: TagAxis.FORMAT,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'format-framework' },
      update: {},
      create: {
        slug: 'format-framework',
        labelTr: 'Metodoloji',
        labelEn: 'Framework',
        axis: TagAxis.FORMAT,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'format-checklist' },
      update: {},
      create: {
        slug: 'format-checklist',
        labelTr: 'Kontrol Listesi',
        labelEn: 'Checklist',
        axis: TagAxis.FORMAT,
      },
    }),
    // Audience
    prisma.tag.upsert({
      where: { slug: 'audience-founder' },
      update: {},
      create: {
        slug: 'audience-founder',
        labelTr: 'Kurucu',
        labelEn: 'Founder',
        axis: TagAxis.AUDIENCE,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'audience-cfo' },
      update: {},
      create: { slug: 'audience-cfo', labelTr: 'CFO', labelEn: 'CFO', axis: TagAxis.AUDIENCE },
    }),
    // Geo
    prisma.tag.upsert({
      where: { slug: 'geo-turkey' },
      update: {},
      create: { slug: 'geo-turkey', labelTr: 'Türkiye', labelEn: 'Turkey', axis: TagAxis.GEO },
    }),
    prisma.tag.upsert({
      where: { slug: 'geo-eu' },
      update: {},
      create: {
        slug: 'geo-eu',
        labelTr: 'Avrupa Birliği',
        labelEn: 'European Union',
        axis: TagAxis.GEO,
      },
    }),
    // Sector
    prisma.tag.upsert({
      where: { slug: 'sector-tech' },
      update: {},
      create: {
        slug: 'sector-tech',
        labelTr: 'Teknoloji',
        labelEn: 'Technology',
        axis: TagAxis.SECTOR,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'sector-industrial' },
      update: {},
      create: {
        slug: 'sector-industrial',
        labelTr: 'Sanayi',
        labelEn: 'Industrial',
        axis: TagAxis.SECTOR,
      },
    }),
    // Reg
    prisma.tag.upsert({
      where: { slug: 'reg-kvkk' },
      update: {},
      create: { slug: 'reg-kvkk', labelTr: 'KVKK', labelEn: 'KVKK', axis: TagAxis.REG },
    }),
    prisma.tag.upsert({
      where: { slug: 'reg-csrd' },
      update: {},
      create: { slug: 'reg-csrd', labelTr: 'CSRD', labelEn: 'CSRD', axis: TagAxis.REG },
    }),
    prisma.tag.upsert({
      where: { slug: 'reg-spk' },
      update: {},
      create: { slug: 'reg-spk', labelTr: 'SPK', labelEn: 'SPK', axis: TagAxis.REG },
    }),
    // Trend
    prisma.tag.upsert({
      where: { slug: 'trend-ai-disruption' },
      update: {},
      create: {
        slug: 'trend-ai-disruption',
        labelTr: 'Yapay Zeka Dönüşümü',
        labelEn: 'AI Disruption',
        axis: TagAxis.TREND,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'trend-climate-action' },
      update: {},
      create: {
        slug: 'trend-climate-action',
        labelTr: 'İklim Aksiyonu',
        labelEn: 'Climate Action',
        axis: TagAxis.TREND,
      },
    }),
    prisma.tag.upsert({
      where: { slug: 'trend-family-2g-transition' },
      update: {},
      create: {
        slug: 'trend-family-2g-transition',
        labelTr: '2. Nesil Geçişi',
        labelEn: 'Family 2G Transition',
        axis: TagAxis.TREND,
      },
    }),
  ]);

  console.log(`✓ ${tags.length} tag oluşturuldu`);

  const tagMap = Object.fromEntries(tags.map((t) => [t.slug, t]));

  // ─── Blog Posts ──────────────────────────────────────────────────────────

  type PostCreateInput = {
    slug: string;
    type: ArticleType;
    titleTr: string;
    excerptTr: string;
    bodyTrMdx: string;
    primaryDomain: Domain;
    subDomain: string;
    topic?: string;
    coverImageUrl: string;
    coverImageAlt: string;
    language: Language;
    status: PostStatus;
    readingTimeMin: number;
    isFeatured?: boolean;
    seriesId?: string;
    seriesOrder?: number;
    publishedAt?: Date;
    tags?: string[];
  };

  const postDefs: PostCreateInput[] = [
    // M&A × 5
    {
      slug: 'ma-due-diligence-90-gun-checklist',
      type: ArticleType.CHECKLIST,
      titleTr: 'M&A Öncesi 90 Günlük Mali Due Diligence Checklist',
      excerptTr:
        'Türkiye orta piyasa M&A işlemlerinde mali due diligence sürecini yönetmek için 90 günlük adım adım kontrol listesi.',
      bodyTrMdx: `## Giriş\n\nMali due diligence, M&A sürecinin bel kemiğidir. Bu checklist, 90 günlük DD sürecini yönetilebilir atomlara böler.\n\n## Hafta 1-2: Ön Hazırlık\n\n- [ ] NDA imzalanması\n- [ ] VDR (Virtual Data Room) erişim sağlanması\n- [ ] DD ekibi atanması\n\n## Hafta 3-6: Finansal Analiz\n\n- [ ] Son 3 yıl denetlenmiş mali tablolar\n- [ ] Quality of Earnings analizi\n- [ ] Working capital normalization\n\n## Hafta 7-10: Derinleştirme\n\n- [ ] Add-back analizi\n- [ ] Normalised EBITDA hesabı\n- [ ] Debt-like items tespiti\n\n## Sonuç\n\n90 günün sonunda eksiksiz bir DD raporu hazırlanmış olmalıdır.`,
      primaryDomain: Domain.M_A,
      subDomain: 'due-diligence',
      topic: 'mali-due-diligence',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/ma-dd-checklist.jpg',
      coverImageAlt: 'M&A Due Diligence Checklist',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 5,
      isFeatured: true,
      publishedAt: new Date('2026-05-01'),
      tags: ['format-checklist', 'audience-cfo', 'geo-turkey'],
    },
    {
      slug: 'ebitda-quality-of-earnings-analizi',
      type: ArticleType.ANALYSIS,
      titleTr: "EBITDA Quality of Earnings Analizi: Orta Piyasa M&A'da Kritik Adımlar",
      excerptTr:
        'Normalised EBITDA hesabı, add-back tespiti ve working capital analizi — M&A değerleme sürecinin çekirdeği.',
      bodyTrMdx: `## Quality of Earnings Nedir?\n\nQuality of Earnings (QoE), bir şirketin beyan ettiği EBITDA'nın sürdürülebilirliğini ve kalitesini ölçer.\n\n## Add-Back Analizi\n\nKOBİ M&A'da en sık karşılaşılan add-back kalemleri:\n\n1. Kurucu maaşı fazlası\n2. Tek seferlik hukuki masraflar\n3. Akraba işlemleri (related-party transactions)\n\n## Working Capital Normalization\n\n12 aylık ortalama working capital hesabı, sezonsal etkileri ortadan kaldırır.`,
      primaryDomain: Domain.M_A,
      subDomain: 'valuation',
      topic: 'ebitda-analizi',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/ebitda-qoe.jpg',
      coverImageAlt: 'EBITDA Quality of Earnings',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 15,
      publishedAt: new Date('2026-05-05'),
      tags: ['format-framework', 'audience-cfo', 'geo-turkey'],
    },
    {
      slug: 'ma-master-class-part-1-strateji',
      type: ArticleType.FRAMEWORK,
      titleTr: 'M&A Master Class Bölüm 1: Satın Alma Stratejisi',
      excerptTr:
        'Her M&A işleminin temeli: neden alıyoruz, ne alıyoruz, nasıl alıyoruz? Stratejik akılcılığı kurmak.',
      bodyTrMdx: `## Bölüm 1: Stratejik Akılcılık\n\nBir satın alma kararı vermeden önce cevaplanması gereken 3 temel soru:\n\n1. **Neden satın alıyoruz?** — Organik büyüme neden yeterli değil?\n2. **Ne satın alıyoruz?** — Hedef profili ve kriterleri\n3. **Nasıl satın alıyoruz?** — Asset deal vs share deal\n\n## Stratejik Fit Analizi\n\nHedef şirketin stratejik uyumunu test etmek için 5-boyutlu framework.`,
      primaryDomain: Domain.M_A,
      subDomain: 'ma-101',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/ma-strategy.jpg',
      coverImageAlt: 'M&A Satın Alma Stratejisi',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 12,
      seriesId: maSeries.id,
      seriesOrder: 1,
      publishedAt: new Date('2026-04-15'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey'],
    },
    {
      slug: 'cross-border-ma-turkey-eu-kilavuz',
      type: ArticleType.ANALYSIS,
      titleTr: 'Türkiye-AB Sınır Ötesi M&A: Hukuki ve Vergi Kılavuzu 2026',
      excerptTr:
        'EUDR, CBAM ve yeni AB düzenlemeleri çerçevesinde Türkiye-AB sınır ötesi M&A işlemlerinin navigasyonu.',
      bodyTrMdx: `## Türkiye-AB M&A Ortamı 2026\n\n2026 itibarıyla Türkiye kaynaklı AB satın alımlarında en kritik düzenleyici faktörler:\n\n- CBAM (Carbon Border Adjustment Mechanism)\n- EUDR (EU Deforestation Regulation)\n- DORA (Digital Operational Resilience Act — fintech)\n\n## Yapı Seçimi\n\nHolding yapısı, vergi optimizasyonu açısından kritiktir.`,
      primaryDomain: Domain.M_A,
      subDomain: 'cross-border',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/turkey-eu-ma.jpg',
      coverImageAlt: 'Türkiye-AB M&A',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 20,
      publishedAt: new Date('2026-05-10'),
      tags: ['format-framework', 'audience-founder', 'geo-eu', 'geo-turkey', 'reg-csrd'],
    },
    {
      slug: 'distressed-ma-ozel-durumlar',
      type: ArticleType.CASE_STUDY,
      titleTr: "Distressed M&A: Türkiye'de Özel Durum Satın Alımları",
      excerptTr:
        'Konkordato sürecindeki bir Türk sanayi şirketinin anonim vaka analizi — distressed acquisition süreci.',
      bodyTrMdx: `## Vaka: Sanayi Şirketi Konkordato\n\n*Anonim müşteri vakası, hassas bilgiler değiştirilmiştir.*\n\n### Durum\nMüşterimiz, konkordato sürecindeki bir orta büyüklükte sanayi şirketi için alıcı vekili görevini üstlendi.\n\n### Süreç\n1. Acil DD (30 gün compressed)\n2. Konkordato mahkemesi ile koordinasyon\n3. Tasfiye değeri vs going concern analizi\n\n### Sonuç\nÜretim tesisi + marka ayrıştırılarak iki ayrı alıcıya satıldı.`,
      primaryDomain: Domain.M_A,
      subDomain: 'distressed-special-situations',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/distressed-ma.jpg',
      coverImageAlt: 'Distressed M&A',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 18,
      publishedAt: new Date('2026-05-15'),
      tags: ['format-case-study', 'audience-founder', 'geo-turkey', 'sector-industrial'],
    },

    // ESG × 5
    {
      slug: 'esrs-e1-karbon-muhasebesi-rehber',
      type: ArticleType.TUTORIAL,
      titleTr: 'ESRS E1: Kapsam 1/2/3 Karbon Muhasebesi Adım Adım Rehberi',
      excerptTr:
        'CSRD kapsamındaki Türk şirketler için Kapsam 1, 2 ve 3 emisyon hesaplama metodolojisi.',
      bodyTrMdx: `## ESRS E1 Nedir?\n\nESRS E1, CSRD raporlamasında iklim değişikliği boyutunu kapsar. Türkiye'de 2027'den itibaren büyük şirketler için zorunlu.\n\n## Kapsam 1: Doğrudan Emisyonlar\n\nFabrikadan çıkan emisyonlar, şirket araçları vb.\n\n## Kapsam 2: Satın Alınan Enerji\n\nElektrik, ısıtma, soğutma satın alımından kaynaklanan emisyonlar.\n\n## Kapsam 3: Değer Zinciri\n\nEn karmaşık kısım: tedarik zinciri, müşteri kullanımı, EOL.`,
      primaryDomain: Domain.ESG,
      subDomain: 'carbon-accounting',
      topic: 'esrs-e1',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/esrs-e1.jpg',
      coverImageAlt: 'ESRS E1 Karbon Muhasebesi',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 22,
      isFeatured: true,
      publishedAt: new Date('2026-05-08'),
      tags: ['format-framework', 'audience-cfo', 'geo-turkey', 'reg-csrd', 'trend-climate-action'],
    },
    {
      slug: 'double-materiality-assessment-nasil-yapilir',
      type: ArticleType.FRAMEWORK,
      titleTr: 'Çift Önemlilik Değerlendirmesi: Türk Şirketi Nasıl Yapmalı?',
      excerptTr:
        "ESRS çift önemlilik matrisinin Türk aile şirketleri ve KOBİ'leri için pratik uygulama rehberi.",
      bodyTrMdx: `## Çift Önemlilik (Double Materiality) Nedir?\n\nCSRD, şirketlerden iki perspektiften önemlilik değerlendirmesi yapmasını gerektirir:\n\n1. **İçeriden dışarıya**: Şirket faaliyetleri dünyayı nasıl etkiliyor?\n2. **Dışarıdan içeriye**: ESG faktörleri şirketi nasıl etkiliyor?\n\n## Türk Şirketi İçin 5 Adım`,
      primaryDomain: Domain.ESG,
      subDomain: 'double-materiality',
      coverImageUrl:
        'https://res.cloudinary.com/ecypro/image/upload/v1/blog/double-materiality.jpg',
      coverImageAlt: 'Double Materiality Assessment',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 14,
      publishedAt: new Date('2026-04-20'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey', 'reg-csrd'],
    },
    {
      slug: 'esg-turkiye-365-gun-hafta-1-e1',
      type: ArticleType.NEWSLETTER_RECAP,
      titleTr: 'ESG 365: Hafta 1 — ESRS E1 Özet',
      excerptTr:
        '52 haftalık ESG yolculuğunun ilk durağı: ESRS E1 iklim değişikliği standardının özeti.',
      bodyTrMdx: `## Hafta 1: ESRS E1 Özet\n\nBu hafta ESRS E1\'i inceledik. Temel çıkarımlar:\n\n- Türkiye'de 2027 zorunluluk takvimi\n- Kapsam 3 en karmaşık kısım\n- İlk yıl transition relief mevcut`,
      primaryDomain: Domain.ESG,
      subDomain: 'esrs-roadmap',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/esg-365-w1.jpg',
      coverImageAlt: 'ESG 365 Hafta 1',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 5,
      seriesId: esgSeries.id,
      seriesOrder: 1,
      publishedAt: new Date('2026-05-05'),
      tags: [
        'format-case-study',
        'audience-founder',
        'geo-turkey',
        'reg-csrd',
        'trend-climate-action',
      ],
    },
    {
      slug: 'yesil-tahvil-türkiye-rehberi',
      type: ArticleType.ANALYSIS,
      titleTr: "Türkiye'de Yeşil Tahvil: Sürdürülebilir Finansmana Giriş",
      excerptTr:
        'Borsa İstanbul yeşil tahvil çerçevesi, SPK düzenlemeleri ve yeşil tahvil ihracı için adım adım süreç.',
      bodyTrMdx: `## Yeşil Tahvil Nedir?\n\nYeşil tahvil (green bond), geliri çevresel projelere tahsis edilen borçlanma aracıdır.\n\n## Türkiye'deki Durum\n\nSPK'nın 2021 düzenlemeleriyle Türkiye yeşil tahvil piyasası büyümeye başladı.`,
      primaryDomain: Domain.ESG,
      subDomain: 'sustainable-finance',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/green-bond.jpg',
      coverImageAlt: 'Yeşil Tahvil Türkiye',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 12,
      publishedAt: new Date('2026-04-28'),
      tags: ['format-analysis', 'audience-cfo', 'geo-turkey', 'reg-spk', 'trend-climate-action'],
    },
    {
      slug: 'tcfd-raporlama-turkiye',
      type: ArticleType.FRAMEWORK,
      titleTr: 'TCFD Raporlaması: Türk Şirketleri İçin Pratik Rehber',
      excerptTr:
        'Task Force on Climate-related Financial Disclosures önerilerinin Türkiye bağlamında uygulaması.',
      bodyTrMdx: `## TCFD Yapısı\n\nTCFD 4 ana pilara dayanır:\n\n1. **Yönetişim**: İklim riskinin yönetim kurulunda yer alması\n2. **Strateji**: İklim senaryolarının iş stratejisine entegrasyonu\n3. **Risk Yönetimi**: İklim riskinin tanımlanması ve azaltılması\n4. **Metrik ve Hedefler**: KPI'lar ve net sıfır yol haritası`,
      primaryDomain: Domain.ESG,
      subDomain: 'tcfd-reporting',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/tcfd.jpg',
      coverImageAlt: 'TCFD Raporlama',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 16,
      publishedAt: new Date('2026-05-12'),
      tags: ['format-framework', 'audience-cfo', 'geo-turkey', 'reg-csrd'],
    },

    // Fintech × 5
    {
      slug: 'spk-casp-lisansi-basvuru-rehberi',
      type: ArticleType.TUTORIAL,
      titleTr: 'SPK CASP Lisansı Başvuru Rehberi 2026',
      excerptTr:
        'Kripto varlık hizmet sağlayıcısı lisansı almak isteyenler için adım adım SPK başvuru süreci.',
      bodyTrMdx: `## CASP Lisansı Nedir?\n\nCASP (Crypto Asset Service Provider), SPK'nın kripto varlık borsaları ve saklama şirketleri için düzenlediği lisans türüdür.\n\n## Başvuru Gereksinimleri\n\n- Minimum 50M TL ödenmiş sermaye\n- Teknik altyapı gereksinimleri\n- AML/KYC program belgesi`,
      primaryDomain: Domain.FINTECH,
      subDomain: 'spk-compliance',
      topic: 'casp-lisansi',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/spk-casp.jpg',
      coverImageAlt: 'SPK CASP Lisansı',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 18,
      isFeatured: true,
      publishedAt: new Date('2026-05-03'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey', 'reg-spk', 'sector-tech'],
    },
    {
      slug: 'masak-aml-uyum-programi',
      type: ArticleType.CHECKLIST,
      titleTr: 'MASAK AML Uyum Programı: 2026 Zorunlulukları',
      excerptTr:
        "MASAK'ın 2026 güncellemeleriyle fintech şirketleri için AML uyum programının zorunlu bileşenleri.",
      bodyTrMdx: `## AML Uyum Programı Bileşenleri\n\n- [ ] Risk iştahı politikası\n- [ ] Müşteri tanıma prosedürü (KYC)\n- [ ] İşlem izleme sistemi\n- [ ] SAR (Şüpheli İşlem Raporu) süreci\n- [ ] Yaptırım tarama (sanctions screening)\n- [ ] Travel Rule uyumu`,
      primaryDomain: Domain.FINTECH,
      subDomain: 'masak',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/masak-aml.jpg',
      coverImageAlt: 'MASAK AML Uyum',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 8,
      publishedAt: new Date('2026-05-06'),
      tags: ['format-checklist', 'audience-founder', 'geo-turkey', 'sector-tech'],
    },
    {
      slug: 'kvkk-fintech-veri-yerlesim',
      type: ArticleType.ANALYSIS,
      titleTr: "Fintech'te KVKK Veri Yerleşimi: Yurt Dışı Aktarım Rehberi",
      excerptTr:
        "KVKK'nın yurt dışı veri aktarım kuralları ve fintech şirketleri için pratik uyum stratejisi.",
      bodyTrMdx: `## KVKK Yurt Dışı Aktarım\n\nTürkiye'de kişisel verilerin yurt dışına aktarımı KVKK'nın 9. maddesi kapsamında kısıtlıdır.\n\n## Uyum Yolları\n\n1. Açık rıza (her kullanıcıdan ayrı)\n2. Yeterlilik kararı (sadece yetkili ülkeler)\n3. Standart sözleşme (SCCs benzeri)\n4. BCR (henüz Türkiye'de geliştirilmekte)`,
      primaryDomain: Domain.FINTECH,
      subDomain: 'kvkk',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/kvkk-fintech.jpg',
      coverImageAlt: 'KVKK Fintech Veri Yerleşimi',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 14,
      publishedAt: new Date('2026-04-25'),
      tags: [
        'format-framework',
        'audience-founder',
        'geo-turkey',
        'reg-kvkk',
        'sector-tech',
        'trend-ai-disruption',
      ],
    },
    {
      slug: 'embedded-finance-api-banking-turkiye',
      type: ArticleType.ANALYSIS,
      titleTr: "Embedded Finance ve API Banking: Türkiye'deki Düzenleyici Ortam",
      excerptTr:
        "TCMB'nin açık bankacılık düzenlemeleri ve embedded finance modellerinin Türkiye'de nasıl çalışacağı.",
      bodyTrMdx: `## Embedded Finance Nedir?\n\nEmbedded finance, finansal hizmetlerin finans dışı platformlara entegrasyonudur.\n\n## TCMB Açık Bankacılık Çerçevesi\n\nTürkiye, 2020'de yayımlanan Ödeme Hizmetleri Yönetmeliği ile API bankacılığının zeminini hazırladı.`,
      primaryDomain: Domain.FINTECH,
      subDomain: 'embedded-finance',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/embedded-finance.jpg',
      coverImageAlt: 'Embedded Finance Türkiye',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 16,
      publishedAt: new Date('2026-05-14'),
      tags: ['format-analysis', 'audience-founder', 'geo-turkey', 'sector-tech'],
    },
    {
      slug: 'crypto-web3-turkiye-duzenleyici-cerceve',
      type: ArticleType.REGULATORY_ALERT,
      titleTr: 'Kripto ve Web3: Türkiye Düzenleyici Çerçeve Güncellemesi 2026',
      excerptTr:
        '2025-2026 SPK kripto düzenlemelerinin özeti ve bunların stablecoin, tokenizasyon ve DeFi projelerine etkisi.',
      bodyTrMdx: `## Durum: Mayıs 2026\n\nSPK'nın kripto düzenlemeleri hızla gelişiyor. Bu mevzuat alarmı temel değişiklikleri özetler:\n\n## Stablecoin Düzenlemesi\n\nTCMB, TL-sabitli stablecoin'ler için lisanslama gereksinimi yayımladı.\n\n## NFT ve Tokenizasyon\n\nSPK, tokenize menkul kıymetler için taslak tebliği yayımladı.`,
      primaryDomain: Domain.FINTECH,
      subDomain: 'crypto-web3',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/crypto-reg.jpg',
      coverImageAlt: 'Kripto Türkiye Düzenleme',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 7,
      publishedAt: new Date('2026-05-20'),
      tags: [
        'format-checklist',
        'audience-founder',
        'geo-turkey',
        'reg-spk',
        'sector-tech',
        'trend-ai-disruption',
      ],
    },

    // Aile Şirketi × 5
    {
      slug: 'aile-sirketi-nesil-devri-stratejisi',
      type: ArticleType.FRAMEWORK,
      titleTr: "Aile Şirketinde Nesil Devri: 1G'den 2G'ye Geçiş Stratejisi",
      excerptTr:
        "Türkiye'nin en büyük aile şirketi riskinin — yönetim boşluğunun — önüne nasıl geçilir?",
      bodyTrMdx: `## Neden Kritik?\n\nTürkiye'deki aile şirketlerinin %70'i 2. nesle geçişte ciddi performans kaybı yaşıyor.\n\n## 5 Aşamalı Devir Modeli\n\n1. **Hazırlık** (5 yıl önce): 2G adaylarını tanımlama\n2. **Geliştirme** (3 yıl): Dış deneyim + mentorluk\n3. **Ortaklık** (2 yıl): 1G + 2G paralel liderlik\n4. **Devir** (6 ay): Kademeli yetki transferi\n5. **Stabilizasyon** (1 yıl): 1G danışman konumuna geçişi`,
      primaryDomain: Domain.AILE_SIRKETI,
      subDomain: 'succession-planning',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/succession.jpg',
      coverImageAlt: 'Aile Şirketi Nesil Devri',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 20,
      isFeatured: true,
      publishedAt: new Date('2026-04-10'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey', 'trend-family-2g-transition'],
    },
    {
      slug: 'aile-anayasasi-hazirlama-rehberi',
      type: ArticleType.TUTORIAL,
      titleTr: 'Aile Anayasası Hazırlama: Adım Adım Rehber',
      excerptTr:
        'Türk aile şirketleri için aile anayasası (family constitution) hazırlama süreci ve temel bileşenler.',
      bodyTrMdx: `## Aile Anayasası Nedir?\n\nAile anayasası, aile şirketinin yönetişim ilkelerini ve aile-şirket ilişkisini düzenleyen belgedir.\n\n## Temel Bileşenler\n\n1. Aile değerleri ve vizyon\n2. Aile konseyi yapısı\n3. İstihdam politikası (aile üyeleri için)\n4. Temettü politikası\n5. Çıkış mekanizmaları`,
      primaryDomain: Domain.AILE_SIRKETI,
      subDomain: 'family-constitution',
      coverImageUrl:
        'https://res.cloudinary.com/ecypro/image/upload/v1/blog/family-constitution.jpg',
      coverImageAlt: 'Aile Anayasası',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 15,
      publishedAt: new Date('2026-04-22'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey', 'trend-family-2g-transition'],
    },
    {
      slug: 'aile-sirketi-ceo-profesyonellesme',
      type: ArticleType.CASE_STUDY,
      titleTr: 'Aile Şirketinde CEO Profesyonelleşmesi: Anonim Vaka',
      excerptTr:
        'Bir Türk aile şirketinin dışarıdan CEO atama sürecinin anonim vakası — başarılar ve tuzaklar.',
      bodyTrMdx: `## Vaka: Sektör Lideri Tekstil Şirketi\n\n*İsimler gizlenmiştir.*\n\n### Bağlam\n800M TL cirolu tekstil şirketi, 2. nesil devir yerine profesyonel CEO arıyor.\n\n### Süreç\n18 aylık arama ve entegrasyon sürecinin detayları.`,
      primaryDomain: Domain.AILE_SIRKETI,
      subDomain: 'professionalization',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/family-ceo.jpg',
      coverImageAlt: 'CEO Profesyonelleşme',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 18,
      publishedAt: new Date('2026-05-02'),
      tags: [
        'format-case-study',
        'audience-founder',
        'geo-turkey',
        'trend-family-2g-transition',
        'sector-industrial',
      ],
    },
    {
      slug: 'aile-ofisi-kurulum-rehberi',
      type: ArticleType.FRAMEWORK,
      titleTr: 'Aile Ofisi Kurulumu: Türk Aile Şirketi için Pratik Rehber',
      excerptTr:
        "Single family office (SFO) vs multi-family office (MFO) seçimi ve Türkiye'de aile ofisi kurulumunun adımları.",
      bodyTrMdx: `## Aile Ofisi Nedir?\n\nAile ofisi, servetini yönetmek için yeterince büyük aile için (genellikle 50M USD+) kurulan özel servet yönetim kurumudur.\n\n## SFO vs MFO\n\n| Kriter | SFO | MFO |\n|---|---|---|\n| Minimum servet | 50M USD | 5M USD |\n| Kontrol | Tam | Sınırlı |\n| Maliyet | Yüksek | Düşük |`,
      primaryDomain: Domain.AILE_SIRKETI,
      subDomain: 'family-office-setup',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/family-office.jpg',
      coverImageAlt: 'Aile Ofisi Kurulum',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 14,
      publishedAt: new Date('2026-05-18'),
      tags: ['format-framework', 'audience-founder', 'geo-turkey', 'trend-family-2g-transition'],
    },
    {
      slug: 'miras-planlama-vakif-turkiye',
      type: ArticleType.ANALYSIS,
      titleTr: "Miras Planlaması ve Vakıf: Türkiye'de Servet Transferi",
      excerptTr:
        'Türk medeni hukuku çerçevesinde vakıf kurumu ve miras planlamasında varlık koruma stratejileri.',
      bodyTrMdx: `## Türk Hukukunda Miras\n\nTürk Medeni Kanunu zorunlu miras payları (mahfuz hisse) öngörür.\n\n## Vakıf Yoluyla Miras Planlaması\n\nVakıf kurumu, doğrudan miras yerine uzun vadeli varlık koruma sağlar.`,
      primaryDomain: Domain.AILE_SIRKETI,
      subDomain: 'estate-planning',
      coverImageUrl: 'https://res.cloudinary.com/ecypro/image/upload/v1/blog/estate-planning.jpg',
      coverImageAlt: 'Miras Planlaması Vakıf',
      language: Language.TR_ONLY,
      status: PostStatus.PUBLISHED,
      readingTimeMin: 16,
      publishedAt: new Date('2026-04-30'),
      tags: ['format-analysis', 'audience-founder', 'geo-turkey', 'trend-family-2g-transition'],
    },
  ];

  let created = 0;
  for (const def of postDefs) {
    const { tags: tagSlugs, seriesId: _sid, ...rest } = def;
    await prisma.blogPost.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        ...rest,
        seriesId: _sid,
        author: { connect: { id: founder.id } },
        tags: tagSlugs
          ? { connect: tagSlugs.filter((s) => tagMap[s]).map((s) => ({ id: tagMap[s].id })) }
          : undefined,
      },
    });
    created++;
  }

  console.log(`✓ ${created} blog post oluşturuldu`);

  // ─── InsightCategory (dynamic editorial categories) ───────────────────────
  const INSIGHT_CATEGORIES = [
    {
      slug: 'bagimsiz-denetim',
      nameTr: 'Bağımsız Denetim',
      nameEn: 'Independent Audit',
      descTr:
        'Denetim kalitesi, bağımsızlık ilkeleri ve etik uyum konularında derinlemesine analizler.',
      descEn:
        'Deep-dive analyses on audit quality, independence principles and ethical compliance.',
      domain: Domain.M_A,
      iconName: 'shield-check',
      colorAccent: '#2563EB',
      displayOrder: 1,
    },
    {
      slug: 'risk-danismanligi',
      nameTr: 'Risk Danışmanlığı',
      nameEn: 'Risk Advisory',
      descTr: 'Kurumsal risk yönetimi, iç kontrol sistemleri ve risk değerlendirme metodolojileri.',
      descEn:
        'Enterprise risk management, internal control systems and risk assessment methodologies.',
      domain: Domain.M_A,
      iconName: 'alert-triangle',
      colorAccent: '#DC2626',
      displayOrder: 2,
    },
    {
      slug: 'kvkk-veri-koruma',
      nameTr: 'KVKK & Veri Koruma',
      nameEn: 'KVKK & Data Protection',
      descTr:
        'KVKK uyum süreci, kişisel veri işleme, GDPR karşılaştırması ve veri güvenliği rehberleri.',
      descEn:
        'KVKK compliance, personal data processing, GDPR comparison and data security guides.',
      domain: Domain.ESG,
      iconName: 'lock',
      colorAccent: '#7C3AED',
      displayOrder: 3,
    },
    {
      slug: 'ic-kontrol',
      nameTr: 'İç Kontrol',
      nameEn: 'Internal Control',
      descTr:
        'İç kontrol çerçeveleri, denetim komitesi etkinliği ve kurumsal yönetim standartları.',
      descEn:
        'Internal control frameworks, audit committee effectiveness and corporate governance standards.',
      domain: Domain.M_A,
      iconName: 'check-circle',
      colorAccent: '#059669',
      displayOrder: 4,
    },
    {
      slug: 'vergi-mevzuat',
      nameTr: 'Vergi & Mevzuat',
      nameEn: 'Tax & Regulation',
      descTr:
        'Türk vergi mevzuatı, transfer fiyatlandırması, vergi planlaması ve düzenleyici uyum analizi.',
      descEn: 'Turkish tax law, transfer pricing, tax planning and regulatory compliance analysis.',
      domain: Domain.M_A,
      iconName: 'file-text',
      colorAccent: '#D97706',
      displayOrder: 5,
    },
    {
      slug: 'surdurulebilirlik-esg',
      nameTr: 'Sürdürülebilirlik (ESG)',
      nameEn: 'Sustainability (ESG)',
      descTr:
        'ESG entegrasyonu, iklim riski yönetimi, sürdürülebilirlik raporlaması ve etki ölçümü.',
      descEn:
        'ESG integration, climate risk management, sustainability reporting and impact measurement.',
      domain: Domain.ESG,
      iconName: 'leaf',
      colorAccent: '#16A34A',
      displayOrder: 6,
    },
  ];

  let catCreated = 0;
  for (const cat of INSIGHT_CATEGORIES) {
    await prisma.insightCategory.upsert({
      where: { slug: cat.slug },
      update: {
        nameTr: cat.nameTr,
        nameEn: cat.nameEn,
        descTr: cat.descTr,
        descEn: cat.descEn,
        iconName: cat.iconName,
        colorAccent: cat.colorAccent,
        displayOrder: cat.displayOrder,
      },
      create: {
        ...cat,
        status: CategoryStatus.ACTIVE,
      },
    });
    catCreated++;
  }

  console.log(`✓ ${catCreated} InsightCategory oluşturuldu`);

  console.log('\n🎉 Perspektif seed tamamlandı!');
  console.log(`   Authors: 1 (Founder)`);
  console.log(`   Series: 2`);
  console.log(`   Tags: ${tags.length}`);
  console.log(`   Posts: ${created}`);
  console.log(`   InsightCategories: ${catCreated}`);
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
