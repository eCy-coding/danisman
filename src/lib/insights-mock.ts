import type {
  InsightAuthor,
  InsightPostCard,
  InsightSeries,
  InsightsFeedResponse,
  InsightsFilter,
  DomainSpotlight,
  Domain,
} from '@/types/insights';

const AUTHOR_ECY: InsightAuthor = {
  id: 'author-ecy',
  slug: 'emre-can-yalcin',
  displayName: 'Emre Can Yalçın',
  bioTr:
    "Türkiye'de M&A, ESG ve aile şirketi alanlarında uzman yönetim danışmanı. eCyPro'nun kurucu ortağı.",
  bioEn:
    'Management consultant specializing in M&A, ESG and family business in Turkey. Founding partner of eCyPro.',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop',
  linkedinUrl: 'https://linkedin.com/in/emrecanyalcin',
  isFounder: true,
};

const MOCK_SERIES: InsightSeries[] = [
  {
    id: 'series-ma-playbook',
    slug: 'turkiyede-ma-playbook',
    titleTr: "Türkiye'de M&A Playbook",
    titleEn: 'M&A Playbook in Turkey',
    descriptionTr:
      "Türkiye'de şirket alım-satım süreçlerinin A'dan Z'ye rehberi. Due diligence, değerleme, müzakere ve kapanış.",
    descriptionEn:
      'A to Z guide for M&A processes in Turkey. Due diligence, valuation, negotiation and closing.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
    totalParts: 6,
    status: 'ACTIVE',
  },
  {
    id: 'series-aile-surdurulebilirlik',
    slug: 'aile-sirketi-surdurulebilirlik',
    titleTr: 'Aile Şirketinde Sürdürülebilirlik',
    titleEn: 'Sustainability in Family Business',
    descriptionTr:
      'Kuşaklar arası köprü kurmak. Aile şirketlerinde ESG entegrasyonu, yönetişim yapıları ve nesil geçişi.',
    descriptionEn:
      'Building bridges between generations. ESG integration, governance structures and generational transition.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
    totalParts: 4,
    status: 'ACTIVE',
  },
];

function makePost(
  overrides: Partial<InsightPostCard> &
    Pick<InsightPostCard, 'id' | 'slug' | 'titleTr' | 'primaryDomain'>,
): InsightPostCard {
  return {
    titleEn: undefined,
    excerptTr: 'Bu yazıda konuyu tüm boyutlarıyla ele alıyoruz.',
    excerptEn: undefined,
    coverImageUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
    coverImageAlt: overrides.titleTr,
    subDomain: 'genel',
    type: 'ANALYSIS',
    readingTimeMin: 7,
    viewCount: 1240,
    publishedAt: '2026-05-15T09:00:00Z',
    isFeatured: false,
    isEditorsPick: false,
    author: AUTHOR_ECY,
    tags: [],
    ...overrides,
  };
}

