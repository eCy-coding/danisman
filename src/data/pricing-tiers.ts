/**
 * L1-8 — /pricing data: 3 USD tiers + feature matrix + quiz + FAQ
 *
 * All prices in USD. Tier scoring: Starter=1, Growth=2, Enterprise=3.
 * Quiz total: 5-8 → Starter, 9-12 → Growth, 13-15 → Enterprise.
 */

export type TierId = 'starter' | 'growth' | 'enterprise';

export interface PricingTier {
  id: TierId;
  name: string;
  tagline: string;
  priceLabel: string;
  minTerm: string;
  highlight?: boolean;
  cta: string;
  ctaHref: string;
  features: string[];
}

export interface FeatureRow {
  feature: string;
  starter: boolean | string;
  growth: boolean | string;
  enterprise: boolean | string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; score: 1 | 2 | 3 }[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

// ─── Tiers ───────────────────────────────────────────────────────────────────

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Tek küme odaklı engagement',
    priceLabel: '15K–25K USD/ay',
    minTerm: 'Min. 3 ay retainer',
    cta: 'Tanışma Toplantısı Planla',
    ctaHref: '/discovery',
    features: [
      '1 küme: M&A veya ESG veya Fintech veya Aile Şirketi',
      'Founder haftalık 1:1 (60 dk)',
      'WhatsApp 09:00–18:00 yanıt',
      'Aylık ilerleme raporu',
      'KVKK ROPA template + DSAR şablon',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Multi-küme strategic partner',
    priceLabel: '25K–50K USD/ay',
    minTerm: 'Min. 6 ay retainer',
    highlight: true,
    cta: 'Discovery Call Talep Et',
    ctaHref: '/discovery',
    features: [
      '2–3 küme erişim',
      'Founder 2 haftada bir 1:1 (90 dk)',
      'WhatsApp 7 gün / 24 saat',
      'Bi-weekly KPI dashboard',
      'Sektör-spesifik playbook',
      'Yıllık ESG + KVKK uyum denetimi',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Tam kapsamlı dönüşüm partneri',
    priceLabel: 'Custom',
    minTerm: '12+ ay retainer',
    cta: 'Founder ile Konuş',
    ctaHref: '/discovery',
    features: [
      '4 küme tam erişim + custom workstream',
      'Founder embedded — haftada 1 tam gün',
      'Dedicated WhatsApp channel + Telegram',
      'Real-time dashboard (Better Stack + PostHog)',
      'Board-level quarterly reporting',
      'M&A success fee opsiyonu',
    ],
  },
];

// ─── Feature Matrix (15 rows) ─────────────────────────────────────────────

export const FEATURE_MATRIX: FeatureRow[] = [
  { feature: 'Küme sayısı', starter: '1', growth: '2–3', enterprise: '4 (tam)' },
  { feature: 'Minimum süre', starter: '3 ay', growth: '6 ay', enterprise: '12 ay' },
  {
    feature: 'Founder 1:1 frekansı',
    starter: 'Haftada 1 (60 dk)',
    growth: '2 haftada 1 (90 dk)',
    enterprise: 'Haftada 1 gün embedded',
  },
  { feature: 'WhatsApp erişim', starter: '09–18', growth: '7/24', enterprise: 'Dedicated channel' },
  { feature: 'KVKK ROPA + DSAR', starter: true, growth: true, enterprise: true },
  { feature: 'ESG ESRS Roadmap', starter: false, growth: true, enterprise: true },
  { feature: 'Fintech compliance audit', starter: false, growth: true, enterprise: true },
  { feature: 'Aile şirketi succession', starter: false, growth: true, enterprise: true },
  { feature: 'Sektör playbook', starter: false, growth: true, enterprise: 'Custom' },
  { feature: 'KPI dashboard', starter: 'Aylık', growth: 'Bi-weekly', enterprise: 'Gerçek zamanlı' },
  { feature: 'Board reporting', starter: false, growth: 'Quarterly', enterprise: 'Aylık + ad-hoc' },
  { feature: 'M&A advisory', starter: false, growth: true, enterprise: true },
  { feature: 'M&A success fee opsiyonu', starter: false, growth: false, enterprise: true },
  { feature: 'Founder Letter EN', starter: false, growth: true, enterprise: true },
  {
    feature: 'Sentry / Better Stack raporlama',
    starter: false,
    growth: false,
    enterprise: true,
  },
];

// ─── Quiz ─────────────────────────────────────────────────────────────────────
// Score key: 1=Starter, 2=Growth, 3=Enterprise
// Total 5 questions. Range 5-8→Starter, 9-12→Growth, 13-15→Enterprise.

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'revenue',
    question: 'Şirketinizin yıllık ciro aralığı nedir?',
    options: [
      { label: '100 milyon USD altı', score: 1 },
      { label: '100 milyon – 1 milyar USD', score: 2 },
      { label: '1 milyar USD ve üzeri', score: 3 },
    ],
  },
  {
    id: 'domain',
    question: 'Hangi alanda desteğe ihtiyaç duyuyorsunuz?',
    options: [
      { label: 'Tek alan (M&A, KVKK, ESG veya Succession)', score: 1 },
      { label: '2–3 alan (multi-domain)', score: 2 },
      { label: '4 alan + custom workstream', score: 3 },
    ],
  },
  {
    id: 'duration',
    question: 'Planlanan engagement süresi?',
    options: [
      { label: '3–6 ay', score: 1 },
      { label: '6–12 ay', score: 2 },
      { label: '12 ay ve üzeri', score: 3 },
    ],
  },
  {
    id: 'founder_access',
    question: 'Founder ile etkileşim sıklığı tercihiniz?',
    options: [
      { label: 'Aylık checkpoint yeterli', score: 1 },
      { label: 'Düzenli operasyonel partner', score: 2 },
      { label: 'Embedded leadership (sahaya iniş)', score: 3 },
    ],
  },
  {
    id: 'regulatory',
    question: 'Regülasyon yoğunluğunuz?',
    options: [
      { label: 'Tek regülatör (örn. SPK)', score: 1 },
      { label: '2–3 regülatör (örn. KVKK + MASAK + SPK)', score: 2 },
      { label: '4+ (CSRD + KVKK + GDPR + çok-yargı)', score: 3 },
    ],
  },
];

