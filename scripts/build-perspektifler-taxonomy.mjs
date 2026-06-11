/**
 * Phase 1 — Perspektifler taxonomy generator (source of truth for the data layer).
 *
 * Emits:
 *   src/data/perspektifler/taxonomy.json   (10 closed categories + <=60 controlled tags)
 *   src/data/perspektifler/merge-map.json   (108 raw tags -> survivor | __category__ | __drop__)
 *   src/data/perspektifler/redirects.json   (every retired URL -> survivor/category, <=1 hop)
 *
 * Slug rule: lowercase ASCII (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u), hyphen separator.
 * Run: node scripts/build-perspektifler-taxonomy.mjs
 * Validate: node scripts/check-taxonomy.mjs
 */
import fs from 'fs';
import path from 'path';

const OUT = 'src/data/perspektifler';
fs.mkdirSync(OUT, { recursive: true });

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/i̇/g, 'i')
    .replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/&/g, ' ve ').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// ── 10 CLOSED CATEGORIES (spec 1.1) ───────────────────────────────────────────
const CATEGORIES = [
  { slug: 'strateji', label_tr: 'Strateji', label_en: 'Strategy' },
  { slug: 'yapay-zeka-teknoloji', label_tr: 'Yapay Zeka & Teknoloji', label_en: 'AI & Technology' },
  { slug: 'finans-ekonomi', label_tr: 'Finans & Ekonomi', label_en: 'Finance & Economy' },
  { slug: 'insan-organizasyon', label_tr: 'İnsan & Organizasyon', label_en: 'People & Organization' },
  { slug: 'operasyon', label_tr: 'Operasyon', label_en: 'Operations' },
  { slug: 'pazarlama-cx', label_tr: 'Pazarlama & Müşteri Deneyimi', label_en: 'Marketing & CX' },
  { slug: 'global-vizyon', label_tr: 'Global Vizyon', label_en: 'Global Vision' },
  { slug: 'kamu-esg', label_tr: 'Kamu & ESG', label_en: 'Public & ESG' },
  { slug: 'liderlik', label_tr: 'Liderlik', label_en: 'Leadership' },
  { slug: 'ma-degerleme', label_tr: 'M&A & Değerleme', label_en: 'M&A & Valuation' },
];

// ── 21 RAW CATEGORIES -> 10 (BUG-11 unify blog + case studies) ────────────────
const CAT_MERGE = {
  'Strateji': 'strateji',
  'Stratejik Danışmanlık': 'strateji',
  'Danışmanlık': 'strateji',
  'Risk & Kriz Yönetimi': 'strateji',
  'AI & Analitik': 'yapay-zeka-teknoloji',
  'Analitik': 'yapay-zeka-teknoloji',
  'Yapay Zeka': 'yapay-zeka-teknoloji',
  'Teknoloji': 'yapay-zeka-teknoloji',
  'Dijital Dönüşüm': 'yapay-zeka-teknoloji',
  'Finans': 'finans-ekonomi',
  'Finance': 'finans-ekonomi',
  'Aile Şirketleri': 'insan-organizasyon',
  'İnsan Kaynakları': 'insan-organizasyon',
  'Endüstriyel İlişkiler': 'insan-organizasyon',
  'Operasyonel Verimlilik': 'operasyon',
  'Operasyon': 'operasyon',
  'Pazarlama': 'pazarlama-cx',
  'ESG & Sürdürülebilirlik': 'kamu-esg',
  'KVKK & Regülasyon': 'kamu-esg',
  'Liderlik': 'liderlik',
  'M&A & Strateji': 'ma-degerleme',
};