export const MOCK_POSTS: InsightPostCard[] = [
  makePost({
    id: 'post-001',
    slug: 'turkiyede-ma-degerleme-yontemleri-2026',
    titleTr: "Türkiye'de M&A Değerleme Yöntemleri: 2026 Güncelleme",
    titleEn: 'M&A Valuation Methods in Turkey: 2026 Update',
    excerptTr:
      'Yüksek enflasyon ortamında DCF ve çarpan analizlerinin nasıl kalibre edilmesi gerektiğini açıklıyoruz. BIST referans şirketleri ve sektöre özel düzeltme faktörleri.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
    primaryDomain: 'M_A',
    subDomain: 'degerleme',
    type: 'ANALYSIS',
    readingTimeMin: 12,
    viewCount: 3850,
    publishedAt: '2026-05-20T08:00:00Z',
    isFeatured: true,
    isEditorsPick: true,
    tags: [
      { id: 't1', slug: 'dcf', labelTr: 'DCF', axis: 'FORMAT' },
      { id: 't2', slug: 'bist', labelTr: 'BIST', axis: 'GEO' },
    ],
  }),

  makePost({
    id: 'post-002',
    slug: 'esg-raporlama-csrd-turkiye-etkileri',
    titleTr: "CSRD'nin Türkiye'ye Etkileri: Hangi Şirketler Hazırlanmalı?",
    titleEn: 'CSRD Impact on Turkey: Which Companies Need to Prepare?',
    excerptTr:
      "AB Kurumsal Sürdürülebilirlik Raporlama Direktifi Türk tedarik zincirlerini de kapsıyor. İhracat yapan KOBİ'lerden büyük holdinglere kapsamlı yol haritası.",
    coverImageUrl:
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=450&fit=crop',
    primaryDomain: 'ESG',
    subDomain: 'raporlama',
    type: 'REGULATORY_ALERT',
    readingTimeMin: 9,
    viewCount: 2910,
    publishedAt: '2026-05-18T09:00:00Z',
    isFeatured: true,
    tags: [
      { id: 't3', slug: 'csrd', labelTr: 'CSRD', axis: 'REG' },
      { id: 't4', slug: 'ab-duzenlemesi', labelTr: 'AB Düzenlemesi', axis: 'REG' },
    ],
  }),

  makePost({
    id: 'post-003',
    slug: 'fintech-bddk-lisanslama-rehberi',
    titleTr: 'BDDK Fintech Lisanslama: Başvuru Öncesi Bilmeniz Gerekenler',
    excerptTr:
      'Ödeme kuruluşu, e-para kuruluşu ve kredi platformu lisansları için başvuru süreçleri, sermaye gereksinimleri ve sık yapılan hatalar.',
    coverImageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop',
    primaryDomain: 'FINTECH',
    subDomain: 'lisanslama',
    type: 'FRAMEWORK',
    readingTimeMin: 15,
    viewCount: 4200,
    publishedAt: '2026-05-16T09:00:00Z',
    isFeatured: true,
    tags: [
      { id: 't5', slug: 'bddk', labelTr: 'BDDK', axis: 'REG' },
      { id: 't6', slug: 'lisanslama', labelTr: 'Lisanslama', axis: 'FORMAT' },
    ],
  }),

  makePost({
    id: 'post-004',
    slug: 'aile-sirketi-yonetisim-nesil-gecisi',
    titleTr: "Nesil Geçişinde Yönetişim: Aile Anayasasından Profesyonel CEO'ya",
    excerptTr:
      'İkinci veya üçüncü nesle geçiş yapan aile şirketleri için yönetim kurulu yapısı, aile konseyi ve kurumsal dönüşüm rehberi.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop',
    primaryDomain: 'AILE_SIRKETI',
    subDomain: 'yonetisim',
    type: 'FRAMEWORK',
    readingTimeMin: 11,
    viewCount: 2650,
    publishedAt: '2026-05-14T09:00:00Z',
    isEditorsPick: true,
    tags: [
      { id: 't7', slug: 'aile-anayasasi', labelTr: 'Aile Anayasası', axis: 'FORMAT' },
      { id: 't8', slug: 'yonetisim', labelTr: 'Yönetişim', axis: 'TREND' },
    ],
  }),

  makePost({
    id: 'post-005',
    slug: 'due-diligence-veri-odasi-best-practice',
    titleTr: 'Sanal Veri Odası Kurulumu: 47 Maddelik Due Diligence Kontrol Listesi',
    excerptTr:
      'Alıcı ve satıcı tarafların veri odası kurulumunda sık yaptığı 12 hata ve nasıl önleneceği.',
    primaryDomain: 'M_A',
    subDomain: 'due-diligence',
    type: 'CHECKLIST',
    readingTimeMin: 8,
    viewCount: 5100,
    publishedAt: '2026-05-12T09:00:00Z',
    tags: [{ id: 't9', slug: 'due-diligence', labelTr: 'Due Diligence', axis: 'FORMAT' }],
  }),

  makePost({
    id: 'post-006',
    slug: 'karbon-ayak-izi-hesaplama-scope-3',
    titleTr: 'Scope 3 Karbon Hesaplama: Türk Şirketleri için Pratik Rehber',
    excerptTr:
      'Tedarik zinciri emisyonlarını ölçmek artık zorunluluk. GHG Protokolü metodolojisi ve Türkiye özelindeki veri kaynakları.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=450&fit=crop',
    primaryDomain: 'ESG',
    subDomain: 'iklim',
    type: 'TUTORIAL',
    readingTimeMin: 10,
    viewCount: 1980,
    publishedAt: '2026-05-11T09:00:00Z',
    tags: [
      { id: 't10', slug: 'scope-3', labelTr: 'Scope 3', axis: 'FORMAT' },
      { id: 't11', slug: 'karbon', labelTr: 'Karbon', axis: 'TREND' },
    ],
  }),

  makePost({
    id: 'post-007',
    slug: 'acik-bankacilik-api-ekonomisi-turkiye',
    titleTr: "Açık Bankacılık API Ekonomisi: Türkiye'de Neredeyiz?",
    excerptTr:
      "BDDK'nın Açık Bankacılık düzenlemeleri sonrası Türkiye fintech ekosistemi ve PSD2 ile karşılaştırma.",
    coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
    primaryDomain: 'FINTECH',
    subDomain: 'acik-bankacilik',
    type: 'ANALYSIS',
    readingTimeMin: 8,
    viewCount: 3300,
    publishedAt: '2026-05-10T09:00:00Z',
    tags: [
      { id: 't12', slug: 'acik-bankacilik', labelTr: 'Açık Bankacılık', axis: 'TREND' },
      { id: 't13', slug: 'api', labelTr: 'API', axis: 'FORMAT' },
    ],
  }),

  makePost({
    id: 'post-008',
    slug: 'aile-sirketi-buyume-sermaye-yontemleri',
    titleTr: 'Aile Şirketlerinde Büyüme Finansmanı: PE, Borçlanma ve Stratejik Ortak',
    excerptTr:
      'Öz kaynak yetersizliği yaşayan aile şirketleri için üç alternatif finansman yolu, avantajları ve dezavantajlarıyla.',
    primaryDomain: 'AILE_SIRKETI',
    subDomain: 'finansman',
    type: 'ANALYSIS',
    readingTimeMin: 13,
    viewCount: 2200,
    publishedAt: '2026-05-09T09:00:00Z',
    tags: [
      { id: 't14', slug: 'private-equity', labelTr: 'Private Equity', axis: 'SECTOR' },
      { id: 't15', slug: 'finansman', labelTr: 'Finansman', axis: 'FORMAT' },
    ],
  }),

  makePost({
    id: 'post-009',
    slug: 'ma-post-merger-integration-checklist',
    titleTr: 'Post-Merger Integration: İlk 100 Günün Kritik Adımları',
    primaryDomain: 'M_A',
    subDomain: 'entegrasyon',
    type: 'CHECKLIST',
    readingTimeMin: 9,
    viewCount: 4700,
    publishedAt: '2026-05-08T09:00:00Z',
    isEditorsPick: true,
  }),

  makePost({
    id: 'post-010',
    slug: 'esg-yatirimci-iliskileri-surdurulebilirlik-raporu',
    titleTr: 'Sürdürülebilirlik Raporunda Yatırımcıyı İkna Eden 5 Unsur',
    primaryDomain: 'ESG',
    subDomain: 'yatirimci-iliskileri',
    type: 'OPINION',
    readingTimeMin: 6,
    viewCount: 1560,
    publishedAt: '2026-05-07T09:00:00Z',
  }),

  makePost({
    id: 'post-011',
    slug: 'kripto-varlik-duzenlemesi-turkiye-spk',
    titleTr: 'SPK Kripto Varlık Düzenlemesi: Piyasaya Etkileri',
    primaryDomain: 'FINTECH',
    subDomain: 'kripto',
    type: 'REGULATORY_ALERT',
    readingTimeMin: 7,
    viewCount: 6800,
    publishedAt: '2026-05-06T09:00:00Z',
  }),

  makePost({
    id: 'post-012',
    slug: 'aile-sirketi-cg-rating-kredi-notu',
    titleTr: 'Aile Şirketinin Kredi Notu Nasıl Yükseltilir?',
    primaryDomain: 'AILE_SIRKETI',
    subDomain: 'kredi',
    type: 'FRAMEWORK',
    readingTimeMin: 10,
    viewCount: 1900,
    publishedAt: '2026-05-05T09:00:00Z',
  }),

  makePost({
    id: 'post-013',
    slug: 'ma-cross-border-turkiye-vergi-yapilandirma',
    titleTr: "Cross-Border M&A'da Türkiye Vergi Yapılandırması",
    primaryDomain: 'M_A',
    subDomain: 'vergi',
    type: 'FRAMEWORK',
    readingTimeMin: 14,
    viewCount: 2100,
    publishedAt: '2026-05-04T09:00:00Z',
  }),

  makePost({
    id: 'post-014',
    slug: 'esg-tedarik-zinciri-insan-haklari-durum-tespiti',
    titleTr: 'Tedarik Zincirinde İnsan Hakları Due Diligence',
    primaryDomain: 'ESG',
    subDomain: 'insan-haklari',
    type: 'CASE_STUDY',
    readingTimeMin: 11,
    viewCount: 1340,
    publishedAt: '2026-05-03T09:00:00Z',
  }),

  makePost({
    id: 'post-015',
    slug: 'embedded-finance-bankacilik-yazilim',
    titleTr: 'Embedded Finance: Yazılım Şirketleri Neden Banka Gibi Davranıyor?',
    primaryDomain: 'FINTECH',
    subDomain: 'embedded-finance',
    type: 'ANALYSIS',
    readingTimeMin: 8,
    viewCount: 3100,
    publishedAt: '2026-05-02T09:00:00Z',
  }),

  makePost({
    id: 'post-016',
    slug: 'aile-sirketi-ipo-hazirlik-sureci',
    titleTr: 'Aile Şirketinden Halka Arz: 18 Aylık Hazırlık Süreci',
    primaryDomain: 'AILE_SIRKETI',
    subDomain: 'ipo',
    type: 'FRAMEWORK',
    readingTimeMin: 16,
    viewCount: 2890,
    publishedAt: '2026-05-01T09:00:00Z',
    isEditorsPick: true,
  }),

  makePost({
    id: 'post-017',
    slug: 'ma-management-buyout-turkiye',
    titleTr: "Türkiye'de Management Buyout: Avantajlar ve Tuzaklar",
    primaryDomain: 'M_A',
    subDomain: 'buyout',
    type: 'CASE_STUDY',
    readingTimeMin: 10,
    viewCount: 1750,
    publishedAt: '2026-04-29T09:00:00Z',
  }),

  makePost({
    id: 'post-018',
    slug: 'esg-su-riski-turkiye-havzalari',
    titleTr: 'Türkiye Su Havzaları Risk Haritası: Şirketler için Anlamı',
    primaryDomain: 'ESG',
    subDomain: 'cevre',
    type: 'DATA_DEEP_DIVE',
    readingTimeMin: 12,
    viewCount: 1180,
    publishedAt: '2026-04-27T09:00:00Z',
  }),

  makePost({
    id: 'post-019',
    slug: 'fintech-regtech-uyum-maliyeti-azaltma',
    titleTr: 'RegTech ile Uyum Maliyetini %40 Düşürmek Mümkün mü?',
    primaryDomain: 'FINTECH',
    subDomain: 'regtech',
    type: 'ANALYSIS',
    readingTimeMin: 9,
    viewCount: 2450,
    publishedAt: '2026-04-25T09:00:00Z',
  }),

  makePost({
    id: 'post-020',
    slug: 'aile-sirketi-sukuk-islami-finans',
    titleTr: 'Aile Şirketleri için Sukuk ve İslami Finansman Alternatifleri',
    primaryDomain: 'AILE_SIRKETI',
    subDomain: 'islami-finans',
    type: 'ANALYSIS',
    readingTimeMin: 11,
    viewCount: 1650,
    publishedAt: '2026-04-23T09:00:00Z',
  }),
];

