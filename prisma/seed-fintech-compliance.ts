/**
 * P44-T07 Round-5 — Fintech Compliance Items Seed (Real Turkish Regulators).
 *
 * Source: Law No. 7518 (27 June 2024) Sermaye Piyasası Kanunu Amendment +
 * SPK Tebliğleri III-35/B.1 & III-35/B.2 (13 March 2025) + MASAK Travel Rule
 * (25 February 2025) + KVKK Veri Sorumluları Sicil Bilgi Sistemi (VERBİS).
 *
 * Creates one demo Client ("Anadolu Fintech A.Ş." — anonymised crypto
 * exchange profile) and 15 compliance items spanning all 5 regulators.
 * Each item carries a realistic dueDate (the actual regulatory deadline),
 * riskScore (1-10) reflecting current Turkish CASP licensing pressure, and
 * notes citing the specific Tebliğ / Genelge.
 *
 * Run: `npx tsx prisma/seed-fintech-compliance.ts` or via master orchestrator.
 */
import { PrismaClient, Regulator, ComplianceItemStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface Item {
  regulator: Regulator;
  category: string;
  status: ComplianceItemStatus;
  riskScore: number;
  dueDate?: Date;
  notes: string;
}

// 31 Mart 2026 → kritik CASP deadline (SPK Tebliğ III-35/B.2 sermaye yeterliliği)
const CASP_DEADLINE = new Date('2026-03-31');
const MASAK_TRAVEL_RULE_LIVE = new Date('2025-02-25');
const VERBIS_RENEWAL = new Date('2026-12-31');

const ITEMS: Item[] = [
  // ── SPK — Sermaye Piyasası Kurulu (CASP / KVHS) ─────────────────────────
  {
    regulator: 'SPK',
    category: 'Kuruluş İzni (III-35/B.1)',
    status: 'UNDER_REVIEW',
    riskScore: 9,
    dueDate: CASP_DEADLINE,
    notes:
      'SPK Tebliğ III-35/B.1: KVHS kuruluş ve faaliyet esasları. Yönetim kurulu, esas sermaye, ortak yapısı + Bilgi Sistemleri Yönetmeliği uyum dosyası.',
  },
  {
    regulator: 'SPK',
    category: 'Sermaye Yeterliliği (III-35/B.2)',
    status: 'IN_PROGRESS',
    riskScore: 10,
    dueDate: CASP_DEADLINE,
    notes:
      'Alım-satım platformu: 150M TL. Saklamacı kuruluş: 500M TL. Yeterlilik raporu çeyreksel.',
  },
  {
    regulator: 'SPK',
    category: 'Saklama Hizmeti (III-35/B.3)',
    status: 'NOT_STARTED',
    riskScore: 7,
    dueDate: CASP_DEADLINE,
    notes:
      'Soğuk cüzdan: müşteri varlık %95 minimum. Sıcak cüzdan limiti 24h likidite. SOC2 Type II raporu.',
  },
  // ── MASAK — Mali Suçları Araştırma Kurulu ──────────────────────────────
  {
    regulator: 'MASAK',
    category: 'Travel Rule (15K TL üstü)',
    status: 'APPROVED',
    riskScore: 8,
    dueDate: MASAK_TRAVEL_RULE_LIVE,
    notes:
      'Yürürlük 25 Şubat 2025. Gönderici/alıcı kimlik + cüzdan bilgisi + IBAN/TCKN doğrulama transferin her iki ucunda.',
  },
  {
    regulator: 'MASAK',
    category: 'Şüpheli İşlem Bildirimi (STR)',
    status: 'IN_PROGRESS',
    riskScore: 9,
    notes:
      'STR uyarı motoru: yaş + ödeme paterni + cüzdan reputation. Aylık MASAK portalına bildirim.',
  },
  {
    regulator: 'MASAK',
    category: 'KYC Tier yapısı',
    status: 'APPROVED',
    riskScore: 6,
    notes:
      'Tier 1 (TCKN+SMS) → 50K TL/ay, Tier 2 (Yüz tanıma) → 250K TL/ay, Tier 3 (Belgeli) → sınırsız.',
  },
  // ── KVKK — Kişisel Verileri Koruma Kurumu ──────────────────────────────
  {
    regulator: 'KVKK',
    category: 'VERBİS Kayıt + Güncel Tutma',
    status: 'APPROVED',
    riskScore: 4,
    dueDate: VERBIS_RENEWAL,
    notes:
      'Veri envanteri 6 ayda 1 güncelleme. İşleme amaç + saklama süreleri + alıcı grupları tablosu KVKK m.16.',
  },
  {
    regulator: 'KVKK',
    category: 'Açık Rıza & Aydınlatma Metni',
    status: 'IN_PROGRESS',
    riskScore: 6,
    notes:
      'Hesap açılış sürecinde ayrıştırılmış rıza (pazarlama / yurt-dışı aktarım / 3. taraf paylaşım). KVKK m.4-5-10.',
  },
  {
    regulator: 'KVKK',
    category: 'DSAR — İlgili Kişi Başvuru SLA',
    status: 'IN_PROGRESS',
    riskScore: 7,
    notes:
      '30 günlük yanıt yükümlülüğü (KVKK m.13). Erişim/Düzeltme/Silme/Aktarma. Eksik yanıt → idari para cezası.',
  },
  {
    regulator: 'KVKK',
    category: 'Veri İhlali Bildirim (m.12/5)',
    status: 'APPROVED',
    riskScore: 8,
    notes:
      '72 saat içinde KVKK Kurul + etkilenenlere bildirim. İhlal kayıt defteri tutulması zorunlu.',
  },
  // ── TCMB — Türkiye Cumhuriyet Merkez Bankası ───────────────────────────
  {
    regulator: 'TCMB',
    category: 'Ödeme Kuruluşu Lisansı (6493 SK)',
    status: 'NOT_STARTED',
    riskScore: 5,
    notes:
      'TL ödeme rayında kalmak için. Asgari özkaynak 5M TL. Ödeme hizmeti şeffaflık + ücret tarife yayınlama.',
  },
  {
    regulator: 'TCMB',
    category: 'Stablecoin İhraç Çerçevesi',
    status: 'UNDER_REVIEW',
    riskScore: 6,
    notes:
      'TL-temelli stablecoin ihraç ediliyorsa rezerv saklama + 1:1 likidite + dış denetim çeyreksel.',
  },
  // ── BDDK — Bankacılık Düzenleme ve Denetleme Kurumu ────────────────────
  {
    regulator: 'BDDK',
    category: 'Bilgi Sistemleri Bağımsız Denetim',
    status: 'IN_PROGRESS',
    riskScore: 7,
    dueDate: CASP_DEADLINE,
    notes:
      'BDDK Bilgi Sistemleri Yönetmeliği m.13: yıllık bağımsız BS denetim raporu. ISO 27001 zorunlu değil ama tavsiye.',
  },
  {
    regulator: 'BDDK',
    category: 'Operasyonel Risk Sigortası',
    status: 'NOT_STARTED',
    riskScore: 5,
    notes:
      "Müşteri varlıklarının %5'i kadar fer'i sigorta. Yan-zincir hack senaryosu kapsamda olmalı.",
  },
  {
    regulator: 'BDDK',
    category: 'Sınır-ötesi Aktarım Bildirimi',
    status: 'APPROVED',
    riskScore: 4,
    notes:
      "AB / OFAC yaptırım listeleri taraması anlık. 250K USD üstü yurt-dışı aktarımlar BDDK'ya aylık konsolide rapor.",
  },
];

export async function seedFintechCompliance(): Promise<{ created: number; clientId: string }> {
  const client = await prisma.client.upsert({
    where: { id: 'demo-fintech-anadolu' },
    create: {
      id: 'demo-fintech-anadolu',
      name: 'Anadolu Fintech A.Ş. (Demo)',
      contactEmail: 'compliance@anadolu-fintech.example',
      sector: 'CASP / Kripto Borsası',
      isActive: true,
    },
    update: {
      name: 'Anadolu Fintech A.Ş. (Demo)',
      sector: 'CASP / Kripto Borsası',
    },
  });

  // Idempotent: wipe demo client's items first (clean re-seed).
  await prisma.fintechComplianceItem.deleteMany({ where: { clientId: client.id } });
  await prisma.fintechComplianceItem.createMany({
    data: ITEMS.map((i) => ({ ...i, clientId: client.id })),
  });
  return { created: ITEMS.length, clientId: client.id };
}
