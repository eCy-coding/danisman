/**
 * AUTO-GENERATED FILE — Phase 20.5 R1/R2.
 *
 * Source of truth for legacy `CASE_STUDIES` + `BLOG_POSTS` exports consumed by:
 *   - `src/components/sections/SuccessStories.tsx` (homepage horizontal scroll)
 *   - `src/components/sections/Insights.tsx` (homepage 3-up blog grid)
 *
 * The shape conforms to `src/types/legacy_types.{CaseStudy, BlogPost}` (i18n
 * `I18nString` fields), NOT the newer string-only `CaseStudy` defined in
 * `src/components/features/case-studies/CaseStudyCard.tsx` (which powers the
 * `/case-studies/:slug` detail route via `src/data/mockCaseStudies.ts`).
 *
 * Maintenance contract:
 *   - This file is **gitignored** (regenerable).
 *   - Regenerate the LLM-enriched version with `npm run gen:content` (requires
 *     OPENAI_API_KEY + PEXELS_API_KEY); without those env vars the script is a
 *     no-op so the inline fallback below remains the production content.
 *   - Phase 1-17 audited: this file is the canonical homepage source.
 */
import type { CaseStudy, BlogPost } from './src/types/legacy_types';

// P42: Anonimleştirilmiş case study'ler, conservative metrik / disclaimer.
// Görseller branded SVG (yerel), unsplash bağımlılığı kaldırıldı.
export const GENERATED_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs-tech-scaleup',
    client: 'Anonymized client · Tech Scale-up',
    sector: { tr: 'Teknoloji', en: 'Technology' },
    challenge: {
      tr: "Hızla büyüyen scale-up'ta rol netliği, karar hakları ve süreç sahipliği gri kalmıştı.",
      en: 'Role clarity, decision rights, and process ownership were blurred in a fast-growing scale-up.',
    },
    solution: {
      tr: 'Operating model: RACI yeniden tanımı, karar hakları matrisi, haftalık operasyon ritmi, lider koçluğu.',
      en: 'Operating model: RACI redesign, decision-rights matrix, weekly operating cadence, leadership coaching.',
    },
    result: {
      tr: 'Karar yürütme döngüsü sürdürülebilir biçimde kısaldı; yönetim ekibi ortak bir dile kavuştu.',
      en: 'Decision execution loop sustainably shortened; the leadership team converged on a shared language.',
    },
    description: {
      tr: '6 aylık engagement; tüm sayısal göstergeler retrospektif görüşmeye dayalı (NDA).',
      en: '6-month engagement; all numeric indicators based on post-engagement retrospective (NDA).',
    },
    image: '/case-studies/tech-scaleup.svg',
    category: { tr: 'Operasyonel Mükemmellik', en: 'Operational Excellence' },
    slug: 'tech-scaleup-operational-excellence',
  },
  {
    id: 'cs-family-business',
    client: 'Anonymized client · Family Business',
    sector: { tr: 'Aile Şirketi', en: 'Family Business' },
    challenge: {
      tr: 'İkinci kuşağa geçiş hazırlığı; aile-şirket sınırları, karar mekanizmaları, hissedar hakları.',
      en: 'Preparation for second-generation transition; family-business boundaries, decision mechanisms, shareholder rights.',
    },
    solution: {
      tr: 'Aile anayasası, yönetişim çerçevesi (aile konseyi · yönetim kurulu · icra) ve kuşak geçişi yol haritası.',
      en: 'Family constitution, governance framework (family council · board · executive) and succession roadmap.',
    },
    result: {
      tr: 'Yönetişim yazılı dokümana ve toplantı ritmine bağlandı; ikinci kuşak liderler tanımlı bir yetkinlik haritasıyla yönlendirildi.',
      en: 'Governance anchored in written documents and meeting cadence; next-gen leaders guided by a defined competency map.',
    },
    description: {
      tr: '9 aylık engagement; veriler NDA gereği anonimleştirilmiştir.',
      en: '9-month engagement; data anonymized per NDA.',
    },
    image: '/case-studies/family-business.svg',
    category: { tr: 'Aile Şirketleri', en: 'Family Business' },
    slug: 'family-business-governance',
  },
  {
    id: 'cs-manufacturing',
    client: 'Anonymized client · Manufacturing',
    sector: { tr: 'Üretim', en: 'Manufacturing' },
    challenge: {
      tr: 'Çok tesisli üretim grubunda plansız duruşlar ve yüksek hata oranı; mevcut raporlama sahaya inmiyordu.',
      en: 'Unplanned downtime and elevated defect rate in a multi-site manufacturer; reporting failed to reach the shop floor.',
    },
    solution: {
      tr: 'Gemba bazlı kayıp ağacı, hat sahibi koçluğu, görsel yönetim, Six Sigma DMAIC ile kritik hata modlarına odak.',
      en: 'Gemba-driven loss-tree mapping, line-owner coaching, visual management, Six Sigma DMAIC on critical defect modes.',
    },
    result: {
      tr: 'Öncelikli hata modlarında ölçülebilir azalma; iyileştirme metodolojisi kuruma kalıcı bir yetenek olarak transfer edildi.',
      en: 'Measurable reduction on priority defect modes; the improvement methodology was transferred to the client as a durable capability.',
    },
    description: {
      tr: '8 aylık engagement; sayısal göstergeler iç ölçüm, NDA gereği paylaşılmaz.',
      en: '8-month engagement; numeric indicators are internal measurements, not shared per NDA.',
    },
    image: '/case-studies/manufacturing.svg',
    category: { tr: 'Lean & Six Sigma', en: 'Lean & Six Sigma' },
    slug: 'manufacturing-lean-six-sigma',
  },
  {
    id: 'cs-ma-advisory',
    client: 'Anonymized client · M&A Advisory',
    sector: { tr: 'M&A', en: 'M&A' },
    challenge: {
      tr: 'Stratejik satın alma fırsatında geniş kapsamlı due diligence, müzakere disiplini ve PMI planı.',
      en: 'Wide-scope due diligence, negotiation discipline, and PMI plan for a strategic acquisition opportunity.',
    },
    solution: {
      tr: 'Çoklu metodoloji değerleme, müzakere oyun planı, 100-gün PMI çerçevesi ve sinerji takip mekanizması.',
      en: 'Multi-method valuation, negotiation playbook, 100-day PMI framework and synergy-tracking mechanism.',
    },
    result: {
      tr: 'İşlem öngörülen takvimde kapatıldı; kritik risklerin önemli bölümü müzakere aşamasında temizlendi.',
      en: 'Deal closed on schedule; a meaningful share of critical risks resolved at the negotiation stage.',
    },
    description: {
      tr: '5 aylık engagement; işlem detayları NDA gereği paylaşılmaz.',
      en: '5-month engagement; deal details not shared per NDA.',
    },
    image: '/case-studies/ma-advisory.svg',
    category: { tr: 'M&A Advisory', en: 'M&A Advisory' },
    slug: 'ma-advisory-engagement',
  },
  {
    id: 'cs-org-transformation',
    client: 'Anonymized client · Mid-cap',
    sector: { tr: 'Organizasyonel', en: 'Organizational' },
    challenge: {
      tr: 'Fonksiyonel siloların yavaşlattığı karar süreçleri; yatay işbirliğinde sürtünme.',
      en: 'Decision-making slowed by functional silos; friction in horizontal collaboration.',
    },
    solution: {
      tr: 'Müşteri yolculukları etrafında ürün odaklı squad tasarımı, yönetim ritmi yeniden kurulumu, lider koçluğu.',
      en: 'Product-oriented squads designed around customer journeys, redesigned management cadence, leadership coaching.',
    },
    result: {
      tr: 'Yeni işletim modeli yönetim kurulu tarafından onaylandı ve sahada uygulamaya başlandı.',
      en: 'New operating model approved by the board and rolled into the field.',
    },
    description: {
      tr: '7 aylık engagement; detaylar NDA gereği anonimleştirilmiştir.',
      en: '7-month engagement; details anonymized per NDA.',
    },
    image: '/case-studies/org-transformation.svg',
    category: { tr: 'Organizasyonel Dönüşüm', en: 'Organizational Transformation' },
    slug: 'organizational-transformation',
  },
];

