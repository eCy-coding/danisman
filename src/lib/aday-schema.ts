import { z } from 'zod';

export const REVENUE_OPTIONS = [
  { value: '100M-300M USD', label: '100M–300M USD' },
  { value: '301M-500M USD', label: '301M–500M USD' },
  { value: '501M-1000M USD', label: '501M–1.000M USD' },
  { value: '+1000M USD', label: '+1.000M USD' },
] as const;

export const SOURCE_OPTIONS = [
  { value: 'Discovery Call', label: 'Discovery Call' },
  { value: 'LinkedIn Wave', label: 'LinkedIn Wave' },
  { value: 'Founder Letter', label: 'Founder Letter' },
  { value: 'Direct', label: 'Doğrudan' },
  { value: 'Referral', label: 'Referans' },
] as const;

export const SERVICE_CATALOG = [
  // M&A
  { value: 'M&A advisory', label: 'M&A Danışmanlığı', cluster: 'M&A' },
  { value: 'Due diligence', label: 'Due Diligence', cluster: 'M&A' },
  { value: 'Valuation', label: 'Değerleme', cluster: 'M&A' },
  { value: 'Post-merger integration', label: 'Birleşme Sonrası Entegrasyon', cluster: 'M&A' },
  { value: 'Divestiture', label: 'Satış Danışmanlığı', cluster: 'M&A' },
  // ESG
  { value: 'ESG strategy', label: 'ESG Strateji', cluster: 'ESG' },
  { value: 'ESG reporting', label: 'ESG Raporlama', cluster: 'ESG' },
  { value: 'Carbon footprint', label: 'Karbon Ayak İzi', cluster: 'ESG' },
  { value: 'Sustainability roadmap', label: 'Sürdürülebilirlik Yol Haritası', cluster: 'ESG' },
  { value: 'Green finance', label: 'Yeşil Finansman', cluster: 'ESG' },
  // Fintech
  { value: 'Fintech compliance', label: 'Fintech Uyum', cluster: 'Fintech' },
  { value: 'Payment systems', label: 'Ödeme Sistemleri', cluster: 'Fintech' },
  { value: 'Digital banking', label: 'Dijital Bankacılık', cluster: 'Fintech' },
  { value: 'Regulatory sandbox', label: 'Düzenleyici Kum Havuzu', cluster: 'Fintech' },
  { value: 'Crypto advisory', label: 'Kripto Danışmanlığı', cluster: 'Fintech' },
  // Aile Şirketi
  { value: 'Family office', label: 'Aile Ofisi', cluster: 'Aile Şirketi' },
  { value: 'Succession planning', label: 'Haleflik Planlaması', cluster: 'Aile Şirketi' },
  { value: 'Governance', label: 'Kurumsal Yönetişim', cluster: 'Aile Şirketi' },
  { value: 'Wealth management', label: 'Varlık Yönetimi', cluster: 'Aile Şirketi' },
  { value: 'Family constitution', label: 'Aile Anayasası', cluster: 'Aile Şirketi' },
];

export const HIGH_REVENUE_RANGES = ['501M-1000M USD', '+1000M USD'] as const;

export const AdaySchema = z.object({
  name: z.string().min(2, { message: 'Ad en az 2 karakter olmalı' }),
  email: z.string().email({ message: 'Geçerli e-posta adresi giriniz' }),
  company: z.string().min(2, { message: 'Şirket adı en az 2 karakter olmalı' }),
  revenueRange: z.enum(['100M-300M USD', '301M-500M USD', '501M-1000M USD', '+1000M USD']),
  serviceInterest: z.array(z.string()).min(1, { message: 'En az 1 hizmet seçiniz' }),
  source: z.enum(['Discovery Call', 'LinkedIn Wave', 'Founder Letter', 'Direct', 'Referral']),
  purchaseAuthority: z.boolean().optional(),
  kvkkConsent: z.literal(true, { message: 'KVKK rızası zorunludur' }),
});

export type AdayInput = z.infer<typeof AdaySchema>;
