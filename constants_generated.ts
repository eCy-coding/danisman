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

export const GENERATED_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs-retail-2026',
    client: 'Fortune 500 Retailer',
    sector: { tr: 'Perakende', en: 'Retail' },
    challenge: {
      tr: '38 ülkede dağınık tedarik zinciri, birleşik talep sinyali olmadan operasyon.',
      en: 'Fragmented supply chain across 38 countries with no unified demand signal.',
    },
    solution: {
      tr: 'Snowflake + dbt üzerinde birleşik talep-sinyali lakehouse, 42 tahmin modeli (LightGBM + Prophet topluluğu).',
      en: 'Unified demand-signal lakehouse on Snowflake + dbt with 42 forecasting models (LightGBM + Prophet ensemble).',
    },
    result: {
      tr: '%240 ROI, stoksuzluk %61 azaldı, envanter devir hızı +%46.',
      en: '240% ROI, stockouts down 61%, inventory turnover +46%.',
    },
    description: {
      tr: '14 ay içinde 1.200+ mağazada birleşik veri platformu; 8.400 kategori yöneticisi için değişim yönetimi playbook.',
      en: '14-month rollout to 1,200+ stores; change-management playbook for 8,400 category managers.',
    },
    image:
      'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1200',
    category: { tr: 'Dijital Dönüşüm', en: 'Digital Transformation' },
    slug: 'global-retail-transformation',
  },
  {
    id: 'cs-fintech-2025',
    client: 'NeoBank Corp',
    sector: { tr: 'Finans', en: 'Finance' },
    challenge: {
      tr: '3 AB pazarında PSD2 + MiCA uyumlu neobank lansmanı, 9 aylık sermaye penceresi.',
      en: 'Launch a regulated neobank in 3 EU markets under PSD2 + MiCA with a 9-month runway.',
    },
    solution: {
      tr: 'Düzenleyici Program Ofisi (BaFin, ACPR, DNB) + 3 segment için onboarding funnels + viral katsayısı K = 1.42 büyüme motoru.',
      en: 'Regulatory Program Office (BaFin, ACPR, DNB) + 3-segment onboarding funnels + viral coefficient K = 1.42 growth engine.',
    },
    result: {
      tr: '6 ayda 1M kullanıcı, 0 düzenleyici yeniden başvuru, K = 1.42 viral katsayı.',
      en: '1M users in 6 months, zero regulatory re-submissions, viral coefficient K = 1.42.',
    },
    description: {
      tr: '12 kişilik uyum ekibi, 340 düzenleyici teslim, üç eşzamanlı pazara açılış.',
      en: '12-person compliance team, 340 regulatory artefacts, three simultaneous market launches.',
    },
    image:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200',
    category: { tr: 'Pazara Giriş', en: 'Market Entry' },
    slug: 'fintech-market-entry',
  },
  {
    id: 'cs-saas-2025',
    client: 'Vertical SaaS Platform',
    sector: { tr: 'Teknoloji', en: 'Technology' },
    challenge: {
      tr: 'Yıllık $40M ARR\'da CAC payback 22 aya çıktı, churn %14\'e tırmandı.',
      en: 'CAC payback ballooned to 22 months at $40M ARR; churn climbed to 14%.',
    },
    solution: {
      tr: 'Müşteri segmentasyonu yeniden tasarımı, ürün-led growth motoru, customer success rota haritası.',
      en: 'Customer segmentation redesign, product-led growth engine, customer success route map.',
    },
    result: {
      tr: 'CAC payback 22 → 9 ay, net revenue retention 92% → 124%, ARR 18 ayda 2.4×.',
      en: 'CAC payback 22 → 9 months, NRR 92% → 124%, ARR 2.4× in 18 months.',
    },
    description: {
      tr: '8 ay süren program; ürün, satış ve CS ekipleri tek bir CSAT-bağlı OKR çatısı altında.',
      en: '8-month program; product, sales, and CS teams unified under a single CSAT-bound OKR umbrella.',
    },
    image:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1200',
    category: { tr: 'Büyüme Stratejisi', en: 'Growth Strategy' },
    slug: 'vertical-saas-growth-engine',
  },
  {
    id: 'cs-manufacturing-2024',
    client: 'Industrial Manufacturer',
    sector: { tr: 'Üretim', en: 'Manufacturing' },
    challenge: {
      tr: '11 fabrikada OEE %58, kalitesizlik maliyeti yıllık $24M, kestirimci bakım yok.',
      en: 'OEE at 58% across 11 plants, $24M annual cost of poor quality, no predictive maintenance.',
    },
    solution: {
      tr: 'IIoT sensör fabrikası + edge ML kestirimci bakım + dijital ikiz simülasyon platformu.',
      en: 'IIoT sensor factory + edge ML predictive maintenance + digital-twin simulation platform.',
    },
    result: {
      tr: 'OEE 58% → 81%, COPQ -$18M, plansız duruş -%72.',
      en: 'OEE 58% → 81%, COPQ down $18M, unplanned downtime -72%.',
    },
    description: {
      tr: '18 ay içinde 11 fabrikanın tamamı entegre; 1.200 sensör, 47 ML modeli üretimde.',
      en: 'All 11 plants integrated in 18 months; 1,200 sensors, 47 ML models in production.',
    },
    image:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    category: { tr: 'Endüstri 4.0', en: 'Industry 4.0' },
    slug: 'industrial-iot-transformation',
  },
  {
    id: 'cs-healthcare-2024',
    client: 'Regional Hospital Network',
    sector: { tr: 'Sağlık', en: 'Healthcare' },
    challenge: {
      tr: '8 hastane, 14 farklı EHR, hasta kayıt süresi ortalama 23 dakika, klinisyen tükenmişlik %71.',
      en: '8 hospitals, 14 disparate EHRs, 23-minute average intake, 71% clinician burnout score.',
    },
    solution: {
      tr: 'EHR konsolidasyon (FHIR), klinik iş akışı yeniden tasarımı, klinisyen co-design programı.',
      en: 'EHR consolidation (FHIR), clinical workflow redesign, clinician co-design program.',
    },
    result: {
      tr: 'Hasta kayıt süresi 23 → 6 dakika, tükenmişlik %71 → %38, hasta memnuniyeti +%34 (HCAHPS).',
      en: 'Intake 23 → 6 min, burnout 71% → 38%, HCAHPS satisfaction +34%.',
    },
    description: {
      tr: '24 ay süren program; 4.200 klinisyen yeniden eğitildi, 8 hastane tek FHIR ağında.',
      en: '24-month program; 4,200 clinicians retrained, 8 hospitals on a unified FHIR fabric.',
    },
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
    category: { tr: 'Sağlık Dönüşümü', en: 'Healthcare Transformation' },
    slug: 'hospital-network-fhir-consolidation',
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
      tr: 'Yönetim kurullarından operasyonel süreçlere kadar AI\'nın kurumsal yapı üzerindeki dönüştürücü etkisi.',
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
      tr: 'Yapay Zeka Yatırımının ROI\'sini Hesaplamak: CFO Rehberi',
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
      tr: 'Teknoloji projelerinin %70\'i insani direnç nedeniyle başarısız olur. EcyPro\'nun ADAPT çerçevesiyle değişimi yönetin.',
      en: '70% of technology projects fail due to human resistance. Manage change with EcyPro\'s ADAPT framework.',
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
