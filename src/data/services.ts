import {
  Handshake,
  Calculator,
  Layers,
  MessageSquare,
  GitMerge,
  Leaf,
  Globe,
  BarChart,
  FileCheck,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Landmark,
  Bitcoin,
  Users,
  BookOpen,
  Building,
  TrendingUp,
  Scale,
  GraduationCap,
} from 'lucide-react';

import { Service } from '../schemas/service';

export const DEPARTMENTS = [
  { id: 'all', label: { tr: 'HEPSİ', en: 'ALL' } },
  { id: 'ma', label: { tr: 'M&A', en: 'M&A' } },
  { id: 'esg', label: { tr: 'ESG', en: 'ESG' } },
  { id: 'fintech', label: { tr: 'FİNTECH', en: 'FINTECH' } },
  { id: 'aile', label: { tr: 'AİLE ŞİRKETİ', en: 'FAMILY BUSINESS' } },
];

export const SERVICES: Service[] = [
  // --- M&A & DEĞERLEMEokul (5 ITEMS) ---
  {
    id: 'ma-dd-suite',
    title: 'Due Diligence Suite',
    category: 'ma',
    description:
      'Mali, hukuki, vergi, tekno ve KVKK katmanlarını 90 günde tek elden — Kurucu Emre Can Yalçın tüm süreçte kıdemli ortak olarak masa başındadır.',
    icon: Handshake,
    link: '/services/due-diligence-suite',
  },
  {
    id: 'ma-valuation',
    title: 'Şirket Değerleme & QoE',
    category: 'ma',
    description:
      'DCF, çarpan analizi ve EBITDA kalite testi; Türk mid-market için özel add-back metodolojisi ile savunulabilir değerleme.',
    icon: Calculator,
    link: '/services/mergers-acquisitions',
  },
  {
    id: 'ma-deal-structuring',
    title: 'İşlem Yapılandırma',
    category: 'ma',
    description:
      'Varlık, hisse veya birleşme senaryolarında vergi optimizasyonu ve TTK uyum — yanlış yapı seçimi en pahalı hatadır.',
    icon: Layers,
    link: '/services/deal-structuring',
  },
  {
    id: 'ma-negotiation',
    title: 'Müzakere & LOI',
    category: 'ma',
    description:
      "NDA'dan bağlayıcı term-sheet'e 4 haftada; deal-breaker'lar müzakere masasına gelmeden tespit edilir ve kaldırılır.",
    icon: MessageSquare,
    link: '/services/negotiation-loi',
  },
  {
    id: 'ma-pmi',
    title: 'Birleşme Sonrası Entegrasyon',
    category: 'ma',
    description:
      'İlk 100 gün playbook, kültür kırılma noktaları ve sinerji takip panosu — başarısızlığın en sık yaşandığı bu aşama, başlıca uzmanlık alanımızdır.',
    icon: GitMerge,
    link: '/services/post-merger-integration',
  },

  // --- ESG & SÜRDÜRÜLEBİLİRLİK (5 ITEMS) ---
  {
    id: 'esg-esrs',
    title: 'ESRS Yol Haritası',
    category: 'esg',
    description:
      'E1-E5, S1-S4 ve G1 standartlarına 6 ayda hazırlık; CSRD Türkiye ve AB çift-yetki raporlaması için somut adım adım program.',
    icon: Leaf,
    link: '/services/esrs-roadmap',
  },
  {
    id: 'esg-double-materiality',
    title: 'Çift Önemlilik Analizi',
    category: 'esg',
    description:
      'İçten-dışa ve dıştan-içe önemlilik değerlendirmesi; paydaş haritası ve etki-risk matrisi ile ESRS uyumlu çerçeve.',
    icon: Scale,
    link: '/services/double-materiality',
  },
  {
    id: 'esg-carbon',
    title: 'Karbon Muhasebesi',
    category: 'esg',
    description:
      'Scope 1, 2 ve 3 emisyon envanteri, doğrulama hazırlığı ve bilim temelli hedef (SBTi) yol haritası — veri değil, karar desteği.',
    icon: BarChart,
    link: '/services/carbon-accounting',
  },
  {
    id: 'esg-csrd',
    title: 'CSRD Uyumu',
    category: 'esg',
    description:
      'Türk şirketler için AB tedarik zinciri baskısına karşı CSRD hazırlık; Kurucu eşliğiyle yönetim kurulu sunumuna hazır rapor.',
    icon: FileCheck,
    link: '/services/csrd-compliance',
  },
  {
    id: 'esg-sustainability-report',
    title: 'Sürdürülebilirlik Raporları',
    category: 'esg',
    description:
      'GRI, SASB ve ESRS uyumlu yıllık sürdürülebilirlik raporları; analist sorularına dayanıklı verilerle hazırlanır.',
    icon: FileText,
    link: '/services/esg-strategy',
  },

  // --- FİNTECH & COMPLIANCE (5 ITEMS) ---
  {
    id: 'fintech-spk',
    title: 'SPK & CASP Lisansı',
    category: 'fintech',
    description:
      'Kripto varlık hizmet sağlayıcısı lisans süreci; SPK başvurusu, sermaye yapılanması ve uyum çerçevesi tek elden.',
    icon: Landmark,
    link: '/services/spk-casp',
  },
  {
    id: 'fintech-masak',
    title: 'MASAK AML/KYC',
    category: 'fintech',
    description:
      'Risk bazlı AML politikası, müşteri kimlik doğrulama prosedürleri ve MASAK uyum programı; denetim öncesi boşluk analizi dahil.',
    icon: AlertTriangle,
    link: '/services/masak-aml',
  },
  {
    id: 'fintech-kvkk',
    title: 'KVKK VERBİS & DSAR',
    category: 'fintech',
    description:
      'VERBİS kaydı, kişisel veri envanteri, DSAR süreç tasarımı ve sözleşme şablonları; Kurucu eşliğinde tam uyum paketi.',
    icon: ShieldCheck,
    link: '/services/data-governance',
  },
  {
    id: 'fintech-open-banking',
    title: 'Açık Bankacılık Uyumu',
    category: 'fintech',
    description:
      'TCMB ve BDDK düzenlemelerine uyum; PSD2 eşdeğeri API güvenlik standartları ve lisans başvurusu danışmanlığı.',
    icon: Lock,
    link: '/services/open-banking',
  },
  {
    id: 'fintech-crypto',
    title: 'Kripto & Web3 Hukuku',
    category: 'fintech',
    description:
      "Token ihracı, DeFi protokol uyum değerlendirmesi ve Türkiye'nin değişen kripto regülasyon ortamında stratejik konum.",
    icon: Bitcoin,
    link: '/services/crypto-web3',
  },

  // --- AİLE ŞİRKETİ (6 ITEMS) ---
  {
    id: 'aile-succession',
    title: 'Kuşak Devri Planlaması',
    category: 'aile',
    description:
      "1G'den 2G'ye ya da 2G'den 3G'ye geçişte hisse devri, yönetim devri ve aile üyesi yetkinlik değerlendirmesi — Kurucu eşliğiyle nesil atlama rehberi.",
    icon: TrendingUp,
    link: '/services/succession-planning',
  },
  {
    id: 'aile-anayasa',
    title: 'Aile Anayasası',
    category: 'aile',
    description:
      'Aile konseyi, atanma kriterleri, kâr payı politikası ve uyuşmazlık çözüm mekanizması; tüm kuşakların imzaladığı yaşayan belge.',
    icon: BookOpen,
    link: '/services/family-business',
  },
  {
    id: 'aile-family-office',
    title: 'Family Office Kurulumu',
    category: 'aile',
    description:
      'Tek aile ofisi yapısı, yatırım komitesi, risk politikası ve operasyonel çerçeve; kurumsal miras yönetiminin temeli.',
    icon: Building,
    link: '/services/family-office',
  },
  {
    id: 'aile-wealth-transfer',
    title: 'Servet Transferi Planlaması',
    category: 'aile',
    description:
      'Çoklu nesil vergi optimizasyonu, bağış planlaması ve likidite stratejisi; serveti koruyarak aktarmanın mimarisi.',
    icon: Globe,
    link: '/services/wealth-transfer',
  },
  {
    id: 'aile-conflict',
    title: 'Aile Arabuluculuğu',
    category: 'aile',
    description:
      'Hissedar anlaşmazlıkları, nesil çatışmaları ve çıkış müzakereleri için tarafsız yapılandırılmış arabuluculuk süreci.',
    icon: Users,
    link: '/services/conflict-resolution',
  },
  {
    id: 'aile-kurumsallasma',
    title: 'Kurumsallaşma & Bağımsız Yönetim',
    category: 'aile',
    description:
      'Bağımsız yönetim kurulu üyesi seçimi, komite yapısı ve kurumsal yönetim derecelendirmesi; aile şirketinden kurumsal şirkete dönüşüm.',
    icon: GraduationCap,
    link: '/services/family-business-governance',
  },
];