// ── CONTROLLED TAG VOCABULARY (survivors) — slug -> {label_tr, label_en, category}
const VOCAB = {
  // strateji
  'kurumsal-strateji': ['Kurumsal Strateji', 'Corporate Strategy', 'strateji'],
  'danismanlik': ['Danışmanlık', 'Consulting', 'strateji'],
  'danismanlik-fiyatlandirma': ['Danışmanlık Fiyatlandırma', 'Consulting Pricing', 'strateji'],
  'vizyon': ['Vizyon', 'Vision', 'strateji'],
  'degisim-yonetimi': ['Değişim Yönetimi', 'Change Management', 'strateji'],
  'risk-yonetimi': ['Risk Yönetimi', 'Risk Management', 'strateji'],
  'kriz-yonetimi': ['Kriz Yönetimi', 'Crisis Management', 'strateji'],
  'inovasyon': ['İnovasyon', 'Innovation', 'strateji'],
  // yapay-zeka-teknoloji
  'yapay-zeka': ['Yapay Zeka', 'Artificial Intelligence', 'yapay-zeka-teknoloji'],
  'uretken-yapay-zeka': ['Üretken Yapay Zeka', 'Generative AI', 'yapay-zeka-teknoloji'],
  'dijital-donusum': ['Dijital Dönüşüm', 'Digital Transformation', 'yapay-zeka-teknoloji'],
  'mlops': ['MLOps', 'MLOps', 'yapay-zeka-teknoloji'],
  'veri-analitigi': ['Veri Analitiği', 'Data Analytics', 'yapay-zeka-teknoloji'],
  'tahminleme': ['Tahminleme', 'Forecasting', 'yapay-zeka-teknoloji'],
  'kpi': ['KPI', 'KPI', 'yapay-zeka-teknoloji'],
  // finans-ekonomi
  'roi': ['ROI', 'ROI', 'finans-ekonomi'],
  'cfo': ['CFO Gündemi', 'CFO Agenda', 'finans-ekonomi'],
  'yatirim': ['Yatırım', 'Investment', 'finans-ekonomi'],
  // insan-organizasyon
  'insan-kaynaklari': ['İnsan Kaynakları', 'Human Resources', 'insan-organizasyon'],
  'yetenek-yonetimi': ['Yetenek Yönetimi', 'Talent Management', 'insan-organizasyon'],
  'isveren-markasi': ['İşveren Markası', 'Employer Branding', 'insan-organizasyon'],
  'calisan-deneyimi': ['Çalışan Deneyimi', 'Employee Experience', 'insan-organizasyon'],
  'kurumsal-yonetisim': ['Kurumsal Yönetişim', 'Corporate Governance', 'insan-organizasyon'],
  'kurumsallasma': ['Kurumsallaşma', 'Institutionalization', 'insan-organizasyon'],
  'aile-sirketleri': ['Aile Şirketleri', 'Family Business', 'insan-organizasyon'],
  'nesil-gecisi': ['Nesil Geçişi', 'Succession', 'insan-organizasyon'],
  'endustriyel-iliskiler': ['Endüstriyel İlişkiler', 'Industrial Relations', 'insan-organizasyon'],
  'arabuluculuk': ['Arabuluculuk', 'Mediation', 'insan-organizasyon'],
  'is-hukuku': ['İş Hukuku', 'Labor Law', 'insan-organizasyon'],
  // operasyon
  'operasyonel-verimlilik': ['Operasyonel Verimlilik', 'Operational Excellence', 'operasyon'],
  'surec-optimizasyonu': ['Süreç Optimizasyonu', 'Process Optimization', 'operasyon'],
  'yalin-uretim': ['Yalın Üretim', 'Lean', 'operasyon'],
  'alti-sigma': ['Altı Sigma', 'Six Sigma', 'operasyon'],
  'uretim': ['Üretim', 'Manufacturing', 'operasyon'],
  'proje-yonetimi': ['Proje Yönetimi', 'Project Management', 'operasyon'],
  'kobi': ['KOBİ', 'SME', 'operasyon'],
  // pazarlama-cx
  'marka-yonetimi': ['Marka Yönetimi', 'Brand Management', 'pazarlama-cx'],
  'musteri-deneyimi': ['Müşteri Deneyimi', 'Customer Experience', 'pazarlama-cx'],
  'kurumsal-iletisim': ['Kurumsal İletişim', 'Corporate Communications', 'pazarlama-cx'],
  // global-vizyon
  'globallesme': ['Globalleşme', 'Globalization', 'global-vizyon'],
  'ihracat': ['İhracat', 'Exports', 'global-vizyon'],
  'turkiye-ab': ['Türkiye-AB', 'Türkiye-EU', 'global-vizyon'],
  'sinir-otesi': ['Sınır Ötesi', 'Cross-Border', 'global-vizyon'],
  // kamu-esg
  'surdurulebilirlik': ['Sürdürülebilirlik', 'Sustainability', 'kamu-esg'],
  'csrd': ['CSRD', 'CSRD', 'kamu-esg'],
  'karbon-muhasebesi': ['Karbon Muhasebesi', 'Carbon Accounting', 'kamu-esg'],
  'cbam': ['CBAM', 'CBAM', 'kamu-esg'],
  'kvkk': ['KVKK', 'KVKK', 'kamu-esg'],
  'gdpr': ['GDPR', 'GDPR', 'kamu-esg'],
  'veri-koruma': ['Veri Koruma', 'Data Protection', 'kamu-esg'],
  'ab-regulasyonu': ['AB Regülasyonu', 'EU Regulation', 'kamu-esg'],
  'regulasyon-uyum': ['Regülasyon & Uyum', 'Regulation & Compliance', 'kamu-esg'],
  // liderlik
  'founder-mektubu': ['Founder Mektubu', 'Founder Letter', 'liderlik'],
  'itibar-yonetimi': ['İtibar Yönetimi', 'Reputation', 'liderlik'],
  'performans-yonetimi': ['Performans Yönetimi', 'Performance Management', 'liderlik'],
  // ma-degerleme
  'due-diligence': ['Due Diligence', 'Due Diligence', 'ma-degerleme'],
  'entegrasyon': ['Entegrasyon (PMI)', 'Integration (PMI)', 'ma-degerleme'],
};