function filterPosts(posts: InsightPostCard[], filter: InsightsFilter): InsightPostCard[] {
  let result = [...posts];

  if (filter.domain) {
    result = result.filter((p) => p.primaryDomain === filter.domain);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (p) => p.titleTr.toLowerCase().includes(q) || (p.excerptTr ?? '').toLowerCase().includes(q),
    );
  }

  if (filter.tags && filter.tags.length > 0) {
    result = result.filter((p) => filter.tags!.some((slug) => p.tags.some((t) => t.slug === slug)));
  }

  switch (filter.sort) {
    case 'popular':
      result.sort((a, b) => b.viewCount - a.viewCount);
      break;
    case 'editors_pick':
      result = result.filter((p) => p.isEditorsPick);
      break;
    case 'trending':
      result.sort((a, b) => b.viewCount - a.viewCount);
      break;
    default:
      result.sort(
        (a, b) => new Date(b.publishedAt ?? '').getTime() - new Date(a.publishedAt ?? '').getTime(),
      );
  }

  return result;
}

const PAGE_SIZE = 8;

export async function fetchInsightsFeed(
  filter: InsightsFilter & { cursor?: string },
): Promise<InsightsFeedResponse> {
  await new Promise((res) => setTimeout(res, 120));

  const all = filterPosts(MOCK_POSTS, filter);
  const offset = filter.cursor ? parseInt(filter.cursor, 10) : 0;
  const page = all.slice(offset, offset + PAGE_SIZE);
  const hasMore = offset + PAGE_SIZE < all.length;

  return {
    posts: page,
    total: all.length,
    hasMore,
    nextCursor: hasMore ? String(offset + PAGE_SIZE) : undefined,
  };
}

