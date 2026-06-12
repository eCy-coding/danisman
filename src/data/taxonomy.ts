/**
 * Perspektifler taxonomy — single source of truth (istek.md v2 §PHASE 1).
 *
 * - 10 closed categories shared by articles AND case studies (fixes BUG-11).
 * - Controlled tag vocabulary (≤60). Authors cannot mint tags: the blog index
 *   generator FAILS the build when it meets a tag or category that is neither
 *   in the vocabulary nor in the merge maps below.
 * - Merge maps cover 100% of the 2026-06-11 content inventory
 *   (28 raw category strings, 108 raw tags — brain/perspektifler/content-inventory.csv).
 */
import type { BlogCategory } from '@/types/blog';

export interface CategoryDef {
  slug: string;
  /** Canonical TR label — must match the BlogCategory union. */
  label: BlogCategory;
  labelEn: string;
}

export const CATEGORIES: CategoryDef[] = [
  { slug: 'strateji', label: 'Strateji', labelEn: 'Strategy' },
  { slug: 'yapay-zeka-teknoloji', label: 'Yapay Zeka & Teknoloji', labelEn: 'AI & Technology' },
  { slug: 'finans-ekonomi', label: 'Finans & Ekonomi', labelEn: 'Finance & Economy' },
  { slug: 'insan-organizasyon', label: 'İnsan & Organizasyon', labelEn: 'People & Organization' },
  { slug: 'operasyon', label: 'Operasyon', labelEn: 'Operations' },
  { slug: 'pazarlama-cx', label: 'Pazarlama & CX', labelEn: 'Marketing & CX' },
  { slug: 'global-vizyon', label: 'Global Vizyon', labelEn: 'Global Vision' },
  { slug: 'kamu-esg', label: 'Kamu & ESG', labelEn: 'Public & ESG' },
  { slug: 'liderlik', label: 'Liderlik', labelEn: 'Leadership' },
  { slug: 'ma-degerleme', label: 'M&A & Değerleme', labelEn: 'M&A & Valuation' },
];

export const CATEGORY_BY_SLUG: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);
export const CATEGORY_BY_LABEL: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c]),
);

/** Raw category strings found in content → canonical TR label. */
export const CATEGORY_MERGE_MAP: Record<string, BlogCategory> = {
  'AI & Analitik': 'Yapay Zeka & Teknoloji',
  'Aile Şirketleri': 'İnsan & Organizasyon',
  Analitik: 'Yapay Zeka & Teknoloji',
  Danışmanlık: 'Strateji',
  'Dijital Dönüşüm': 'Yapay Zeka & Teknoloji',
  'ESG & Sürdürülebilirlik': 'Kamu & ESG',
  'Endüstriyel İlişkiler': 'İnsan & Organizasyon',
  Finance: 'Finans & Ekonomi',
  Finans: 'Finans & Ekonomi',
  'KVKK & Regülasyon': 'Kamu & ESG',
  'M&A & Strateji': 'M&A & Değerleme',
  'Operasyonel Verimlilik': 'Operasyon',
  Pazarlama: 'Pazarlama & CX',
  'Risk & Kriz Yönetimi': 'Strateji',
  'Stratejik Danışmanlık': 'Strateji',
  Teknoloji: 'Yapay Zeka & Teknoloji',
  'Yapay Zeka': 'Yapay Zeka & Teknoloji',
  'İnsan Kaynakları': 'İnsan & Organizasyon',
};

export type PostFormat = 'makale' | 'vaka-analizi' | 'rapor' | 'arastirma' | 'founder-letter';

export const FORMATS: { slug: PostFormat; label: string; labelEn: string }[] = [
  { slug: 'makale', label: 'Makale', labelEn: 'Article' },
  { slug: 'vaka-analizi', label: 'Vaka Analizi', labelEn: 'Case Study' },
  { slug: 'rapor', label: 'Rapor', labelEn: 'Report' },
  { slug: 'arastirma', label: 'Araştırma', labelEn: 'Research' },
  { slug: 'founder-letter', label: 'Founder Letter', labelEn: 'Founder Letter' },
];

