/**
 * P44-T07 Round-5 — Admin Dashboard Activity Seed.
 *
 * Produces realistic signal across the last 30 days so the admin Overview
 * dashboard renders trends, not just zeros:
 *   - 12 ContactSubmission (mixed isRead / source / locale)
 *   - 8 NewsletterSubscriber (active + 2 unsubscribed)
 *   - 6 Booking (mixed status, time-spread, attached to admin user)
 *   - 3 BookingFeedback (NPS promoters/passives) for completed bookings
 *
 * Idempotent: each entry uses a deterministic id so re-runs upsert in place.
 *
 * Run: `npx tsx prisma/seed-activity.ts` or via master orchestrator.
 */
import { PrismaClient, BookingStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'node:crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'admin@ecypro.com';

// Deterministic "now" derived offsets so re-runs don't fan-out trend data.
const NOW = new Date('2026-06-04T10:00:00Z');
function daysAgo(d: number, h = 10): Date {
  const x = new Date(NOW);
  x.setUTCDate(x.getUTCDate() - d);
  x.setUTCHours(h, 0, 0, 0);
  return x;
}

const CONTACTS = [
  {
    id: 'c-001',
    fullName: 'Mehmet Ali Yıldız',
    email: 'm.yildiz@birlikholding.example',
    company: 'Birlik Holding',
    service: 'M&A Due Diligence',
    messageTr: '2027 satış hazırlığı için Q4 değerleme istiyoruz.',
    source: 'footer',
    isRead: true,
    createdAt: daysAgo(28),
  },
  {
    id: 'c-002',
    fullName: 'Selin Bayrak',
    email: 's.bayrak@deltagreen.example',
    company: 'Delta Green Energy',
    service: 'ESG Stratejisi',
    messageTr: 'CSRD ilk yıl raporlamaya hazırlık.',
    source: 'blog-cta',
    isRead: true,
    createdAt: daysAgo(26),
  },
  {
    id: 'c-003',
    fullName: 'Volkan Aksoy',
    email: 'v.aksoy@orhanmetal.example',
    company: 'Orhan Metal',
    service: 'Aile Şirketi',
    messageTr: 'Halefiyet planı + Aile Anayasası danışmanlığı talep.',
    source: 'exit-intent',
    isRead: false,
    createdAt: daysAgo(22),
  },
  {
    id: 'c-004',
    fullName: 'Ayşe Korkmaz',
    email: 'a.korkmaz@orcalogistics.example',
    company: 'Orca Logistics',
    service: 'Fintech Uyum',
    messageTr: 'Bekleyen SPK CASP başvurusu için danışmanlık.',
    source: 'linkedin',
    isRead: false,
    createdAt: daysAgo(19),
  },
  {
    id: 'c-005',
    fullName: 'Erdem Demir',
    email: 'e.demir@nullsoftware.example',
    company: 'Null Software',
    service: 'M&A Advisory',
    messageTr: 'Stratejik alıcılara satış sürecinde aracılık.',
    source: 'organic-search',
    isRead: true,
    createdAt: daysAgo(17),
  },
  {
    id: 'c-006',
    fullName: 'Janet Phillips',
    email: 'janet@cascadeesg.example',
    company: 'Cascade ESG (UK)',
    service: 'ESG Strategy',
    messageEn: 'Need pre-acquisition ESG diligence for a Turkish target.',
    source: 'referral',
    isRead: false,
    createdAt: daysAgo(15),
  },
  {
    id: 'c-007',
    fullName: 'Tolga Sezer',
    email: 't.sezer@yenitarim.example',
    company: 'Yeni Tarım Yatırım',
    service: 'M&A',
    messageTr: 'Tarım teknoloji sektöründe roll-up stratejisi.',
    source: 'footer',
    isRead: true,
    createdAt: daysAgo(12),
  },
  {
    id: 'c-008',
    fullName: 'Helin Ünal',
    email: 'h.unal@evdeniz.example',
    company: 'EvDeniz E-ticaret',
    service: 'Fintech Uyum',
    messageTr: 'MASAK Travel Rule entegrasyonu.',
    source: 'blog-cta',
    isRead: false,
    createdAt: daysAgo(9),
  },
  {
    id: 'c-009',
    fullName: 'Kerem Acar',
    email: 'k.acar@aksaratl.example',
    company: 'Aksar Atletizm',
    service: 'Aile Şirketi',
    messageTr: '3. kuşak geçişi + dış denetim modeli.',
    source: 'newsletter',
    isRead: false,
    createdAt: daysAgo(6),
  },
  {
    id: 'c-010',
    fullName: 'Lara Şahin',
    email: 'l.sahin@brioventure.example',
    company: 'Brio Venture Studio',
    service: 'M&A',
    messageTr: 'Portföy şirketi satış hazırlığı.',
    source: 'linkedin',
    isRead: false,
    createdAt: daysAgo(4),
  },
  {
    id: 'c-011',
    fullName: 'Onur Karakaş',
    email: 'o.karakas@hilalbank.example',
    company: 'Hilal Katılım Bankası',
    service: 'Fintech Uyum',
    messageTr: 'Dijital bankacılık lisansı + BDDK uyum.',
    source: 'organic-search',
    isRead: false,
    createdAt: daysAgo(2),
  },
  {
    id: 'c-012',
    fullName: 'Defne Kurt',
    email: 'd.kurt@altarpartners.example',
    company: 'Altar Partners',
    service: 'ESG Stratejisi',
    messageTr: 'Çift materyalite worksho​p organize etmek istiyoruz.',
    source: 'referral',
    isRead: false,
    createdAt: daysAgo(1),
  },
];

const SUBSCRIBERS = [
  {
    id: 'sub-001',
    email: 'subscriber1@example.com',
    consent: true,
    source: 'footer',
    subscribedAt: daysAgo(29),
  },
  {
    id: 'sub-002',
    email: 'subscriber2@example.com',
    consent: true,
    source: 'blog-cta',
    subscribedAt: daysAgo(24),
  },
  {
    id: 'sub-003',
    email: 'subscriber3@example.com',
    consent: true,
    source: 'exit-intent',
    subscribedAt: daysAgo(20),
  },
  {
    id: 'sub-004',
    email: 'subscriber4@example.com',
    consent: true,
    source: 'footer',
    subscribedAt: daysAgo(16),
  },
  {
    id: 'sub-005',
    email: 'subscriber5@example.com',
    consent: false,
    source: 'footer',
    subscribedAt: daysAgo(14),
    unsubscribedAt: daysAgo(10),
  },
  {
    id: 'sub-006',
    email: 'subscriber6@example.com',
    consent: true,
    source: 'blog-cta',
    subscribedAt: daysAgo(11),
  },
  {
    id: 'sub-007',
    email: 'subscriber7@example.com',
    consent: true,
    source: 'newsletter-page',
    subscribedAt: daysAgo(7),
  },
  {
    id: 'sub-008',
    email: 'subscriber8@example.com',
    consent: false,
    source: 'exit-intent',
    subscribedAt: daysAgo(5),
    unsubscribedAt: daysAgo(2),
  },
];

// Booking specs: status + scheduledAt offset. completed → also seed feedback.
const BOOKING_SPECS: Array<{
  id: string;
  status: BookingStatus;
  scheduledAt: Date;
  notesTr?: string;
  feedbackScore?: number; // populate when COMPLETED
  feedbackComment?: string;
}> = [
  {
    id: 'bk-c-001',
    status: 'COMPLETED',
    scheduledAt: daysAgo(25),
    notesTr: 'M&A roll-up strateji görüşmesi.',
    feedbackScore: 10,
    feedbackComment: 'Çok değerli — net aksiyon listesiyle ayrıldık.',
  },
  {
    id: 'bk-c-002',
    status: 'COMPLETED',
    scheduledAt: daysAgo(18),
    notesTr: 'ESG raporlama hazırlık.',
    feedbackScore: 9,
    feedbackComment: 'Pratik + uygulanabilir öneriler.',
  },
  {
    id: 'bk-c-003',
    status: 'CONFIRMED',
    scheduledAt: daysAgo(-2),
    notesTr: 'CASP başvuru — SPK Tebliğ III-35/B.2 değerlendirme.',
  },
  {
    id: 'bk-c-004',
    status: 'CONFIRMED',
    scheduledAt: daysAgo(-5),
    notesTr: 'Aile Anayasası ilk taslak müzakeresi.',
  },
  { id: 'bk-c-005', status: 'PENDING', scheduledAt: daysAgo(-8), notesTr: 'Discovery call.' },
  {
    id: 'bk-c-006',
    status: 'COMPLETED',
    scheduledAt: daysAgo(9),
    notesTr: 'Fintech uyum gap-analizi follow-up.',
    feedbackScore: 8,
    feedbackComment: 'Faydalı — ikinci toplantı için kapsam genişletilebilir.',
  },
];

function hmacToken(seed: string): string {
  return crypto.createHmac('sha256', 'p44-t07-seed').update(seed).digest('hex').slice(0, 32);
}

export async function seedActivity(): Promise<{
  contacts: number;
  subscribers: number;
  bookings: number;
  feedbacks: number;
}> {
  const admin = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(
      `Activity seed requires bootstrap admin (${ADMIN_EMAIL}). Run scripts/seed.ts first.`,
    );
  }

  // Contacts ────────────────────────────────────────────
  for (const c of CONTACTS) {
    await prisma.contactSubmission.upsert({
      where: { id: c.id },
      create: c,
      update: { ...c },
    });
  }

  // Newsletter subscribers ──────────────────────────────
  for (const s of SUBSCRIBERS) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: s.email },
      create: s,
      update: { ...s },
    });
  }

  // Bookings ────────────────────────────────────────────
  let feedbackCount = 0;
  for (const b of BOOKING_SPECS) {
    await prisma.booking.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        userId: admin.id,
        status: b.status,
        scheduledAt: b.scheduledAt,
        durationMin: 30,
        notesTr: b.notesTr ?? null,
      },
      update: { status: b.status, scheduledAt: b.scheduledAt },
    });
    if (b.status === 'COMPLETED' && b.feedbackScore != null) {
      await prisma.bookingFeedback.upsert({
        where: { bookingId: b.id },
        create: {
          bookingId: b.id,
          score: b.feedbackScore,
          comment: b.feedbackComment ?? null,
          token: hmacToken(b.id),
          tokenUsed: true,
          submittedAt: new Date(b.scheduledAt.getTime() + 24 * 60 * 60 * 1000),
        },
        update: {
          score: b.feedbackScore,
          comment: b.feedbackComment ?? null,
          tokenUsed: true,
        },
      });
      feedbackCount++;
    }
  }

  return {
    contacts: CONTACTS.length,
    subscribers: SUBSCRIBERS.length,
    bookings: BOOKING_SPECS.length,
    feedbacks: feedbackCount,
  };
}
