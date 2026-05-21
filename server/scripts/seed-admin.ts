#!/usr/bin/env tsx
/**
 * seed-admin.ts — Upsert initial ADMIN user for production bootstrap.
 *
 * Usage:
 *   npx tsx server/scripts/seed-admin.ts
 *
 * Environment:
 *   ADMIN_EMAIL    — admin email (default: admin@ecypro.com)
 *   ADMIN_PASSWORD — admin password (REQUIRED, min 12 chars)
 *   ADMIN_NAME     — display name  (default: eCyPro Admin)
 *   DATABASE_URL   — Postgres connection string (required)
 *
 * Behavior:
 *   - If user with ADMIN_EMAIL exists → promotes to ADMIN role, updates password
 *   - If user does not exist → creates new ADMIN user
 *   - Idempotent: safe to run multiple times
 */

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// ─── Password hashing (mirrors server/controllers/authController.ts) ──
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100_000;
const DIGEST = 'sha512';

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(`${salt}:${ITERATIONS}:${key.toString('hex')}`);
    });
  });
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@ecypro.com';
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'eCyPro Admin';

  if (!password || password.length < 12) {
    console.error(
      '[seed-admin] ADMIN_PASSWORD is required and must be at least 12 characters.\n' +
        'Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=supersecret123 npx tsx server/scripts/seed-admin.ts',
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('[seed-admin] DATABASE_URL is required.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: 'ADMIN',
        name,
        isActive: true,
        emailVerified: true,
      },
      create: {
        email,
        passwordHash,
        role: 'ADMIN',
        name,
        isActive: true,
        emailVerified: true,
      },
    });

    /* eslint-disable no-console -- CLI script; stdout output expected */
    console.log(`[seed-admin] ✅ Admin user ready:`);
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role:  ${user.role}`);
    console.log(`  Name:  ${user.name}`);
    /* eslint-enable no-console */
  } catch (err) {
    console.error('[seed-admin] ❌ Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