export interface TagDef {
  slug: string;
  labelTr: string;
  labelEn: string;
}

/** Controlled vocabulary — ≤60 terms; quarterly review is the only way in. */
export const TAG_VOCABULARY: TagDef[] = [
  { slug: 'yapay-zeka', labelTr: 'Yapay Zeka', labelEn: 'Artificial Intelligence' },
  { slug: 'uretken-ai', labelTr: 'Üretken AI', labelEn: 'Generative AI' },
  { slug: 'tahminleme', labelTr: 'Tahminleme & Analitik', labelEn: 'Forecasting & Analytics' },
  { slug: 'mlops', labelTr: 'MLOps & DevOps', labelEn: 'MLOps & DevOps' },
  { slug: 'dijital-donusum', labelTr: 'Dijital Dönüşüm', labelEn: 'Digital Transformation' },
  { slug: 'kpi', labelTr: 'KPI & Performans Ölçümü', labelEn: 'KPIs & Performance' },
  { slug: 'roi', labelTr: 'ROI', labelEn: 'ROI' },
  { slug: 'ecyverse', labelTr: 'eCyverse', labelEn: 'eCyverse' },
  { slug: 'kurumsallasma', labelTr: 'Kurumsallaşma', labelEn: 'Corporatization' },
  { slug: 'kurumsal-yonetisim', labelTr: 'Kurumsal Yönetişim', labelEn: 'Corporate Governance' },
  { slug: 'nesil-gecisi', labelTr: 'Nesil Geçişi & Veraset', labelEn: 'Succession Planning' },
  { slug: 'aile-sirketleri', labelTr: 'Aile Şirketleri', labelEn: 'Family Business' },
  { slug: 'aile-anayasasi', labelTr: 'Aile Anayasası', labelEn: 'Family Constitution' },
  { slug: 'danismanlik', labelTr: 'Danışmanlık', labelEn: 'Consulting' },
  { slug: 'fiyatlandirma', labelTr: 'Ücretlendirme & Fiyatlandırma', labelEn: 'Fees & Pricing' },
  { slug: 'alti-sigma', labelTr: 'Altı Sigma', labelEn: 'Six Sigma' },
  { slug: 'yalin-operasyon', labelTr: 'Yalın Operasyon', labelEn: 'Lean Operations' },
  {
    slug: 'operasyonel-verimlilik',
    labelTr: 'Operasyonel Verimlilik',
    labelEn: 'Operational Excellence',
  },
  { slug: 'surec-optimizasyonu', labelTr: 'Süreç Optimizasyonu', labelEn: 'Process Optimization' },
  { slug: 'uretim', labelTr: 'Üretim', labelEn: 'Manufacturing' },
  { slug: 'proje-yonetimi', labelTr: 'Proje Yönetimi', labelEn: 'Project Management' },
  { slug: 'ceviklik', labelTr: 'Çeviklik & Agile', labelEn: 'Agility & Agile' },
  { slug: 'degisim-yonetimi', labelTr: 'Değişim Yönetimi', labelEn: 'Change Management' },
  { slug: 'esg', labelTr: 'ESG & Sürdürülebilirlik', labelEn: 'ESG & Sustainability' },
  { slug: 'karbon-yonetimi', labelTr: 'Karbon Yönetimi', labelEn: 'Carbon Management' },
  { slug: 'veri-koruma', labelTr: 'KVKK & Veri Koruma', labelEn: 'Data Privacy (KVKK/GDPR)' },
  { slug: 'regulasyon-uyum', labelTr: 'Regülasyon & Uyum', labelEn: 'Regulation & Compliance' },
  { slug: 'ab-regulasyonu', labelTr: 'AB Regülasyonu', labelEn: 'EU Regulation' },
  {
    slug: 'endustriyel-iliskiler',
    labelTr: 'Endüstriyel İlişkiler',
    labelEn: 'Industrial Relations',
  },
  { slug: 'is-hukuku', labelTr: 'İş Hukuku', labelEn: 'Labor Law' },
  { slug: 'insan-kaynaklari', labelTr: 'İnsan Kaynakları', labelEn: 'Human Resources' },
  { slug: 'yetenek-yonetimi', labelTr: 'Yetenek Yönetimi', labelEn: 'Talent Management' },
  { slug: 'calisan-deneyimi', labelTr: 'Çalışan Deneyimi', labelEn: 'Employee Experience' },
  { slug: 'isveren-markasi', labelTr: 'İşveren Markası', labelEn: 'Employer Brand' },
  { slug: 'marka-yonetimi', labelTr: 'Marka & İtibar Yönetimi', labelEn: 'Brand & Reputation' },
  { slug: 'musteri-deneyimi', labelTr: 'Müşteri Deneyimi', labelEn: 'Customer Experience' },
  {
    slug: 'uluslararasilasma',
    labelTr: 'Uluslararasılaşma & İhracat',
    labelEn: 'Internationalization & Export',
  },
  { slug: 'yatirim', labelTr: 'Yatırım', labelEn: 'Investment' },
  { slug: 'cfo', labelTr: 'CFO Gündemi', labelEn: 'CFO Agenda' },
  { slug: 'degerleme', labelTr: 'Değerleme', labelEn: 'Valuation' },
  { slug: 'due-diligence', labelTr: 'Due Diligence', labelEn: 'Due Diligence' },
  { slug: 'pmi', labelTr: 'Birleşme Sonrası Entegrasyon', labelEn: 'Post-Merger Integration' },
  { slug: 'risk-yonetimi', labelTr: 'Risk & Kriz Yönetimi', labelEn: 'Risk & Crisis Management' },
  { slug: 'kobi', labelTr: 'KOBİ', labelEn: 'SME' },
  { slug: 'inovasyon', labelTr: 'İnovasyon', labelEn: 'Innovation' },
  { slug: 'kurumsal-iletisim', labelTr: 'Kurumsal İletişim', labelEn: 'Corporate Communications' },
];

