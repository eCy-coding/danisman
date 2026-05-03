import { ServiceCategory, CaseStudy, BlogPost, ValueProp, KpiItem, TrustLogo } from '../types/legacy_types';
import {
  Target,
  Users,
  Briefcase,
  Building2,
  Lightbulb,
  Zap,
  Layers,
  Globe,
  TrendingUp,
  Handshake,
  Factory,
  BrainCircuit,
  GanttChart,
  Cpu,
  Network,
  ShieldCheck,
  Landmark,
  BarChart,
  Scale,
  Calculator,
  Container,
  Building
} from 'lucide-react';
import { GENERATED_CASE_STUDIES, GENERATED_BLOG_POSTS } from '../../constants_generated';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'isletme',
    title: { tr: 'İşletme Yönetimi', en: 'Business Management' },
    description: {
      tr: 'Kurumsal yapınızı güçlendiren, operasyonel verimliliğinizi artıran ve sürdürülebilir büyümenizi sağlayan stratejik yönetim çözümleri.',
      en: 'Strategic management solutions that strengthen your corporate structure, increase operational efficiency, and ensure sustainable growth.',
    },
    items: [
      {
        id: 'stratejik-donusum',
        title: { tr: 'Stratejik Dönüşüm & Kurumsal Planlama', en: 'Strategic Transformation & Corp. Planning' },
        description: {
          tr: 'Belirsizlik ortamında rekabet avantajı sağlamak için oyun teorisi tabanlı senaryo planlama ve vizyoner yol haritaları.',
          en: 'Game theory-based scenario planning and visionary roadmaps to ensure competitive advantage in uncertain environments.',
        },
        icon: TrendingUp,
        link: '/services/strategic-transformation',
      },
      {
        id: 'ma-degerleme',
        title: { tr: 'Birleşme, Satın Alma (M&A) & Değerleme', en: 'M&A & Valuation' },
        description: {
          tr: 'Şirket değerleme, due diligence, birleşme sonrası entegrasyon (PMI) ve exit stratejileri.',
          en: 'Company valuation, due diligence, post-merger integration (PMI), and exit strategies.',
        },
        icon: Handshake,
        link: '/services/mergers-acquisitions',
      },
      {
        id: 'aile-sirketleri',
        title: { tr: 'Aile Şirketleri Yönetişimi & Anayasa', en: 'Family Business Governance' },
        description: {
          tr: 'Nesiller arası devir süreçleri, kurumsallaşma ve sürdürülebilir aile anayasasının hazırlanması.',
          en: 'Intergenerational transfer processes, institutionalization, and preparation of a sustainable family constitution.',
        },
        icon: Users,
        link: '/services/family-business',
      },
      {
        id: 'operasyonel-mukemmellik',
        title: { tr: 'Operasyonel Mükemmellik & Tedarik Zinciri', en: 'Operational Excellence & Supply Chain' },
        description: {
          tr: 'Yalın üretim (Lean), Altı Sigma metodolojileri ve uçtan uca lojistik optimizasyonu.',
          en: 'Lean manufacturing, Six Sigma methodologies, and end-to-end logistics optimization.',
        },
        icon: Factory,
        link: '/services/operational-excellence',
      },
      {
        id: 'noropazarlama',
        title: { tr: 'Nöropazarlama & Tüketici Deneyimi (CX)', en: 'Neuromarketing & CX' },
        description: {
          tr: 'Bilinçdışı tüketici davranışlarını analiz ederek, veri odaklı marka ve iletişim stratejileri.',
          en: 'Data-driven brand and communication strategies by analyzing subconscious consumer behaviors.',
        },
        icon: BrainCircuit,
        link: '/services/neuromarketing',
      },
      {
        id: 'insan-kaynaklari',
        title: { tr: 'İnsan Kaynakları & Org. Tasarım', en: 'HR & Org. Design' },
        description: {
          tr: 'Yetenek matrisleri, performans yönetim sistemleri ve çevik organizasyonel yapıların kurgulanması.',
          en: 'Talent matrices, performance management systems, and agile organizational structures.',
        },
        icon: GanttChart,
        link: '/services/hr-transformation',
      },
      {
        id: 'kriz-yonetimi',
        title: { tr: 'Kriz Yönetimi & İş Sürekliliği', en: 'Crisis Management & Business Continuity' },
        description: {
          tr: 'Finansal veya operasyonel kriz anlarında acil eylem planları ve dayanıklılık (resilience) testleri.',
          en: 'Emergency action plans and resilience tests during financial or operational crises.',
        },
        icon: Zap,
        link: '/services/crisis-management',
      },
    ],
  },
  {
    id: 'ybs',
    title: { tr: 'Yönetim Bilişim Sistemleri', en: 'Management Information Systems' },
    description: {
      tr: 'Dijital dönüşüm yolculuğunuzda teknolojik kaldıraç etkisi yaratan yenilikçi çözümler.',
      en: 'Innovative solutions that create leverage in your digital transformation journey.',
    },
    items: [
      {
        id: 'yapay-zeka',
        title: { tr: 'Yapay Zeka (AI) & İş Analitiği', en: 'AI & Business Analytics' },
        description: {
          tr: 'Makine öğrenmesi modelleri ile tahmine dayalı analizler ve yapay zeka entegrasyon stratejileri.',
          en: 'Predictive analytics with machine learning models and AI integration strategies.',
        },
        icon: Cpu,
        link: '/services/ai-analytics',
      },
      {
        id: 'dijital-teknoloji',
        title: { tr: 'Dijital Dönüşüm & Teknoloji Stratejisi', en: 'Digital Transformation Strategy' },
        description: {
          tr: 'ERP seçimi, süreç otomasyonu (RPA) ve dijital olgunluk analizleri ile teknolojik kaldıraç.',
          en: 'ERP selection, process automation (RPA), and digital maturity analyses.',
        },
        icon: Network,
        link: '/services/digital-strategy',
      },
      {
        id: 'veri-yonetisimi',
        title: { tr: 'Veri Yönetişimi & KVKK/GDPR Uyum', en: 'Data Governance & Compliance' },
        description: {
          tr: 'Veri gizliliği, siber güvenlik yönetişimi ve yasal uyumluluk (ISO 27001) danışmanlığı.',
          en: 'Data privacy, cybersecurity governance, and legal compliance (ISO 27001) consulting.',
        },
        icon: ShieldCheck,
        link: '/services/data-governance',
      },
    ],
  },
  {
    id: 'iktisat',
    title: { tr: 'İktisat & Finans', en: 'Economics & Finance' },
    description: {
      tr: 'Küresel ekonomik konjonktürü analiz ederek finansal risklerinizi yönetmenizi sağlayan uzman çözümler.',
      en: 'Expert solutions that enable you to manage your financial risks by analyzing the global economic conjuncture.',
    },
    items: [
      {
        id: 'esg-yesil',
        title: { tr: 'ESG Stratejisi & Yeşil Mutabakat', en: 'ESG Strategy & Green Deal' },
        description: {
          tr: 'Karbon ayak izi raporlaması, sürdürülebilirlik stratejileri ve yeşil finansman erişimi.',
          en: 'Carbon footprint reporting, sustainability strategies, and access to green finance.',
        },
        icon: Globe,
        link: '/services/esg-strategy',
      },
      {
        id: 'yatirim-tesvik',
        title: { tr: 'Yatırım Teşvikleri & Hibe Yönetimi', en: 'Investment Incentives & Grants' },
        description: {
          tr: 'Devlet destekleri, Ar-Ge hibeleri ve proje bazlı yatırım teşvik belgesi süreçleri.',
          en: 'Government grants, R&D incentives, and project-based investment incentive certificate processes.',
        },
        icon: Landmark,
        link: '/services/investment-incentives',
      },
      {
        id: 'makro-risk',
        title: { tr: 'Makroekonomik Risk & Piyasa Analizi', en: 'Macroeconomic Risk Analysis' },
        description: {
          tr: 'Kur, faiz ve enflasyon projeksiyonları ile C-Level stratejik karar destek raporları.',
          en: 'Exchange rate, interest rate, and inflation projections with C-Level strategic decision support reports.',
        },
        icon: BarChart,
        link: '/services/macro-risk',
      },
      {
        id: 'rekabet-ekonomisi',
        title: { tr: 'Rekabet Ekonomisi & Regülasyon', en: 'Competition Economics' },
        description: {
          tr: 'Antitröst incelemeleri, pazar hakimiyeti analizleri ve regülasyon uyum danışmanlığı.',
          en: 'Antitrust reviews, market dominance analyses, and regulatory compliance consulting.',
        },
        icon: Scale,
        link: '/services/competition-economics',
      },
    ],
  },
  {
    id: 'calisma',
    title: { tr: 'Çalışma Ekonomisi', en: 'Labor Economics' },
    description: {
      tr: 'İşgücü piyasası dinamiklerini optimize eden ve işveren markanızı güçlendiren çözümler.',
      en: 'Solutions that optimize labor market dynamics and strengthen your employer brand.',
    },
    items: [
      {
        id: 'endustriyel',
        title: { tr: 'Endüstriyel İlişkiler & Sendika', en: 'Industrial Relations & Union' },
        description: {
          tr: 'Toplu iş sözleşmesi müzakereleri, sendikal ilişkiler yönetimi ve çalışma barışının korunması.',
          en: 'Collective bargaining negotiations, union relations management, and preservation of labor peace.',
        },
        icon: Briefcase,
        link: '/services/industrial-relations',
      },
      {
        id: 'bordro-denetimi',
        title: { tr: 'Bordro Denetimi & İstihdam Teşvikleri', en: 'Payroll Audit & Incentives' },
        description: {
          tr: 'SGK prim teşviklerinden maksimum yararlanma, maliyet optimizasyonu ve bordro risk denetimi.',
          en: 'Maximizing SSI premium incentives, cost optimization, and payroll risk audit.',
        },
        icon: Calculator,
        link: '/services/payroll-audit',
      },
      {
        id: 'isveren-markasi',
        title: { tr: 'Yetenek Yönetimi & İşveren Markası', en: 'Talent Mgmt & Employer Brand' },
        description: {
          tr: 'Nitelikli işgücünü çekmek ve elde tutmak için stratejik işveren markası (Employer Branding) tasarımı.',
          en: 'Strategic employer branding design to attract and retain qualified workforce.',
        },
        icon: Lightbulb,
        link: '/services/employer-branding',
      },
    ],
  },
  {
    id: 'uluslararasi',
    title: { tr: 'Uluslararası İlişkiler', en: 'International Relations' },
    description: {
      tr: 'Global pazarlarda varlık göstermeniz ve jeopolitik riskleri yönetmeniz için stratejik rehberlik.',
      en: 'Strategic guidance for establishing presence in global markets and managing geopolitical risks.',
    },
    items: [
      {
        id: 'pazara-giris',
        title: { tr: 'Uluslararası Pazara Giriş & İhracat', en: 'Market Entry & Export' },
        description: {
          tr: 'Hedef pazar araştırması, distribütör bulma ve Turquality hazırlık süreçleri.',
          en: 'Target market research, finding distributors, and Turquality preparation processes.',
        },
        icon: Container,
        link: '/services/market-entry',
      },
      {
        id: 'global-diplomasi',
        title: { tr: 'Global Diplomasi & Ticari İstihbarat', en: 'Global Diplomacy & Intelligence' },
        description: {
          tr: 'Jeopolitik risk haritaları, ticari istihbarat ve devletlerarası kriz senaryoları.',
          en: 'Geopolitical risk maps, commercial intelligence, and interstate crisis scenarios.',
        },
        icon: Building,
        link: '/services/global-intelligence',
      },
    ],
  },
  {
    id: 'kamu',
    title: { tr: 'Kamu Yönetimi', en: 'Public Administration' },
    description: {
      tr: 'Demokratik, şeffaf ve verimli kamu yönetimi süreçleri için politika tasarımı ve danışmanlık.',
      en: 'Policy design and consulting for democratic, transparent, and efficient public administration processes.',
    },
    items: [
      {
        id: 'akilli-sehirler',
        title: { tr: 'Akıllı Şehirler & Kamu Politikaları', en: 'Smart Cities & Public Policy' },
        description: {
          tr: 'Yerel yönetimler için dijital şehircilik stratejileri ve etki analizi raporlaması.',
          en: 'Digital urbanism strategies and impact analysis reporting for local governments.',
        },
        icon: Building2,
        link: '/services/smart-cities',
      },
      {
        id: 'kurumsal-iliskiler',
        title: { tr: 'Kurumsal İlişkiler & Lobicilik (GR)', en: 'Gov. Relations & Lobbying' },
        description: {
          tr: 'Ankara ve Brüksel nezdinde paydaş haritalama, mevzuat takibi ve stratejik temsil.',
          en: 'Stakeholder mapping, legislative monitoring, and strategic representation in Ankara and Brussels.',
        },
        icon: Users,
        link: '/services/government-relations',
      },
    ],
  }
];