export const GENERATED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'bp-2026-01',
    category: { tr: 'Strateji', en: 'Strategy' },
    date: { tr: '5 Ocak 2026', en: 'January 5, 2026' },
    readTime: { tr: '7 dk okuma', en: '7 min read' },
    title: {
      tr: 'Stratejik Dijital Dönüşüm Rehberi 2026',
      en: 'Strategic Digital Transformation Playbook 2026',
    },
    excerpt: {
      tr: 'Yapay zeka ve otomasyon çağında işletmenizi geleceğe hazırlamak için kapsamlı bir yol haritası.',
      en: 'A comprehensive roadmap to future-proof your enterprise in the age of AI and automation.',
    },
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1260&h=750',
    slug: 'stratejik-dijital-donusum-2026',
  },
  {
    id: 'bp-2026-02',
    category: { tr: 'Teknoloji', en: 'Technology' },
    date: { tr: '2 Ocak 2026', en: 'January 2, 2026' },
    readTime: { tr: '5 dk okuma', en: '5 min read' },
    title: {
      tr: 'Kurumsal Yönetimde Yapay Zeka Devrimi',
      en: 'The AI Revolution in Corporate Governance',
    },
    excerpt: {
      tr: "Yönetim kurullarından operasyonel süreçlere kadar AI'nın kurumsal yapı üzerindeki dönüştürücü etkisi.",
      en: 'How AI is transforming everything from boardrooms to operational processes.',
    },
    image:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1260&h=750',
    slug: 'yapay-zeka-yonetim-devrimi',
  },
  {
    id: 'bp-2025-12',
    category: { tr: 'Pazarlama', en: 'Marketing' },
    date: { tr: '28 Aralık 2025', en: 'December 28, 2025' },
    readTime: { tr: '6 dk okuma', en: '6 min read' },
    title: {
      tr: 'Global Pazarlara Açılma Stratejileri',
      en: 'Strategies for Entering Global Markets',
    },
    excerpt: {
      tr: 'Yerel başarıdan global bir markaya dönüşmek için izlenmesi gereken stratejik adımlar ve ipuçları.',
      en: 'Strategic steps and tips to evolve from local success to a global brand.',
    },
    image:
      'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&q=80&w=1260&h=750',
    slug: 'global-pazarlara-acilma',
  },
  {
    id: 'bp-2025-11',
    category: { tr: 'Operasyon', en: 'Operations' },
    date: { tr: '18 Kasım 2025', en: 'November 18, 2025' },
    readTime: { tr: '8 dk okuma', en: '8 min read' },
    title: {
      tr: 'Operasyonel Mükemmellik için Lean-AI Birleşimi',
      en: 'The Lean-AI Convergence for Operational Excellence',
    },
    excerpt: {
      tr: 'Klasik yalın üretimin AI/IIoT ile sinerjisi; %30 verimlilik artışı için somut yöntemler.',
      en: 'Classic lean manufacturing in synergy with AI/IIoT; concrete methods for 30% efficiency gains.',
    },
    image:
      'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80&w=1260&h=750',
    slug: 'lean-ai-operational-excellence',
  },
  {
    id: 'bp-2025-10',
    category: { tr: 'Liderlik', en: 'Leadership' },
    date: { tr: '4 Kasım 2025', en: 'November 4, 2025' },
    readTime: { tr: '6 dk okuma', en: '6 min read' },
    title: {
      tr: 'Belirsizlik Çağında Yönetim Kurulu Çevikliği',
      en: 'Boardroom Agility in an Era of Uncertainty',
    },
    excerpt: {
      tr: 'Volatil makro ortamda yönetim kurullarının senaryo planlama ve karar hızını yeniden tasarlaması.',
      en: 'How boards must redesign scenario planning and decision velocity in a volatile macro environment.',
    },
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1260&h=750',
    slug: 'boardroom-agility-uncertainty',
  },
  {
    id: 'bp-2026-02-roi',
    category: { tr: 'Finans', en: 'Finance' },
    date: { tr: '10 Şubat 2026', en: 'February 10, 2026' },
    readTime: { tr: '8 dk okuma', en: '8 min read' },
    title: {
      tr: "Yapay Zeka Yatırımının ROI'sini Hesaplamak: CFO Rehberi",
      en: 'Measuring AI Investment ROI: The CFO Framework',
    },
    excerpt: {
      tr: 'AI projelerinin gerçek finansal etkisini ölçmek için kanıtlanmış bir çerçeve. Maliyet, fayda ve risk analizi.',
      en: 'A proven framework to quantify the real financial impact of AI projects — cost, benefit and risk analysis.',
    },
    image:
      'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    slug: 'ai-yatirim-roi-hesaplama',
  },
  {
    id: 'bp-2026-03-change',
    category: { tr: 'Liderlik', en: 'Leadership' },
    date: { tr: '1 Mart 2026', en: 'March 1, 2026' },
    readTime: { tr: '6 dk okuma', en: '6 min read' },
    title: {
      tr: 'Dijital Dönüşümde Değişim Yönetimi: İnsan Faktörü',
      en: 'Change Management in Digital Transformation: The Human Factor',
    },
    excerpt: {
      tr: "Teknoloji projelerinin %70'i insani direnç nedeniyle başarısız olur. EcyPro'nun ADAPT çerçevesiyle değişimi yönetin.",
      en: "70% of technology projects fail due to human resistance. Manage change with EcyPro's ADAPT framework.",
    },
    image:
      'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    slug: 'organizasyonel-degisim-yonetimi',
  },
  {
    id: 'bp-2026-03-net-zero',
    category: { tr: 'Sürdürülebilirlik', en: 'Sustainability' },
    date: { tr: '15 Mart 2026', en: 'March 15, 2026' },
    readTime: { tr: '7 dk okuma', en: '7 min read' },
    title: {
      tr: 'Net Sıfır Taahhüdünden Eylem Planına: 5 Kritik Adım',
      en: 'From Net Zero Commitment to Action Plan: 5 Critical Steps',
    },
    excerpt: {
      tr: 'ESG hedeflerini bağlayıcı bir sermaye allokasyon çerçevesine dönüştürmek için pratik yol haritası.',
      en: 'A practical roadmap for translating ESG targets into a binding capital allocation framework.',
    },
    image:
      'https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    slug: 'net-zero-eylem-plani',
  },
];
