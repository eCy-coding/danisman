 
/**
 * EcyPro — Database Seed Script
 *
 * Seeds the PostgreSQL database with initial admin user,
 * sample services, and demo analytics data.
 *
 * Usage: npx tsx scripts/seed.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── PBKDF2 Password Hashing (MUST match authController.ts) ───
// Format: salt:iterations:hash   (3 parts)
// authController.verifyPassword rejects 2-part legacy hashes, so keep these in sync.

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const SALT_BYTES = 32;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${ITERATIONS}:${hash}`;
}

// ─── Seed Data ───────────────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Admin User
  const adminEmail = 'admin@ecypro.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'EcyPro Admin',
        passwordHash: hashPassword('admin123!Ecypro'),
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin user created: ${admin.email}`);
  } else {
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // 2. Demo User
  const demoEmail = 'demo@ecypro.com';
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existingDemo) {
    const demo = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        passwordHash: hashPassword('demo123!Ecypro'),
        role: 'USER',
      },
    });
    console.log(`✅ Demo user created: ${demo.email}`);
  } else {
    console.log(`⏭️  Demo user already exists: ${demoEmail}`);
  }

  // 3. Sample Bookings
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    const bookingCount = await prisma.booking.count();
    if (bookingCount === 0) {
      const bookings = await prisma.booking.createMany({
        data: [
          {
            userId: adminUser.id,
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            status: 'CONFIRMED',
            notesEn: 'Initial strategy consultation',
            notesTr: 'İlk strateji danışmanlığı',
          },
          {
            userId: adminUser.id,
            scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            status: 'PENDING',
            notesEn: 'Cloud architecture review',
            notesTr: 'Bulut mimari incelemesi',
          },
          {
            userId: adminUser.id,
            scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            notesEn: 'Operations optimization workshop',
            notesTr: 'Operasyon optimizasyonu atölyesi',
          },
        ],
      });
      console.log(`✅ ${bookings.count} sample bookings created`);
    } else {
      console.log(`⏭️  Bookings already exist (${bookingCount})`);
    }
  }

  // 4. Sample Analytics Events
  const analyticsCount = await prisma.analytics.count();
  if (analyticsCount === 0) {
    const pages = ['/', '/services', '/about', '/contact', '/pricing', '/blog', '/case-studies'];
    const events = [];

    for (let i = 0; i < 50; i++) {
      events.push({
        sessionId: `seed-session-${Math.floor(i / 5)}`,
        page: pages[Math.floor(Math.random() * pages.length)],
        referrer: i % 3 === 0 ? 'https://google.com' : 'direct',
        deviceType: i % 2 === 0 ? 'desktop' : 'mobile',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      });
    }

    await prisma.analytics.createMany({ data: events });
    console.log(`✅ ${events.length} analytics events seeded`);
  } else {
    console.log(`⏭️  Analytics events already exist (${analyticsCount})`);
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
