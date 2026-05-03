import { 
  BarChart, 
  Users, 
  TrendingUp, 
  Globe, 

  Briefcase,
  Scale,
  ShieldCheck,
  Building2,
  Landmark,
  Container,
  Factory,
  Network,
  Cpu,
  BrainCircuit,
  Lightbulb,
  Handshake,
  GanttChart,
  Zap,
  Building,
  Calculator
} from 'lucide-react';

import { Service } from '../schemas/service';

// Removed manual interface in favor of Zod inference
// export interface Service { ... }

export const DEPARTMENTS = [
  { id: 'all', label: { tr: 'HEPSİ', en: 'ALL' } },
  { id: 'isletme', label: { tr: 'İŞLETME', en: 'BUSINESS' } },
  { id: 'ybs', label: { tr: 'YÖN. BİLİŞİM SİS.', en: 'MIS' } },
  { id: 'iktisat', label: { tr: 'İKTİSAT', en: 'ECONOMICS' } },
  { id: 'calisma', label: { tr: 'ÇALIŞMA EKO.', en: 'LABOR ECO.' } },
  { id: 'maliye', label: { tr: 'MALİYE', en: 'FINANCE' } },
  { id: 'kamu', label: { tr: 'KAMU YÖN.', en: 'PUBLIC ADM.' } },
  { id: 'uluslararasi', label: { tr: 'ULUS. İLİŞKİLER', en: 'INT. RELATIONS' } },
];