export const VALUE_PROPS: ValueProp[] = [
  {
    id: 'v1',
    title: { tr: 'Stratejik Vizyon', en: 'Strategic Vision' },
    description: {
      tr: 'Günü kurtaran taktikler yerine, kurumunuzun geleceğini inşa eden bütüncül ve sürdürülebilir büyüme stratejileri geliştiriyoruz.',
      en: "Instead of short-term tactics, we develop holistic and sustainable growth strategies that build your organization's future.",
    },
    icon: Target,
  },
  {
    id: 'v2',
    title: { tr: 'İnsan Odaklı Yönetim', en: 'Human-Centric Management' },
    description: {
      tr: 'Teknolojik dönüşümü yönetirken insan faktörünü merkeze alıyor, kültürel adaptasyonu ve çalışan bağlılığını esas alıyoruz.',
      en: 'While managing technological transformation, we put the human factor at the center, basing our approach on cultural adaptation and employee engagement.',
    },
    icon: Users,
  },
  {
    id: 'v3',
    title: { tr: 'Saha Deneyimi', en: 'Field Experience' },
    description: {
      tr: 'Sadece teorik modelleri değil, farklı sektörlerde test edilmiş ve başarısı kanıtlanmış pratik uygulama yöntemlerini sunuyoruz.',
      en: 'We offer not just theoretical models, but practical application methods tested and proven successful across different sectors.',
    },
    icon: Layers,
  },
  {
    id: 'v4',
    title: { tr: 'Dijital Yetkinlik', en: 'Digital Competence' },
    description: {
      tr: 'Geleneksel iş modellerini modern dijital araçlarla entegre ederek rekabet avantajı ve operasyonel hız yaratmanızı sağlıyoruz.',
      en: 'We enable you to create competitive advantage and operational speed by integrating traditional business models with modern digital tools.',
    },
    icon: Globe,
  },
];