export function getMockFeaturedPost(): InsightPostCard {
  const found = MOCK_POSTS.find((p) => p.isFeatured && p.isEditorsPick) ?? MOCK_POSTS[0];
  if (!found) throw new Error('No mock posts available');
  return found;
}

export function getMockFeaturedGrid(): InsightPostCard[] {
  return MOCK_POSTS.filter((p) => p.isFeatured).slice(0, 3);
}

export function getMockDomainSpotlights(): DomainSpotlight[] {
  const domains: Domain[] = ['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'];

  return domains.flatMap((domain) => {
    const posts = MOCK_POSTS.filter((p) => p.primaryDomain === domain);
    const sorted = [...posts].sort(
      (a, b) => new Date(b.publishedAt ?? '').getTime() - new Date(a.publishedAt ?? '').getTime(),
    );
    const byViews = [...posts].sort((a, b) => b.viewCount - a.viewCount);
    const fallback = posts[0];
    const editorPick = posts.find((p) => p.isEditorsPick) ?? fallback;
    const latest = sorted[0];
    const popular = byViews[0];

    if (!latest || !popular || !editorPick) {
      return [];
    }

    return [{ domain, latest, popular, editorsPick: editorPick }];
  });
}

export function getMockSeries(): InsightSeries[] {
  return MOCK_SERIES;
}

export function getMockArticleCounts(): Record<Domain | 'ALL', number> {
  const counts = {
    ALL: MOCK_POSTS.length,
    M_A: 0,
    ESG: 0,
    FINTECH: 0,
    AILE_SIRKETI: 0,
  };
  for (const p of MOCK_POSTS) {
    counts[p.primaryDomain]++;
  }
  return counts;
}