// ── 108 RAW TAGS -> survivor | __category__ (dup of a category) | __drop__ ────
const TAG_MERGE = {
  'strateji': '__category__', 'Strateji': '__category__',
  'kurumsal': 'kurumsal-strateji', 'kurumsal-strateji': 'kurumsal-strateji',
  'founder-notes': 'founder-mektubu',
  'Yapay Zeka': 'yapay-zeka', 'yapay zeka': 'yapay-zeka', 'AI': 'yapay-zeka', 'ai': 'yapay-zeka',
  'Artificial Intelligence': 'yapay-zeka', 'kurumsal ai': 'yapay-zeka',
  'GPT': 'uretken-yapay-zeka', 'LLM': 'uretken-yapay-zeka', 'generative ai': 'uretken-yapay-zeka',
  'ROI': 'roi', 'operasyonel verimlilik': 'operasyonel-verimlilik',
  'operasyonel-mukemmellik': 'operasyonel-verimlilik',
  'KPI': 'kpi', 'ölçüm': 'kpi', 'CFO': 'cfo',
  'Aile Şirketi': 'aile-sirketleri', 'aile-sirketi': 'aile-sirketleri', 'Aile Anayasası': 'aile-sirketleri',
  'stratejik danışmanlık': 'danismanlik', 'consulting': 'danismanlik', 'premium-consulting': 'danismanlik',
  'danismanlik': 'danismanlik', 'danışmanlık hizmetleri': 'danismanlik', 'seçim kriterleri': 'danismanlik',
  'danışmanlık ücretleri': 'danismanlik-fiyatlandirma', 'fiyatlandırma': 'danismanlik-fiyatlandirma',
  'retainer': 'danismanlik-fiyatlandirma',
  'dijital dönüşüm': 'dijital-donusum', 'Dijital Dönüşüm': 'dijital-donusum', 'Dönüşüm': 'dijital-donusum',
  'KVKK': 'kvkk', 'veri koruma': 'veri-koruma', 'GDPR': 'gdpr',
  'm-and-a': '__category__', 'degerleme': '__category__',
  'süreç optimizasyonu': 'surec-optimizasyonu', 'lean': 'yalin-uretim',
  'six sigma': 'alti-sigma', 'six-sigma': 'alti-sigma',
  'ecyverse': '__drop__',
  'Predictive Analytics': 'tahminleme', 'Forecasting': 'tahminleme',
  'Yatırım': 'yatirim', 'Investment': 'yatirim',
  'Yönetişim': 'kurumsal-yonetisim', 'yonetim-kurulu': 'kurumsal-yonetisim',
  'yonetim': 'kurumsal-yonetisim', 'Yönetim': 'kurumsal-yonetisim',
  'Devir': 'nesil-gecisi', 'Nesil Geçişi': 'nesil-gecisi', 'Sermaye Devri': 'nesil-gecisi', 'Veraset': 'nesil-gecisi',
  'kurumsallasma': 'kurumsallasma',
  'CSRD': 'csrd', 'ESG': '__category__', 'Sürdürülebilirlik': 'surdurulebilirlik',
  'AB Regulasyon': 'ab-regulasyonu', 'AB regülasyon': 'ab-regulasyonu',
  'Türkiye-AB': 'turkiye-ab', 'Globalleşme': 'globallesme', 'uluslararasi': 'globallesme', 'İhracat': 'ihracat',
  'Marka Yönetimi': 'marka-yonetimi', 'Müşteri Hizmetleri': 'musteri-deneyimi',
  'insan kaynakları': 'insan-kaynaklari', 'insan-kaynaklari': 'insan-kaynaklari',
  'İnsan Kaynakları': 'insan-kaynaklari', 'hr strateji': 'insan-kaynaklari',
  'yetenek yönetimi': 'yetenek-yonetimi', 'işveren markası': 'isveren-markasi', 'çalışan deneyimi': 'calisan-deneyimi',
  'endustriyel-iliskiler': 'endustriyel-iliskiler', 'uyusmazlik': 'endustriyel-iliskiler',
  'arabuluculuk': 'arabuluculuk', 'is-hukuku': 'is-hukuku',
  'Karbon': 'karbon-muhasebesi', 'Scope 3': 'karbon-muhasebesi', 'Emisyon Hesabı': 'karbon-muhasebesi',
  'CBAM': 'cbam',
  'kriz-yonetimi': 'kriz-yonetimi', 'iletisim': 'kurumsal-iletisim', 'itibar': 'itibar-yonetimi', 'risk': 'risk-yonetimi',
  'uyum': 'regulasyon-uyum', 'regülasyon': 'regulasyon-uyum',
  'post-merger-integration': 'entegrasyon', 'entegrasyon': 'entegrasyon',
  'Değişim Yönetimi': 'degisim-yonetimi', 'Liderlik': '__category__',
  'proje yönetimi': 'proje-yonetimi', 'PMO': 'proje-yonetimi', 'PMP': 'proje-yonetimi', 'agile': 'proje-yonetimi',
  'cross-border': 'sinir-otesi', 'due-diligence': 'due-diligence',
  'kobi': 'kobi', 'uretim': 'uretim', 'Production': 'uretim',
  'MLOps': 'mlops', 'DevOps': 'mlops',
  'vizyon': 'vizyon', 'performans': 'performans-yonetimi', 'İnovasyon': 'inovasyon',
};