export const KPI_ITEMS: KpiItem[] = [
  {
    id: 'kpi1',
    value: 120,
    suffix: '+',
    label: { tr: 'Tamamlanan Proje', en: 'Projects Completed' },
    helperText: {
      tr: 'Stratejik yönetim ve danışmanlık',
      en: 'Strategic management and consulting',
    },
    category: 'consulting',
  },
  {
    id: 'kpi2',
    value: 85,
    suffix: '',
    label: { tr: 'Yönetilen Etkinlik', en: 'Events Managed' },
    helperText: { tr: 'Kurumsal zirveler ve lansmanlar', en: 'Corporate summits and launches' },
    category: 'events',
  },
  {
    id: 'kpi3',
    value: 98,
    suffix: '%',
    label: { tr: 'Müşteri Memnuniyeti', en: 'Client Satisfaction' },
    helperText: { tr: 'Bağımsız anket sonuçlarına göre', en: 'According to independent surveys' },
    category: 'consulting',
  },
  {
    id: 'kpi4',
    value: 5000,
    suffix: '+',
    label: { tr: 'Eğitim Saati', en: 'Training Hours' },
    helperText: {
      tr: 'Liderlik ve gelişim programları',
      en: 'Leadership and development programs',
    },
    category: 'digital',
  },
];