export function scoreToTier(total: number): TierId {
  if (total <= 8) return 'starter';
  if (total <= 12) return 'growth';
  return 'enterprise';
}

// ─── FAQ (10 items) ───────────────────────────────────────────────────────────

export const PRICING_FAQS: FaqItem[] = [
  {
    question: 'Saat bazlı fiyatlandırma neden tercih etmiyorsunuz?',
    answer:
      'Saat bazlı modeller müşteriyle çıkar çatışması yaratır: danışman ne kadar uzun süre harcarsa o kadar çok kazanır. Biz milestone ve sonuç bazlı retainer modeli kullanıyoruz — hedef aynı tarafta.',
  },
  {
    question: 'Minimum süreyi neden 3 ay tutuyorsunuz?',
    answer:
      "Stratejik danışmanlıkta anlamlı sonuçlar en az 3 aylık bir süreç gerektirir. Kısa engagement'lar yüzeysel kalır; taahhüt ederseniz gerçek dönüşüm başlar.",
  },
  {
    question: 'Success fee modeli nasıl çalışıyor?',
    answer:
      "Enterprise tier'da M&A işlemlerinde opsiyon olarak sunulur. Baz retainer + anlaşma değerinin küçük bir yüzdesi şeklinde yapılandırılır. Detaylar müzakereye açıktır.",
  },
  {
    question: 'Hangi sektörlerde uzmanlığınız var?',
    answer:
      'Dört ana küme: M&A ve kurumsal yeniden yapılanma, ESG & ESRS sürdürülebilirlik, Fintech regülasyon & lisans, Aile şirketi yönetişim & kuşak geçişi.',
  },
  {
    question: 'Tier değişikliği nasıl yapılır?',
    answer:
      'Mevcut dönem tamamlandıktan sonra tier yükseltme veya düşürme yapılabilir. Yükseltme için 30 gün, düşürme için 60 gün önceden bildirim yeterlidir.',
  },
  {
    question: 'Tanışma toplantısı ücretli mi?',
    answer:
      "İlk keşif görüşmesi (30 dakika) ücretsizdir. Bu görüşme kapsamında ihtiyaçlarınızı dinler, en uygun tier'ı birlikte değerlendiririz.",
  },
  {
    question: 'Sözleşme bitiminde NDA + veri saklama nasıl?',
    answer:
      'NDA engagement süresince ve sonrasında 3 yıl geçerlidir. Müşteriye ait tüm veriler sözleşme bitiminden 30 gün içinde imha edilir; talep halinde imha belgesi sunulur.',
  },
  {
    question: 'Ödeme koşulları ve para birimi?',
    answer:
      'Faturalar USD üzerinden düzenlenir. Ödeme SWIFT transferi veya Wise ile yapılabilir. Aylık retainer faturası ay başında kesilir; net 15 gün vade.',
  },
  {
    question: 'Junior delegasyon yok dediniz — gerçekten Founder mı eşlik eder?',
    answer:
      "Evet. Emre Can Yalçın her tier'da birincil temas noktasıdır. Alt danışman veya analist devri yoktur. Bu, boutique modelimizin temel taahhüdüdür.",
  },
  {
    question: 'Hangi referansları paylaşabilirsiniz?',
    answer:
      "NDA kısıtlamaları nedeniyle müşteri adlarını kamuya açık paylaşamıyoruz. Discovery call'da sektöre özgü anonim vaka özetlerini sunabiliriz.",
  },
];