// ── load inventory raw tags + article slugs ───────────────────────────────────
const rawTags = JSON.parse(fs.readFileSync('/tmp/rawtags.json', 'utf8'));
const articleSlugs = JSON.parse(fs.readFileSync('/tmp/slugs.json', 'utf8'));

// ── emit taxonomy.json ────────────────────────────────────────────────────────
const tags = Object.entries(VOCAB).map(([slug, [tr, en, cat]]) => ({
  slug, label_tr: tr, label_en: en, category: cat,
}));
const taxonomy = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  slug_rule: 'lowercase ASCII (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u), hyphen',
  categories: CATEGORIES,
  category_merge: CAT_MERGE,
  tags,
  max_tags_per_article: 5,
};
fs.writeFileSync(path.join(OUT, 'taxonomy.json'), JSON.stringify(taxonomy, null, 2));

// ── emit merge-map.json ───────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUT, 'merge-map.json'), JSON.stringify({ tag_merge: TAG_MERGE }, null, 2));

// ── emit redirects.json (<=1 hop) ─────────────────────────────────────────────
const redirects = [];
redirects.push({ from: '/blog', to: '/perspektifler', code: 301 });
redirects.push({ from: '/insights', to: '/perspektifler', code: 301 });
for (const s of articleSlugs) redirects.push({ from: `/blog/${s}`, to: `/perspektifler/${s}`, code: 301 });
// retired tag URLs: /insights/tag/<normalizedRaw> -> survivor konu | category | hub
for (const raw of rawTags) {
  const dest = TAG_MERGE[raw];
  let to = '/perspektifler';
  if (dest && dest !== '__drop__' && dest !== '__category__') to = `/perspektifler/konu/${dest}`;
  else if (dest === '__category__') {
    // category-equivalent: route to the matching category if obvious, else hub
    const cmap = { 'strateji': 'strateji', 'Strateji': 'strateji', 'm-and-a': 'ma-degerleme',
      'degerleme': 'ma-degerleme', 'ESG': 'kamu-esg', 'Liderlik': 'liderlik' };
    to = cmap[raw] ? `/perspektifler/kategori/${cmap[raw]}` : '/perspektifler';
  }
  redirects.push({ from: `/insights/tag/${slugify(raw)}`, to, code: 301 });
}
fs.writeFileSync(path.join(OUT, 'redirects.json'), JSON.stringify({ redirects }, null, 2));

console.log('EMITTED:', OUT + '/{taxonomy,merge-map,redirects}.json');
console.log('categories:', CATEGORIES.length, '| tags(vocab):', tags.length, '| redirects:', redirects.length);
