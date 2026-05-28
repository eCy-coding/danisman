import type { InsightPost, InsightPostCard } from '@/types/insights';

const SAMPLE_BODY_MDX = `
## Giriş: Neden 90 Gün?

M&A süreçlerinde due diligence, bir şirketin gerçek değerini ortaya çıkaran kritik aşamadır. Türkiye pazarında yapılan araştırmalar, başarısız birleşmelerin %68'inde yetersiz due diligence süreçlerinin belirleyici rol oynadığını göstermektedir.

90 günlük çerçeve; yasal, finansal, operasyonel ve kültürel boyutları dengeli biçimde kapsayan kanıtlanmış bir metodoloji sunar.

<Callout type="pro-tip">
Due diligence sürecine başlamadan önce bir **kapsam belgesi (scope document)** hazırlayın. Bu belge, hangi alanlara ne kadar kaynak ayrılacağını netleştirir ve sonradan ortaya çıkacak sürprizleri minimize eder.
</Callout>

## 1. Hafta 1–2: Ön Değerlendirme ve Kapsam Belirleme

İlk iki hafta sürecin temelini oluşturur. Bu aşamada hedef şirketin temel finansal verileri, yasal statüsü ve operasyonel kapasitesi hakkında ön bir görünüm elde edilir.

### 1.1 Temel Belgeler

- Son 3 yılın denetlenmiş mali tabloları
- Şirket ana sözleşmesi ve yönetim kurulu kararları
- Mevcut sözleşmeler ve uzun vadeli taahhütler
- Personel ve organizasyon şeması

### 1.2 Kırmızı Bayrak Kontrolü

İlk haftada aşağıdaki kritik göstergeler incelenir:

<Callout type="warning">
Vergi borçları, SGK yükümlülükleri ve devam eden davalar en öncelikli kırmızı bayrak kategorileridir. Bu alanlarda şeffaflık eksikliği süreçten çekilme nedeni olabilir.
</Callout>

## 2. Hafta 3–5: Finansal Due Diligence

<PullQuote author="Emre Can Yalçın, Kurucu">
Finansal tablolar geçmişi anlatır; due diligence ise geleceğin risklerini görünür kılar.
</PullQuote>

Finansal due diligence üç temel soruyu yanıtlamalıdır:

1. Bildirilen kârlılık sürdürülebilir mi?
2. Çalışma sermayesi döngüsü sağlıklı mı?
3. Gizli yükümlülükler (contingent liabilities) var mı?

### 2.1 Normalleştirilmiş EBITDA Analizi

Alıcı açısından en kritik adım, EBITDA'yı olağandışı kalemlerden arındırmaktır. Türkiye'de sıkça karşılaşılan normalleştirme kalemleri:

- Sahip maaşlarının piyasa ücretine göre düzenlenmesi
- İlişkili taraf işlemlerinin piyasa koşullarına getirilmesi
- Tek seferlik gider veya gelirlerin elimine edilmesi

<RelatedService slug="finansal-due-diligence" title="Finansal Due Diligence Hizmeti" />

## 3. Hafta 6–8: Hukuki ve Uyum Due Diligence

<Callout type="kvkk">
KVKK uyumu artık her M&A sürecinde zorunlu bir inceleme alanıdır. Veri işleme sözleşmeleri, açık rıza mekanizmaları ve olası veri ihlali geçmişi titizlikle değerlendirilmelidir.
</Callout>

### 3.1 Kurumsal Yapı Analizi

- Ortaklık yapısı ve hissedar hakları
- Yönetim kurulu kompozisyonu ve bağımsızlık durumu
- Şirket içi finansman ilişkileri

### 3.2 Sözleşme Riski Matrisi

Her kritik sözleşme için değişim kontrolü (change of control) hükümleri incelenir. Bu hükümler, bir satış veya birleşme sonrasında sözleşmenin feshedilip edilemeyeceğini belirler.

## 4. Hafta 9–11: Operasyonel ve Ticari Due Diligence

Operasyonel due diligence, işletmenin "motor odasını" inceler. Finansal tablolarda görünmeyen değer yaratma ve değer tahribat dinamiklerini ortaya çıkarır.

### 4.1 Pazar Pozisyonu Değerlendirmesi

- Pazar payı ve rekabetçi konum
- Müşteri konsantrasyon riski (tek müşterinin gelir içindeki payı)
- Tedarik zinciri bağımlılıkları

<NewsletterMidCTA />

### 4.2 Operasyonel KPI Analizi

Sektöre özgü KPI'lar, ortalama sektör karşılaştırmaları (benchmarks) ile değerlendirilir.

## 5. Hafta 12–13: Sentez ve Değerleme Etkisi

Son aşamada tüm bulgular bir araya getirilerek **risk-ayarlı değerleme** çerçevesi oluşturulur.

<Callout type="info">
Due diligence bulguları her zaman fiyat indirimi anlamına gelmez. Bazı riskler, uygun teminat mekanizmaları veya escrow düzenlemeleri ile yönetilebilir.
</Callout>

### 5.1 Risk Matrisinin Değerlemeye Yansıtılması

Her risk kalemi için üç senaryo analiz edilir:

- **Baz senaryo**: Riskin gerçekleşmeyeceği durumda değerleme
- **Kötümser senaryo**: Riskin tam olarak gerçekleşmesi halinde değerleme
- **Ağırlıklı ortalama**: Olasılık-ağırlıklı beklenen değer

## Sonuç: Due Diligence'ı Rekabet Avantajına Dönüştürmek

90 günlük due diligence süreci, yalnızca bir kontrol listesi değil; stratejik bir değer keşif aracıdır. Doğru uygulandığında, alıcıya hem riskleri hem de satıcının fark etmediği değer yaratma fırsatlarını gösterir.

<PullQuote>
En iyi due diligence, sizi doğru anlaşmadan vazgeçiren değil; yanlış anlaşmadan koruyan ve doğru anlaşmayı daha iyi fiyatla kapatmanızı sağlayan süreçtir.
</PullQuote>
`;