export const CASE_STUDIES: CaseStudy[] = GENERATED_CASE_STUDIES as unknown as CaseStudy[];
export const BLOG_POSTS: BlogPost[] = GENERATED_BLOG_POSTS as unknown as BlogPost[];

export const TRUST_LOGOS: TrustLogo[] = [
  {
    id: 'l1',
    name: 'Holding',
    sector: { tr: 'Holding', en: 'Holding' },
    alt: { tr: 'Holding Logo', en: 'Holding Logo' },
  },
  {
    id: 'l2',
    name: 'Finance',
    sector: { tr: 'Finans', en: 'Finance' },
    alt: { tr: 'Perakende Logo', en: 'Retail Logo' },
  },
  {
    id: 'l3',
    name: 'Construction',
    sector: { tr: 'İnşaat', en: 'Construction' },
    alt: { tr: 'İnşaat Logo', en: 'Construction Logo' },
  },
  {
    id: 'l4',
    name: 'Tech',
    sector: { tr: 'Teknoloji', en: 'Tech' },
    alt: { tr: 'Teknoloji Logo', en: 'Tech Logo' },
  },
  {
    id: 'l5',
    name: 'Retail',
    sector: { tr: 'Perakende', en: 'Retail' },
    alt: { tr: 'Perakende Logo', en: 'Retail Logo' },
  },
];
