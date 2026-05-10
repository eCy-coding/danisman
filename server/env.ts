/**
 * Env Bootstrap — must be the FIRST import in server/index.ts
 *
 * Loads .env then .env.local with last-wins semantics.
 * Works without dotenvx (direct tsx or CI environments).
 * TypeScript hoists all imports to top of generated JS, so
 * placing this as first import guarantees it runs before any
 * module that reads process.env (Prisma Pool, etc.).
 */
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'dotenv';

const ROOT = process.cwd();

for (const file of ['.env', '.env.local']) {
  const fp = path.resolve(ROOT, file);
  if (fs.existsSync(fp)) {
    const parsed = parse(fs.readFileSync(fp));
    for (const [k, v] of Object.entries(parsed)) {
      process.env[k] = v;
    }
  }
}

// Required in production — fail fast before any module loads
if (process.env.NODE_ENV === 'production') {
  const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'] as const;
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[env] FATAL: Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}