const RELATED_ARTICLES: InsightPostCard[] = [
  {
    id: 'rel-001',
    slug: 'ma-entegrasyon-100-gun',
    titleTr: 'M&A Sonrası 100 Günlük Entegrasyon Planı',
    titleEn: 'Post-M&A 100-Day Integration Plan',
    excerptTr:
      'Birleşme sonrası ilk 100 gün, değer yaratmanın ya da değer tahribatının belirlendiği kritik dönemdir.',
    excerptEn: 'The first 100 days post-merger determine whether value is created or destroyed.',
    coverImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    coverImageAlt: 'İki iş insanı anlaşma imzalıyor',
    primaryDomain: 'M_A',
    subDomain: 'Entegrasyon',
    type: 'FRAMEWORK',
    readingTimeMin: 9,
    viewCount: 1847,
    publishedAt: '2026-04-10T09:00:00Z',
    isFeatured: false,
    isEditorsPick: true,
    author: {
      id: 'author-001',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro kurucusu. 15+ yıl M&A ve kurumsal yönetim deneyimi.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      isFounder: true,
    },
    tags: [{ id: 'tag-ma-1', slug: 'ma-stratejisi', labelTr: 'M&A Stratejisi', axis: 'FORMAT' }],
  },
  {
    id: 'rel-002',
    slug: 'satici-temsili-hazirlik',
    titleTr: 'Satıcı Temsili: Due Diligence Öncesi Hazırlık',
    titleEn: 'Sell-Side Preparation: Getting Ready for Due Diligence',
    excerptTr:
      'Satış sürecine hazırlanan şirketler için kapsamlı bir ön-due diligence kontrol listesi.',
    excerptEn: 'A comprehensive pre-due diligence checklist for companies preparing for sale.',
    coverImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    coverImageAlt: 'Finansal dökümanlar üzerinde çalışan ekip',
    primaryDomain: 'M_A',
    subDomain: 'Satıcı Temsili',
    type: 'CHECKLIST',
    readingTimeMin: 7,
    viewCount: 1234,
    publishedAt: '2026-03-22T09:00:00Z',
    isFeatured: false,
    isEditorsPick: false,
    author: {
      id: 'author-001',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro kurucusu. 15+ yıl M&A ve kurumsal yönetim deneyimi.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      isFounder: true,
    },
    tags: [{ id: 'tag-ma-2', slug: 'satis-sureci', labelTr: 'Satış Süreci', axis: 'FORMAT' }],
  },
  {
    id: 'rel-003',
    slug: 'kobi-deger-tespiti',
    titleTr: 'KOBİ Değer Tespiti: Yöntemler ve Tuzaklar',
    titleEn: 'SME Valuation: Methods and Pitfalls',
    excerptTr:
      'Küçük ve orta ölçekli işletmelerin değer tespitinde kullanılan yöntemler ve kaçınılması gereken hatalar.',
    excerptEn:
      'Valuation methods for small and medium-sized businesses and common pitfalls to avoid.',
    coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    coverImageAlt: 'Değerleme analizi grafikleri',
    primaryDomain: 'M_A',
    subDomain: 'Değerleme',
    type: 'ANALYSIS',
    readingTimeMin: 11,
    viewCount: 2103,
    publishedAt: '2026-02-15T09:00:00Z',
    isFeatured: true,
    isEditorsPick: true,
    author: {
      id: 'author-001',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro kurucusu. 15+ yıl M&A ve kurumsal yönetim deneyimi.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      isFounder: true,
    },
    tags: [{ id: 'tag-ma-3', slug: 'deger-tespiti', labelTr: 'Değer Tespiti', axis: 'FORMAT' }],
  },
];