export const TAG_BY_SLUG: Record<string, TagDef> = Object.fromEntries(
  TAG_VOCABULARY.map((t) => [t.slug, t]),
);

/**
 * Raw inventory tag → canonical vocabulary slug, or null when the tag is
 * retired (duplicates a category or became a format flag). Keys are the exact
 * strings found in content; lookups should also try a fold-normalized pass.
 */
export const TAG_MERGE_MAP: Record<string, string | null> = {
  // — AI / technology cluster
  ai: 'yapay-zeka',
  AI: 'yapay-zeka',
  'Artificial Intelligence': 'yapay-zeka',
  'yapay zeka': 'yapay-zeka',
  'Yapay Zeka': 'yapay-zeka',
  'kurumsal ai': 'yapay-zeka',
  GPT: 'uretken-ai',
  LLM: 'uretken-ai',
  'generative ai': 'uretken-ai',
  Forecasting: 'tahminleme',
  'Predictive Analytics': 'tahminleme',
  MLOps: 'mlops',
  DevOps: 'mlops',
  'dijital dönüşüm': 'dijital-donusum',
  'Dijital Dönüşüm': 'dijital-donusum',
  Dönüşüm: 'dijital-donusum',
  ecyverse: 'ecyverse',
  // — measurement
  KPI: 'kpi',
  performans: 'kpi',
  ölçüm: 'kpi',
  ROI: 'roi',
  // — governance / family business
  kurumsal: 'kurumsallasma',
  kurumsallasma: 'kurumsallasma',
  Yönetim: 'kurumsal-yonetisim',
  yonetim: 'kurumsal-yonetisim',
  Yönetişim: 'kurumsal-yonetisim',
  'yonetim-kurulu': 'kurumsal-yonetisim',
  Devir: 'nesil-gecisi',
  Veraset: 'nesil-gecisi',
  'Nesil Geçişi': 'nesil-gecisi',
  'Sermaye Devri': 'nesil-gecisi',
  'Aile Şirketi': 'aile-sirketleri',
  'aile-sirketi': 'aile-sirketleri',
  'Aile Anayasası': 'aile-anayasasi',
  // — consulting business
  consulting: 'danismanlik',
  danismanlik: 'danismanlik',
  'danışmanlık hizmetleri': 'danismanlik',
  'stratejik danışmanlık': 'danismanlik',
  'premium-consulting': 'danismanlik',
  'seçim kriterleri': 'danismanlik',
  'danışmanlık ücretleri': 'fiyatlandirma',
  fiyatlandırma: 'fiyatlandirma',
  retainer: 'fiyatlandirma',
  // — operations
  'six sigma': 'alti-sigma',
  'six-sigma': 'alti-sigma',
  lean: 'yalin-operasyon',
  'operasyonel verimlilik': 'operasyonel-verimlilik',
  'operasyonel-mukemmellik': 'operasyonel-verimlilik',
  'süreç optimizasyonu': 'surec-optimizasyonu',
  Production: 'uretim',
  uretim: 'uretim',
  PMO: 'proje-yonetimi',
  PMP: 'proje-yonetimi',
  'proje yönetimi': 'proje-yonetimi',
  agile: 'ceviklik',
  'Değişim Yönetimi': 'degisim-yonetimi',
  // — ESG / regulation
  ESG: 'esg',
  Sürdürülebilirlik: 'esg',
  CSRD: 'esg',
  CBAM: 'karbon-yonetimi',
  Karbon: 'karbon-yonetimi',
  'Emisyon Hesabı': 'karbon-yonetimi',
  'Scope 3': 'karbon-yonetimi',
  KVKK: 'veri-koruma',
  'veri koruma': 'veri-koruma',
  GDPR: 'veri-koruma',
  regülasyon: 'regulasyon-uyum',
  uyum: 'regulasyon-uyum',
  'AB Regulasyon': 'ab-regulasyonu',
  'AB regülasyon': 'ab-regulasyonu',
  'Türkiye-AB': 'ab-regulasyonu',
  // — people & organization
  arabuluculuk: 'endustriyel-iliskiler',
  uyusmazlik: 'endustriyel-iliskiler',
  'endustriyel-iliskiler': 'endustriyel-iliskiler',
  'is-hukuku': 'is-hukuku',
  'hr strateji': 'insan-kaynaklari',
  'insan kaynakları': 'insan-kaynaklari',
  'insan-kaynaklari': 'insan-kaynaklari',
  'İnsan Kaynakları': 'insan-kaynaklari',
  'yetenek yönetimi': 'yetenek-yonetimi',
  'çalışan deneyimi': 'calisan-deneyimi',
  'işveren markası': 'isveren-markasi',
  // — marketing & brand
  'Marka Yönetimi': 'marka-yonetimi',
  itibar: 'marka-yonetimi',
  'Müşteri Hizmetleri': 'musteri-deneyimi',
  iletisim: 'kurumsal-iletisim',
  // — global / finance / M&A
  Globalleşme: 'uluslararasilasma',
  uluslararasi: 'uluslararasilasma',
  'cross-border': 'uluslararasilasma',
  İhracat: 'uluslararasilasma',
  Investment: 'yatirim',
  Yatırım: 'yatirim',
  CFO: 'cfo',
  degerleme: 'degerleme',
  'due-diligence': 'due-diligence',
  entegrasyon: 'pmi',
  'post-merger-integration': 'pmi',
  'kriz-yonetimi': 'risk-yonetimi',
  risk: 'risk-yonetimi',
  kobi: 'kobi',
  İnovasyon: 'inovasyon',
  // — retired: duplicates a category or became a format flag
  strateji: null,
  Strateji: null,
  'kurumsal-strateji': null,
  vizyon: null,
  Liderlik: null,
  'm-and-a': null,
  'founder-notes': null, // → format: 'founder-letter'
};

/** Case-study industry → shared category slug (BUG-11 unification, D-5). */
export const CASE_STUDY_CATEGORY_MAP: Record<string, string> = {
  Technology: 'yapay-zeka-teknoloji',
  'Family Business': 'insan-organizasyon',
  Manufacturing: 'operasyon',
  'M&A Advisory': 'ma-degerleme',
  Organizational: 'insan-organizasyon',
  Culture: 'insan-organizasyon',
};

export const MAX_TAGS_PER_POST = 5;
export const MAX_FEATURED = 4;
