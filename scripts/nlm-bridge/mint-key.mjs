#!/usr/bin/env node
/**
 * Mint an ApiKey for the Research Bridge (scope: research:bridge).
 *
 * Prints the RAW key exactly once — copy it into the bridge env
 * (RESEARCH_BRIDGE_KEY). Only the SHA-256 hash is stored.
 *
 * Run with DB env loaded, e.g.:
 *   DATABASE_URL=postgresql://... node scripts/nlm-bridge/mint-key.mjs
 */
import { createHash, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const raw = randomBytes(32).toString('base64url');
const hashedKey = createHash('sha256').update(raw).digest('hex');

const row = await prisma.apiKey.create({
  data: {
    hashedKey,
    name: process.env.BRIDGE_KEY_NAME ?? 'research-bridge',
    scopes: ['research:bridge'],
  },
  select: { id: true, name: true, scopes: true },
});

console.log('[mint-key] created:', row);
console.log('[mint-key] RESEARCH_BRIDGE_KEY (shown once):');
console.log(raw);
await prisma.$disconnect();
await pool.end();