const MOCK_ARTICLE: InsightPost = {
  id: 'post-ma-dd-001',
  slug: 'ma-due-diligence-90-gunluk-checklist',
  slugEn: 'ma-due-diligence-90-day-checklist',
  type: 'CHECKLIST',
  status: 'PUBLISHED',
  language: 'TR_ONLY',

  titleTr: 'M&A Due Diligence: 90 Günlük Checklist',
  titleEn: 'M&A Due Diligence: The 90-Day Checklist',
  excerptTr:
    'Türkiye pazarında hedef şirket analizi için kanıtlanmış 90 günlük due diligence metodolojisi. Finansal, hukuki, operasyonel ve KVKK uyum boyutlarını kapsayan kapsamlı rehber.',
  excerptEn:
    'A proven 90-day due diligence methodology for target company analysis in the Turkish market, covering financial, legal, operational, and KVKK compliance dimensions.',
  bodyTrMdx: SAMPLE_BODY_MDX,

  primaryDomain: 'M_A',
  subDomain: 'Due Diligence',
  topic: 'M&A Metodolojisi',
  seriesId: 'series-ma-playbook',
  seriesOrder: 2,

  tags: [
    { id: 'tag-1', slug: 'due-diligence', labelTr: 'Due Diligence', axis: 'FORMAT' },
    { id: 'tag-2', slug: 'kob-i-ma', labelTr: 'KOBİ M&A', axis: 'SECTOR' },
    { id: 'tag-3', slug: 'kvkk', labelTr: 'KVKK', axis: 'REG' },
    { id: 'tag-4', slug: 'finansal-analiz', labelTr: 'Finansal Analiz', axis: 'FORMAT' },
  ],

  author: {
    id: 'author-001',
    slug: 'emre-can-yalcin',
    displayName: 'Emre Can Yalçın',
    bioTr:
      'eCyPro Premium Consulting kurucusu. 15 yılı aşkın M&A danışmanlığı, kurumsal yönetim ve ESG stratejisi deneyimine sahip bağımsız danışman. Boğaziçi Üniversitesi İşletme mezunu.',
    bioEn:
      'Founder of eCyPro Premium Consulting. Independent advisor with 15+ years in M&A advisory, corporate governance and ESG strategy. Boğaziçi University, Business Administration.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    linkedinUrl: 'https://linkedin.com/in/emrecanyalcin',
    twitterUrl: 'https://twitter.com/emrecanyalcin',
    isFounder: true,
  },

  coverImageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',
  coverImageAlt: 'Due diligence dokümanları üzerinde çalışan profesyoneller',
  ogImageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',

  metaTitleTr: 'M&A Due Diligence: 90 Günlük Kontrol Listesi | eCyPro Perspektif',
  metaDescTr:
    'Türkiye M&A pazarı için kapsamlı due diligence metodolojisi. Finansal, hukuki ve operasyonel boyutları kapsayan 90 günlük kanıtlanmış çerçeve.',
  canonicalUrl: 'https://ecypro.com/insights/ma-due-diligence-90-gunluk-checklist',
  noindex: false,

  readingTimeMin: 12,
  viewCount: 3842,
  uniqueViewCount: 2901,
  shareCount: 247,
  bookmarkCount: 189,
  commentCount: 14,

  publishedAt: '2026-05-10T09:00:00Z',
  updatedAt: '2026-05-15T14:30:00Z',
  createdAt: '2026-05-01T10:00:00Z',

  isFeatured: true,
  isEditorsPick: true,
  featureOrder: 1,
  feedPinned: false,

  series: {
    id: 'series-ma-playbook',
    slug: 'ma-playbook-turkiye',
    titleTr: 'Türkiye M&A Playbook',
    titleEn: 'Turkey M&A Playbook',
    descriptionTr:
      "Türkiye'de M&A süreçlerini baştan sona kapsayan kapsamlı rehber serisi. Değerleme, due diligence, müzakere ve entegrasyon aşamalarını içerir.",
    descriptionEn:
      'A comprehensive guide series covering M&A processes in Turkey end-to-end, including valuation, due diligence, negotiation, and integration.',
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    totalParts: 5,
    status: 'ACTIVE',
  },

  manualRelated: RELATED_ARTICLES,
};

export async function fetchInsightArticle(slug: string): Promise<InsightPost | null> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (
    slug === 'ma-due-diligence-90-gunluk-checklist' ||
    slug === 'test-article' ||
    slug === 'sample'
  ) {
    return MOCK_ARTICLE;
  }

  return { ...MOCK_ARTICLE, slug };
}

export { MOCK_ARTICLE, RELATED_ARTICLES };