export const SERVICES: Service[] = [
  // --- İŞLETME (7 ITEMS) ---
  {
    id: 'stratejik-donusum',
    title: 'Stratejik Dönüşüm & Kurumsal Planlama',
    category: 'isletme',
    description: 'Belirsizlik ortamında rekabet avantajı sağlamak için oyun teorisi tabanlı senaryo planlama ve vizyoner yol haritaları.',
    icon: TrendingUp,
    link: '/services/strategic-transformation',
  },
  {
    id: 'ma-degerleme',
    title: 'Birleşme, Satın Alma (M&A) & Değerleme',
    category: 'isletme',
    description: 'Şirket değerleme, due diligence, birleşme sonrası entegrasyon (PMI) ve exit stratejileri.',
    icon: Handshake,
    link: '/services/mergers-acquisitions',
  },
  {
    id: 'aile-sirketleri',
    title: 'Aile Şirketleri Yönetişimi & Anayasa',
    category: 'isletme',
    description: 'Nesiller arası devir süreçleri, kurumsallaşma ve sürdürülebilir aile anayasasının hazırlanması.',
    icon: Users,
    link: '/services/family-business',
  },
  {
    id: 'operasyonel-mukemmellik',
    title: 'Operasyonel Mükemmellik & Tedarik Zinciri',
    category: 'isletme',
    description: 'Yalın üretim (Lean), Altı Sigma metodolojileri ve uçtan uca lojistik optimizasyonu.',
    icon: Factory,
    link: '/services/operational-excellence',
  },
  {
    id: 'noropazarlama',
    title: 'Nöropazarlama & Tüketici Deneyimi (CX)',
    category: 'isletme',
    description: 'Bilinçdışı tüketici davranışlarını analiz ederek, veri odaklı marka ve iletişim stratejileri.',
    icon: BrainCircuit,
    link: '/services/neuromarketing',
  },
  {
    id: 'insan-kaynaklari',
    title: 'İnsan Kaynakları & Org. Tasarım',
    category: 'isletme',
    description: 'Yetenek matrisleri, performans yönetim sistemleri ve çevik organizasyonel yapıların kurgulanması.',
    icon: GanttChart,
    link: '/services/hr-transformation',
  },
  {
    id: 'kriz-yonetimi',
    title: 'Kriz Yönetimi & İş Sürekliliği',
    category: 'isletme',
    description: 'Finansal veya operasyonel kriz anlarında acil eylem planları ve dayanıklılık (resilience) testleri.',
    icon: Zap,
    link: '/services/crisis-management',
  },

  // --- YÖNETİM BİLİŞİM SİSTEMLERİ (3 ITEMS) ---
  {
    id: 'yapay-zeka',
    title: 'Yapay Zeka (AI) & İş Analitiği',
    category: 'ybs',
    description: 'Makine öğrenmesi modelleri ile tahmine dayalı analizler ve yapay zeka entegrasyon stratejileri.',
    icon: Cpu,
    link: '/services/ai-analytics',
  },
  {
    id: 'dijital-teknoloji',
    title: 'Dijital Dönüşüm & Teknoloji Stratejisi',
    category: 'ybs',
    description: 'ERP seçimi, süreç otomasyonu (RPA) ve dijital olgunluk analizleri ile teknolojik kaldıraç.',
    icon: Network,
    link: '/services/digital-strategy',
  },
  {
    id: 'veri-yonetisimi',
    title: 'Veri Yönetişimi & KVKK/GDPR Uyum',
    category: 'ybs',
    description: 'Veri gizliliği, siber güvenlik yönetişimi ve yasal uyumluluk (ISO 27001) danışmanlığı.',
    icon: ShieldCheck,
    link: '/services/data-governance',
  },

  // --- İKTİSAT (4 ITEMS) ---
  {
    id: 'esg-yesil',
    title: 'ESG Stratejisi & Yeşil Mutabakat',
    category: 'iktisat',
    description: 'Karbon ayak izi raporlaması, sürdürülebilirlik stratejileri ve yeşil finansman erişimi.',
    icon: Globe,
    link: '/services/esg-strategy',
  },
  {
    id: 'yatirim-tesvik',
    title: 'Yatırım Teşvikleri & Hibe Yönetimi',
    category: 'iktisat',
    description: 'Devlet destekleri, Ar-Ge hibeleri ve proje bazlı yatırım teşvik belgesi süreçleri.',
    icon: Landmark,
    link: '/services/investment-incentives',
  },
  {
    id: 'makro-risk',
    title: 'Makroekonomik Risk & Piyasa Analizi',
    category: 'iktisat',
    description: 'Kur, faiz ve enflasyon projeksiyonları ile C-Level stratejik karar destek raporları.',
    icon: BarChart,
    link: '/services/macro-risk',
  },
  {
    id: 'rekabet-ekonomisi',
    title: 'Rekabet Ekonomisi & Regülasyon',
    category: 'iktisat',
    description: 'Antitröst incelemeleri, pazar hakimiyeti analizleri ve regülasyon uyum danışmanlığı.',
    icon: Scale,
    link: '/services/competition-economics',
  },

  // --- ÇALIŞMA EKONOMİSİ (3 ITEMS) ---
  {
    id: 'endustriyel',
    title: 'Endüstriyel İlişkiler & Sendika',
    category: 'calisma',
    description: 'Toplu iş sözleşmesi müzakereleri, sendikal ilişkiler yönetimi ve çalışma barışının korunması.',
    icon: Briefcase,
    link: '/services/industrial-relations',
  },
  {
    id: 'bordro-denetimi',
    title: 'Bordro Denetimi & İstihdam Teşvikleri',
    category: 'calisma',
    description: 'SGK prim teşviklerinden maksimum yararlanma, maliyet optimizasyonu ve bordro risk denetimi.',
    icon: Calculator,
    link: '/services/payroll-audit',
  },
  {
    id: 'isveren-markasi',
    title: 'Yetenek Yönetimi & İşveren Markası',
    category: 'calisma',
    description: 'Nitelikli işgücünü çekmek ve elde tutmak için stratejik işveren markası (Employer Branding) tasarımı.',
    icon: Lightbulb,
    link: '/services/employer-branding',
  },

  // --- ULUSLARARASI İLİŞKİLER (2 ITEMS) ---
  {
    id: 'pazara-giris',
    title: 'Uluslararası Pazara Giriş & İhracat',
    category: 'uluslararasi',
    description: 'Hedef pazar araştırması, distribütör bulma ve Turquality hazırlık süreçleri.',
    icon: Container,
    link: '/services/market-entry',
  },
  {
    id: 'global-diplomasi',
    title: 'Global Diplomasi & Ticari İstihbarat',
    category: 'uluslararasi',
    description: 'Jeopolitik risk haritaları, ticari istihbarat ve devletlerarası kriz senaryoları.',
    icon: Building,
    link: '/services/global-intelligence',
  },

  // --- KAMU YÖNETİMİ (2 ITEMS) ---
  {
    id: 'akilli-sehirler',
    title: 'Akıllı Şehirler & Kamu Politikaları',
    category: 'kamu',
    description: 'Yerel yönetimler için dijital şehircilik stratejileri ve etki analizi raporlaması.',
    icon: Building2,
    link: '/services/smart-cities',
  },
  {
    id: 'kurumsal-iliskiler',
    title: 'Kurumsal İlişkiler & Lobicilik (GR)',
    category: 'kamu',
    description: 'Ankara ve Brüksel nezdinde paydaş haritalama, mevzuat takibi ve stratejik temsil.',
    icon: Users, // Reusing Users or finding alternative like Handshake
    link: '/services/government-relations',
  }
];


